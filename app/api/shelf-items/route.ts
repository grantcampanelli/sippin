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

