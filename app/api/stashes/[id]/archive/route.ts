import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { archived, removeItems } = body

    if (typeof archived !== 'boolean') {
      return NextResponse.json(
        { error: 'archived must be a boolean' },
        { status: 400 }
      )
    }

    // Verify stash belongs to user
    const stash = await prisma.stash.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        shelves: {
          include: {
            shelfItems: true
          }
        }
      }
    })

    if (!stash) {
      return NextResponse.json(
        { error: 'Stash not found' },
        { status: 404 }
      )
    }

    // If removing items, delete all shelf items from this stash's shelves
    if (removeItems === true) {
      const shelfIds = stash.shelves.map((shelf: { id: string }) => shelf.id)
      await prisma.shelfItem.deleteMany({
        where: {
          shelfId: {
            in: shelfIds
          }
        }
      })
    }

    const updatedStash = await prisma.stash.update({
      where: { id },
      data: { archived },
      include: {
        shelves: {
          include: {
            _count: {
              select: { shelfItems: true }
            }
          }
        },
        _count: {
          select: { shelves: true }
        }
      }
    })

    return NextResponse.json(updatedStash)
  } catch (error) {
    console.error('Error archiving stash:', error)
    return NextResponse.json(
      { error: 'Failed to archive stash' },
      { status: 500 }
    )
  }
}

