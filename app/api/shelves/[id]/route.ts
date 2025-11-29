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
    const shelf = await prisma.shelf.findFirst({
      where: {
        id,
        stash: {
          userId: session.user.id
        }
      },
      include: {
        stash: true,
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
        }
      }
    })

    if (!shelf) {
      return NextResponse.json({ error: 'Shelf not found' }, { status: 404 })
    }

    return NextResponse.json(shelf)
  } catch (error) {
    console.error('Error fetching shelf:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shelf' },
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
    const { name, order, capacity, temp, humidity, description } = body

    const shelf = await prisma.shelf.updateMany({
      where: {
        id,
        stash: {
          userId: session.user.id
        }
      },
      data: {
        ...(name && { name }),
        ...(order !== undefined && { order }),
        ...(capacity !== undefined && { capacity }),
        ...(temp !== undefined && { temp }),
        ...(humidity !== undefined && { humidity }),
        ...(description !== undefined && { description })
      }
    })

    if (shelf.count === 0) {
      return NextResponse.json({ error: 'Shelf not found' }, { status: 404 })
    }

    const updatedShelf = await prisma.shelf.findUnique({
      where: { id },
      include: {
        stash: true,
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
        }
      }
    })

    return NextResponse.json(updatedShelf)
  } catch (error) {
    console.error('Error updating shelf:', error)
    return NextResponse.json(
      { error: 'Failed to update shelf' },
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
    const shelf = await prisma.shelf.deleteMany({
      where: {
        id,
        stash: {
          userId: session.user.id
        }
      }
    })

    if (shelf.count === 0) {
      return NextResponse.json({ error: 'Shelf not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shelf:', error)
    return NextResponse.json(
      { error: 'Failed to delete shelf' },
      { status: 500 }
    )
  }
}

