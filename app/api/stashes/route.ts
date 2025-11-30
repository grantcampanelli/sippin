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

    const searchParams = request.nextUrl.searchParams
    const includeArchived = searchParams.get('includeArchived') === 'true'

    const where: any = {
      userId: session.user.id
    }

    if (!includeArchived) {
      // Show only non-archived stashes
      where.archived = false
    }

    const stashes = await prisma.stash.findMany({
      where,
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
        },
        _count: {
          select: {
            shelves: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(stashes)
  } catch (error) {
    console.error('Error fetching stashes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stashes', details: error instanceof Error ? error.message : String(error) },
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
    const { name, location, type, description, imageUrl, shelves } = body

    if (!name || !location || !type) {
      return NextResponse.json(
        { error: 'Name, location, and type are required' },
        { status: 400 }
      )
    }

    // If no shelves provided, create a default single shelf
    const shelvesToCreate = shelves && shelves.length > 0 
      ? shelves 
      : [{ name: 'Default Shelf' }]

    // Create stash with shelves in a transaction
    const stash = await prisma.stash.create({
      data: {
        name,
        location,
        type,
        description,
        imageUrl,
        userId: session.user.id,
        shelves: {
          create: shelvesToCreate.map((shelf: any, index: number) => ({
            name: shelf.name || `Shelf ${index + 1}`,
            order: shelf.order ?? index + 1,
            capacity: shelf.capacity ?? null,
            temp: shelf.temp ?? null,
            humidity: shelf.humidity ?? null,
            description: shelf.description ?? null
          }))
        }
      },
      include: {
        shelves: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json(stash, { status: 201 })
  } catch (error) {
    console.error('Error creating stash:', error)
    return NextResponse.json(
      { error: 'Failed to create stash', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

