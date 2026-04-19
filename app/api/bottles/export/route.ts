import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// CSV RFC 4180 — quote and escape embedded quotes.
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = value instanceof Date ? value.toISOString().slice(0, 10) : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

const COLUMNS = [
  'id',
  'brand',
  'brandType',
  'productName',
  'vintage',
  'varietal',
  'region',
  'style',
  'ageStatement',
  'distillery',
  'proof',
  'abv',
  'size',
  'purchasePrice',
  'purchaseCurrency',
  'purchaseDate',
  'purchaseLocation',
  'openDate',
  'finished',
  'finishDate',
  'amountRemaining',
  'rating',
  'notes',
  'giftFrom',
  'giftOccasion',
  'stash',
  'shelf',
  'createdAt',
] as const

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bottles = await prisma.bottle.findMany({
    where: { userId: session.user.id },
    include: {
      product: { include: { brand: true, wineData: true, spiritData: true } },
      shelfItem: { include: { shelf: { include: { stash: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const rows: string[] = [COLUMNS.join(',')]
  for (const b of bottles) {
    const p = b.product
    const wine = p.wineData
    const spirit = p.spiritData
    const shelf = b.shelfItem?.shelf
    const abv = wine?.abv ?? spirit?.abv ?? null

    rows.push(
      [
        b.id,
        p.brand.name,
        p.brand.type,
        p.name,
        wine?.vintage,
        wine?.varietal,
        wine?.region ?? spirit?.region,
        wine?.style ?? spirit?.style,
        spirit?.ageStatement,
        spirit?.distillery,
        spirit?.proof,
        abv,
        b.size,
        b.purchasePrice,
        b.purchaseCurrency,
        b.purchaseDate,
        b.purchaseLocation,
        b.openDate,
        b.finished,
        b.finishDate,
        b.amountRemaining,
        b.rating,
        b.notes,
        b.giftFrom,
        b.giftOccasion,
        shelf?.stash?.name,
        shelf?.name,
        b.createdAt,
      ]
        .map(csvCell)
        .join(','),
    )
  }

  const csv = rows.join('\n')
  const filename = `sippin-bottles-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
