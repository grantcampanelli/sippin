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
    const { name, location, type, description, imageUrl } = body

    if (!name || !location || !type) {
      return NextResponse.json(
        { error: 'Name, location, and type are required' },
        { status: 400 }
      )
    }

    const stash = await prisma.stash.create({
      data: {
        name,
        location,
        type,
        description,
        imageUrl,
        userId: session.user.id
      },
      include: {
        shelves: true
      }
    })

    return NextResponse.json(stash, { status: 201 })
  } catch (error) {
    console.error('Error creating stash:', error)
    return NextResponse.json(
      { error: 'Failed to create stash' },
      { status: 500 }
    )
  }
}

