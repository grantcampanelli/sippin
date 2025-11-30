import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

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
    const { name, location, type, description, imageUrl, shelves } = body

    // Verify stash belongs to user
    const existingStash = await prisma.stash.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        shelves: {
          include: {
            _count: {
              select: {
                shelfItems: true
              }
            }
          }
        }
      }
    })

    if (!existingStash) {
      return NextResponse.json({ error: 'Stash not found' }, { status: 404 })
    }

    // Update stash and shelves in a transaction
    const updatedStash = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update stash basic info
      const stash = await tx.stash.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(location !== undefined && { location }),
          ...(type !== undefined && { type }),
          ...(description !== undefined && { description }),
          ...(imageUrl !== undefined && { imageUrl })
        }
      })

      // Handle shelves if provided
      if (shelves !== undefined && Array.isArray(shelves)) {
        const existingShelfIds = existingStash.shelves.map((s: { id: string }) => s.id)
        const incomingShelfIds = shelves
          .filter((s: { id?: string }) => s.id)
          .map((s: { id: string }) => s.id)

        // Delete shelves that are no longer in the list (only if they have no items)
        const shelvesToDelete = existingShelfIds.filter(
          (existingId: string) => !incomingShelfIds.includes(existingId)
        )

        for (const shelfId of shelvesToDelete) {
          const shelf = existingStash.shelves.find((s: { id: string }) => s.id === shelfId)
          if (shelf && shelf._count.shelfItems === 0) {
            await tx.shelf.delete({ where: { id: shelfId } })
          }
        }

        // Update or create shelves
        for (let i = 0; i < shelves.length; i++) {
          const shelfData = shelves[i] as {
            id?: string
            name: string
            capacity?: number | null
            temp?: number | null
            humidity?: number | null
            description?: string | null
          }
          const order = i + 1

          if (shelfData.id) {
            // Update existing shelf
            await tx.shelf.update({
              where: { id: shelfData.id },
              data: {
                name: shelfData.name,
                order,
                capacity: shelfData.capacity ?? null,
                temp: shelfData.temp ?? null,
                humidity: shelfData.humidity ?? null,
                description: shelfData.description ?? null
              }
            })
          } else {
            // Create new shelf
            await tx.shelf.create({
              data: {
                name: shelfData.name || `Shelf ${order}`,
                order,
                capacity: shelfData.capacity ?? null,
                temp: shelfData.temp ?? null,
                humidity: shelfData.humidity ?? null,
                description: shelfData.description ?? null,
                stashId: id
              }
            })
          }
        }
      }

      // Return updated stash with shelves
      return await tx.stash.findUnique({
        where: { id },
        include: {
          shelves: {
            orderBy: {
              order: 'asc'
            },
            include: {
              _count: {
                select: {
                  shelfItems: true
                }
              }
            }
          }
        }
      })
    })

    return NextResponse.json(updatedStash)
  } catch (error) {
    console.error('Error updating stash:', error)
    return NextResponse.json(
      { error: 'Failed to update stash', details: error instanceof Error ? error.message : String(error) },
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

