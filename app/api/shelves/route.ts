import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stashId = request.nextUrl.searchParams.get('stashId')

    const where: any = {
      stash: {
        userId: session.user.id
      }
    }

    if (stashId) {
      where.stashId = stashId
    }

    const shelves = await prisma.shelf.findMany({
      where,
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
        },
        _count: {
          select: {
            shelfItems: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(shelves)
  } catch (error) {
    console.error('Error fetching shelves:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shelves' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, stashId, order, capacity, temp, humidity, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Verify stash belongs to user if stashId is provided
    if (stashId) {
      const stash = await prisma.stash.findFirst({
        where: {
          id: stashId,
          userId: session.user.id
        }
      })

      if (!stash) {
        return NextResponse.json(
          { error: 'Stash not found' },
          { status: 404 }
        )
      }
    }

    const shelf = await prisma.shelf.create({
      data: {
        name,
        stashId: stashId || null,
        order: order ?? null,
        capacity: capacity ?? null,
        temp: temp ?? null,
        humidity: humidity ?? null,
        description: description || null
      },
      include: {
        stash: true,
        shelfItems: true
      }
    })

    return NextResponse.json(shelf, { status: 201 })
  } catch (error) {
    console.error('Error creating shelf:', error)
    return NextResponse.json(
      { error: 'Failed to create shelf' },
      { status: 500 }
    )
  }
}

