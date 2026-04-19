import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type AggRow = {
  productId: string
  total: bigint
  active: bigint
  finished: bigint
  totalValue: number | null
  avgRating: number | null
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const includeFinished = request.nextUrl.searchParams.get('includeFinished') === 'true'
    const userId = session.user.id

    const finishedFilter = includeFinished
      ? Prisma.empty
      : Prisma.sql` AND "finished" = false`

    const rows = await prisma.$queryRaw<AggRow[]>`
      SELECT
        "productId",
        COUNT(*)::bigint AS total,
        COUNT(*) FILTER (WHERE NOT "finished")::bigint AS active,
        COUNT(*) FILTER (WHERE "finished")::bigint AS finished,
        SUM("purchasePrice")::float AS "totalValue",
        AVG("rating")::float AS "avgRating"
      FROM "Bottle"
      WHERE "userId" = ${userId}${finishedFilter}
      GROUP BY "productId"
    `

    if (rows.length === 0) {
      return NextResponse.json([])
    }

    const products = await prisma.product.findMany({
      where: { id: { in: rows.map((r) => r.productId) } },
      include: { brand: true, wineData: true, spiritData: true },
    })
    const productMap = new Map(products.map((p) => [p.id, p]))

    const aggregated = rows
      .map((row) => ({
        product: productMap.get(row.productId),
        totalCount: Number(row.total),
        activeCount: Number(row.active),
        finishedCount: Number(row.finished),
        totalValue: row.totalValue ?? 0,
        averageRating: row.avgRating,
      }))
      .filter((entry) => entry.product !== undefined)
      .sort(
        (a, b) => b.activeCount - a.activeCount || b.totalCount - a.totalCount,
      )

    return NextResponse.json(aggregated)
  } catch (error) {
    console.error('Error fetching bottle inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bottle inventory' },
      { status: 500 },
    )
  }
}
