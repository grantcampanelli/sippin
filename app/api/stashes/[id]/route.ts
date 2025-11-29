import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const stash = await prisma.stash.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        shelves: {
          orderBy: {
            order: 'asc'
          },
          include: {
            shelfItems: {
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
              },
              orderBy: {
                order: 'asc'
              }
            },
            _count: {
              select: {
                shelfItems: true
              }
            }
          }
        }
      }
    })

    if (!stash) {
      return NextResponse.json({ error: 'Stash not found' }, { status: 404 })
    }

    return NextResponse.json(stash)
  } catch (error) {
    console.error('Error fetching stash:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stash' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const { name, location, type, description, imageUrl } = body

    const stash = await prisma.stash.updateMany({
      where: {
        id,
        userId: session.user.id
      },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(type && { type }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl })
      }
    })

    if (stash.count === 0) {
      return NextResponse.json({ error: 'Stash not found' }, { status: 404 })
    }

    const updatedStash = await prisma.stash.findUnique({
      where: { id },
      include: {
        shelves: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json(updatedStash)
  } catch (error) {
    console.error('Error updating stash:', error)
    return NextResponse.json(
      { error: 'Failed to update stash' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    let removeItems = false
    try {
      const body = await request.json()
      removeItems = body.removeItems === true
    } catch {
      // Body is optional, default to false
    }

    // Verify stash belongs to user and get shelves
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
      return NextResponse.json({ error: 'Stash not found' }, { status: 404 })
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

    // Delete the stash (cascades will handle shelves and remaining shelf items)
    await prisma.stash.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting stash:', error)
    return NextResponse.json(
      { error: 'Failed to delete stash' },
      { status: 500 }
    )
  }
}

