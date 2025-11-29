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
    const bottle = await prisma.bottle.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        product: {
          include: {
            brand: true,
            wineData: true,
            spiritData: true
          }
        },
        shelfItem: {
          include: {
            shelf: {
              include: {
                stash: true
              }
            }
          }
        }
      }
    })

    if (!bottle) {
      return NextResponse.json({ error: 'Bottle not found' }, { status: 404 })
    }

    return NextResponse.json(bottle)
  } catch (error) {
    console.error('Error fetching bottle:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bottle' },
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
    const {
      size,
      servingSize,
      purchasePrice,
      purchaseDate,
      purchaseLocation,
      openDate,
      finished,
      finishDate,
      amountRemaining,
      notes,
      rating,
      imageUrl
    } = body

    const updateData: any = {}
    
    if (size !== undefined) updateData.size = size
    if (servingSize !== undefined) updateData.servingSize = servingSize
    if (purchasePrice !== undefined) updateData.purchasePrice = purchasePrice
    if (purchaseDate !== undefined) updateData.purchaseDate = purchaseDate ? new Date(purchaseDate) : null
    if (purchaseLocation !== undefined) updateData.purchaseLocation = purchaseLocation
    if (openDate !== undefined) updateData.openDate = openDate ? new Date(openDate) : null
    if (finished !== undefined) updateData.finished = finished
    if (finishDate !== undefined) updateData.finishDate = finishDate ? new Date(finishDate) : null
    if (amountRemaining !== undefined) updateData.amountRemaining = amountRemaining
    if (notes !== undefined) updateData.notes = notes
    if (rating !== undefined) updateData.rating = rating
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    const bottle = await prisma.bottle.updateMany({
      where: {
        id,
        userId: session.user.id
      },
      data: updateData
    })

    if (bottle.count === 0) {
      return NextResponse.json({ error: 'Bottle not found' }, { status: 404 })
    }

    const updatedBottle = await prisma.bottle.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            brand: true,
            wineData: true,
            spiritData: true
          }
        },
        shelfItem: {
          include: {
            shelf: {
              include: {
                stash: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedBottle)
  } catch (error) {
    console.error('Error updating bottle:', error)
    return NextResponse.json(
      { error: 'Failed to update bottle' },
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
    const bottle = await prisma.bottle.deleteMany({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (bottle.count === 0) {
      return NextResponse.json({ error: 'Bottle not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bottle:', error)
    return NextResponse.json(
      { error: 'Failed to delete bottle' },
      { status: 500 }
    )
  }
}

