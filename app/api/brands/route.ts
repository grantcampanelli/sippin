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
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    if (type) {
      where.type = type
    }

    const brands = await prisma.brand.findMany({
      where,
      take: limit,
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(brands)
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
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
    const {
      name,
      type,
      country,
      website,
      description
    } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Brand name and type are required' },
        { status: 400 }
      )
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        type,
        country: country || null,
        website: website || null,
        description: description || null
      }
    })

    return NextResponse.json(brand, { status: 201 })
  } catch (error) {
    console.error('Error creating brand:', error)
    return NextResponse.json(
      { error: 'Failed to create brand' },
      { status: 500 }
    )
  }
}

