import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function trimOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

async function userOwnsBottle(bottleId: string, userId: string): Promise<boolean> {
  const bottle = await prisma.bottle.findFirst({
    where: { id: bottleId, userId },
    select: { id: true },
  })
  return bottle !== null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (!(await userOwnsBottle(id, session.user.id))) {
    return NextResponse.json({ error: 'Bottle not found' }, { status: 404 })
  }

  const entries = await prisma.tastingEntry.findMany({
    where: { bottleId: id },
    orderBy: { tastedAt: 'desc' },
  })

  return NextResponse.json(entries)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (!(await userOwnsBottle(id, session.user.id))) {
    return NextResponse.json({ error: 'Bottle not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const nose = trimOrNull(body.nose)
  const palate = trimOrNull(body.palate)
  const finish = trimOrNull(body.finish)
  const context = trimOrNull(body.context)

  let rating: number | null = null
  if (body.rating !== undefined && body.rating !== null && body.rating !== '') {
    const parsed = Number(body.rating)
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      return NextResponse.json(
        { error: 'Rating must be a number between 0 and 100' },
        { status: 400 },
      )
    }
    rating = Math.round(parsed)
  }

  let tastedAt: Date | undefined
  if (body.tastedAt) {
    const parsed = new Date(body.tastedAt)
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'Invalid tastedAt' }, { status: 400 })
    }
    tastedAt = parsed
  }

  if (!nose && !palate && !finish && !context && rating === null) {
    return NextResponse.json(
      { error: 'Provide at least one of nose, palate, finish, context, or rating' },
      { status: 400 },
    )
  }

  const entry = await prisma.tastingEntry.create({
    data: {
      bottleId: id,
      nose,
      palate,
      finish,
      context,
      rating,
      ...(tastedAt && { tastedAt }),
    },
  })

  return NextResponse.json(entry, { status: 201 })
}
