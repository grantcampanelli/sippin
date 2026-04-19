import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Ownership check: the tasting must belong to a bottle owned by this user.
  const result = await prisma.tastingEntry.deleteMany({
    where: { id, bottle: { userId: session.user.id } },
  })

  if (result.count === 0) {
    return NextResponse.json({ error: 'Tasting entry not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
