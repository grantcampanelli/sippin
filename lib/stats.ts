import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

const bottleWithProduct = {
  product: {
    include: {
      brand: true,
      wineData: true,
      spiritData: true,
    },
  },
} satisfies Prisma.BottleInclude

type BottleWithProduct = Prisma.BottleGetPayload<{ include: typeof bottleWithProduct }>

export type UserStats = {
  overview: {
    totalBottles: number
    activeBottles: number
    finishedBottles: number
    openBottles: number
    totalStashes: number
  }
  types: { wine: number; spirit: number; beer: number }
  financial: {
    totalInvestment: number
    averagePrice: number
    mostExpensive: BottleWithProduct[]
  }
  topBrands: Array<{ name: string; count: number }>
  recentAdditions: BottleWithProduct[]
  stashStats: Array<{
    id: string
    name: string
    type: string
    location: string
    bottleCount: number
    shelfCount: number
  }>
  wineStats: {
    total: number
    active: number
    byVarietal: Record<string, number>
    byRegion: Record<string, number>
    byStyle: Record<string, number>
  } | null
  spiritStats: {
    total: number
    active: number
    byStyle: Record<string, number>
    byRegion: Record<string, number>
    aged: number
    averageProof: number
  } | null
  recentActivity: { addedLast30Days: number; finishedLast30Days: number }
}

type KeyedCountRow<K extends string> = { [key in K]: string | null } & { count: bigint }

function rowsToRecord<K extends string>(rows: KeyedCountRow<K>[], key: K): Record<string, number> {
  const out: Record<string, number> = {}
  for (const row of rows) {
    const name = row[key]
    if (name) out[name] = Number(row.count)
  }
  return out
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS)

  const [
    totalBottles,
    finishedBottles,
    openBottles,
    wineActive,
    spiritActive,
    beerActive,
    wineTotal,
    spiritTotal,
    financialAgg,
    mostExpensive,
    recentAdditions,
    addedLast30,
    finishedLast30,
    stashes,
    topBrandsRaw,
    wineVarietalRaw,
    wineRegionRaw,
    wineStyleRaw,
    spiritStyleRaw,
    spiritRegionRaw,
    spiritAgedCount,
    spiritProofAvgRaw,
  ] = await Promise.all([
    prisma.bottle.count({ where: { userId } }),
    prisma.bottle.count({ where: { userId, finished: true } }),
    prisma.bottle.count({ where: { userId, finished: false, openDate: { not: null } } }),
    prisma.bottle.count({
      where: { userId, finished: false, product: { brand: { type: 'WINE' } } },
    }),
    prisma.bottle.count({
      where: { userId, finished: false, product: { brand: { type: 'SPIRIT' } } },
    }),
    prisma.bottle.count({
      where: { userId, finished: false, product: { brand: { type: 'BEER' } } },
    }),
    prisma.bottle.count({ where: { userId, product: { brand: { type: 'WINE' } } } }),
    prisma.bottle.count({ where: { userId, product: { brand: { type: 'SPIRIT' } } } }),
    prisma.bottle.aggregate({
      where: { userId, finished: false, purchasePrice: { not: null } },
      _sum: { purchasePrice: true },
      _avg: { purchasePrice: true },
    }),
    prisma.bottle.findMany({
      where: { userId, finished: false, purchasePrice: { not: null } },
      orderBy: { purchasePrice: 'desc' },
      take: 5,
      include: bottleWithProduct,
    }),
    prisma.bottle.findMany({
      where: { userId, finished: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: bottleWithProduct,
    }),
    prisma.bottle.count({ where: { userId, createdAt: { gt: thirtyDaysAgo } } }),
    prisma.bottle.count({ where: { userId, finishDate: { gt: thirtyDaysAgo } } }),
    prisma.stash.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        type: true,
        location: true,
        shelves: { select: { _count: { select: { shelfItems: true } } } },
      },
    }),
    prisma.$queryRaw<Array<{ name: string; count: bigint }>>`
      SELECT b."name", COUNT(*)::bigint as count
      FROM "Bottle" bot
      JOIN "Product" p ON bot."productId" = p."id"
      JOIN "Brand" b ON p."brandId" = b."id"
      WHERE bot."userId" = ${userId} AND bot."finished" = false
      GROUP BY b."name"
      ORDER BY count DESC
      LIMIT 5
    `,
    prisma.$queryRaw<KeyedCountRow<'varietal'>[]>`
      SELECT w."varietal", COUNT(*)::bigint as count
      FROM "Bottle" bot
      JOIN "WineProduct" w ON w."productId" = bot."productId"
      WHERE bot."userId" = ${userId} AND bot."finished" = false AND w."varietal" IS NOT NULL
      GROUP BY w."varietal"
      ORDER BY count DESC
    `,
    prisma.$queryRaw<KeyedCountRow<'region'>[]>`
      SELECT w."region", COUNT(*)::bigint as count
      FROM "Bottle" bot
      JOIN "WineProduct" w ON w."productId" = bot."productId"
      WHERE bot."userId" = ${userId} AND bot."finished" = false AND w."region" IS NOT NULL
      GROUP BY w."region"
      ORDER BY count DESC
    `,
    prisma.$queryRaw<KeyedCountRow<'style'>[]>`
      SELECT w."style", COUNT(*)::bigint as count
      FROM "Bottle" bot
      JOIN "WineProduct" w ON w."productId" = bot."productId"
      WHERE bot."userId" = ${userId} AND bot."finished" = false AND w."style" IS NOT NULL
      GROUP BY w."style"
      ORDER BY count DESC
    `,
    prisma.$queryRaw<KeyedCountRow<'style'>[]>`
      SELECT s."style", COUNT(*)::bigint as count
      FROM "Bottle" bot
      JOIN "SpiritProduct" s ON s."productId" = bot."productId"
      WHERE bot."userId" = ${userId} AND bot."finished" = false AND s."style" IS NOT NULL
      GROUP BY s."style"
      ORDER BY count DESC
    `,
    prisma.$queryRaw<KeyedCountRow<'region'>[]>`
      SELECT s."region", COUNT(*)::bigint as count
      FROM "Bottle" bot
      JOIN "SpiritProduct" s ON s."productId" = bot."productId"
      WHERE bot."userId" = ${userId} AND bot."finished" = false AND s."region" IS NOT NULL
      GROUP BY s."region"
      ORDER BY count DESC
    `,
    prisma.bottle.count({
      where: {
        userId,
        finished: false,
        product: { spiritData: { ageStatement: { not: null } } },
      },
    }),
    prisma.$queryRaw<Array<{ avg: number | null }>>`
      SELECT AVG(s."proof")::float as avg
      FROM "Bottle" bot
      JOIN "SpiritProduct" s ON s."productId" = bot."productId"
      WHERE bot."userId" = ${userId} AND bot."finished" = false AND s."proof" IS NOT NULL
    `,
  ])

  const activeBottles = totalBottles - finishedBottles
  const roundMoney = (n: number) => Math.round(n * 100) / 100

  return {
    overview: {
      totalBottles,
      activeBottles,
      finishedBottles,
      openBottles,
      totalStashes: stashes.length,
    },
    types: { wine: wineActive, spirit: spiritActive, beer: beerActive },
    financial: {
      totalInvestment: roundMoney(financialAgg._sum.purchasePrice ?? 0),
      averagePrice: roundMoney(financialAgg._avg.purchasePrice ?? 0),
      mostExpensive,
    },
    topBrands: topBrandsRaw.map((r) => ({ name: r.name, count: Number(r.count) })),
    recentAdditions,
    stashStats: stashes.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      location: s.location,
      bottleCount: s.shelves.reduce((sum, sh) => sum + sh._count.shelfItems, 0),
      shelfCount: s.shelves.length,
    })),
    wineStats:
      wineTotal > 0
        ? {
            total: wineTotal,
            active: wineActive,
            byVarietal: rowsToRecord(wineVarietalRaw, 'varietal'),
            byRegion: rowsToRecord(wineRegionRaw, 'region'),
            byStyle: rowsToRecord(wineStyleRaw, 'style'),
          }
        : null,
    spiritStats:
      spiritTotal > 0
        ? {
            total: spiritTotal,
            active: spiritActive,
            byStyle: rowsToRecord(spiritStyleRaw, 'style'),
            byRegion: rowsToRecord(spiritRegionRaw, 'region'),
            aged: spiritAgedCount,
            averageProof: spiritProofAvgRaw[0]?.avg ?? 0,
          }
        : null,
    recentActivity: {
      addedLast30Days: addedLast30,
      finishedLast30Days: finishedLast30,
    },
  }
}
