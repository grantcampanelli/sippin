import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bottleId, shelfId, order } = body

    if (!bottleId || !shelfId) {
      return NextResponse.json(
        { error: 'Bottle ID and Shelf ID are required' },
        { status: 400 }
      )
    }

    // Verify bottle belongs to user
    const bottle = await prisma.bottle.findFirst({
      where: {
        id: bottleId,
        userId: session.user.id
      }
    })

    if (!bottle) {
      return NextResponse.json(
        { error: 'Bottle not found' },
        { status: 404 }
      )
    }

    // Verify shelf belongs to user
    const shelf = await prisma.shelf.findFirst({
      where: {
        id: shelfId,
        stash: {
          userId: session.user.id
        }
      }
    })

    if (!shelf) {
      return NextResponse.json(
        { error: 'Shelf not found' },
        { status: 404 }
      )
    }

    // Check if bottle is already on a shelf
    const existingShelfItem = await prisma.shelfItem.findUnique({
      where: { bottleId }
    })

    if (existingShelfItem) {
      return NextResponse.json(
        { error: 'Bottle is already on a shelf' },
        { status: 400 }
      )
    }

    const shelfItem = await prisma.shelfItem.create({
      data: {
        bottleId,
        shelfId,
        order: order ?? 0
      },
      include: {
        bottle: {
          include: {
            product: {
              include: {
                brand: true,
                wineData: true,
                spiritData: true
              }
            }
          }
        },
        shelf: {
          include: {
            stash: true
          }
        }
      }
    })

    return NextResponse.json(shelfItem, { status: 201 })
  } catch (error) {
    console.error('Error creating shelf item:', error)
    return NextResponse.json(
      { error: 'Failed to create shelf item' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bottleId = request.nextUrl.searchParams.get('bottleId')

    if (!bottleId) {
      return NextResponse.json(
        { error: 'Bottle ID is required' },
        { status: 400 }
      )
    }

    // Verify bottle belongs to user
    const bottle = await prisma.bottle.findFirst({
      where: {
        id: bottleId,
        userId: session.user.id
      }
    })

    if (!bottle) {
      return NextResponse.json(
        { error: 'Bottle not found' },
        { status: 404 }
      )
    }

    await prisma.shelfItem.deleteMany({
      where: {
        bottleId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shelf item:', error)
    return NextResponse.json(
      { error: 'Failed to delete shelf item' },
      { status: 500 }
    )
  }
}

// Bulk add bottles to a shelf
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bottleIds, shelfId } = body

    if (!bottleIds || !Array.isArray(bottleIds) || bottleIds.length === 0) {
      return NextResponse.json(
        { error: 'Bottle IDs array is required' },
        { status: 400 }
      )
    }

    if (!shelfId) {
      return NextResponse.json(
        { error: 'Shelf ID is required' },
        { status: 400 }
      )
    }

    // Verify shelf belongs to user
    const shelf = await prisma.shelf.findFirst({
      where: {
        id: shelfId,
        stash: {
          userId: session.user.id
        }
      },
      include: {
        shelfItems: true,
        _count: {
          select: {
            shelfItems: true
          }
        }
      }
    })

    if (!shelf) {
      return NextResponse.json(
        { error: 'Shelf not found' },
        { status: 404 }
      )
    }

    // Check capacity if set
    if (shelf.capacity !== null) {
      const currentCount = shelf._count.shelfItems
      const newCount = currentCount + bottleIds.length
      if (newCount > shelf.capacity) {
        return NextResponse.json(
          { error: `Shelf capacity exceeded. Can only add ${shelf.capacity - currentCount} more bottle(s)` },
          { status: 400 }
        )
      }
    }

    // Verify all bottles belong to user and are not already on a shelf
    const bottles = await prisma.bottle.findMany({
      where: {
        id: { in: bottleIds },
        userId: session.user.id,
        shelfItem: null // Not already on a shelf
      }
    })

    if (bottles.length !== bottleIds.length) {
      const foundIds = bottles.map((b: { id: string }) => b.id)
      const missingIds = bottleIds.filter((id: string) => !foundIds.includes(id))
      return NextResponse.json(
        { error: `Some bottles are not available or already on a shelf`, missingIds },
        { status: 400 }
      )
    }

    // Get the highest order number for this shelf
    const maxOrder = await prisma.shelfItem.findFirst({
      where: { shelfId },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const startOrder = (maxOrder?.order ?? -1) + 1

    // Create shelf items in bulk using Promise.all for better performance
    const shelfItems = await Promise.all(
      bottleIds.map((bottleId: string, index: number) =>
        prisma.shelfItem.create({
          data: {
            bottleId,
            shelfId,
            order: startOrder + index
          },
          include: {
            bottle: {
              include: {
                product: {
                  include: {
                    brand: true,
                    wineData: true,
                    spiritData: true
                  }
                }
              }
            }
          }
        })
      )
    )

    return NextResponse.json({ 
      success: true, 
      count: shelfItems.length,
      shelfItems 
    }, { status: 201 })
  } catch (error) {
    console.error('Error bulk adding shelf items:', error)
    return NextResponse.json(
      { error: 'Failed to add bottles to shelf', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

