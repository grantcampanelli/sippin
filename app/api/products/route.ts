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
    const brandId = searchParams.get('brandId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    if (brandId) {
      where.brandId = brandId
    }

    if (search) {
      if (brandId) {
        // If brand is selected, only search within that brand
        where.name = { contains: search, mode: 'insensitive' }
      } else {
        // For multi-word queries, we want to match products where:
        // - All words appear somewhere (brand name OR product name OR other fields)
        // This allows "just iso" to match brand "Justin" + product "Isosceles"
        const searchWords = search.trim().split(/\s+/).filter(w => w.length > 0)
        
        if (searchWords.length > 1) {
          // Multi-word: create AND conditions - each word must match somewhere
          where.AND = searchWords.map(word => ({
            OR: [
              { name: { contains: word, mode: 'insensitive' } },
              { brand: { name: { contains: word, mode: 'insensitive' } } }
            ]
          }))
        } else {
          // Single word: simple OR search
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { brand: { name: { contains: search, mode: 'insensitive' } } }
          ]
        }
      }
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        brand: true,
        wineData: true,
        spiritData: true
      },
      take: limit,
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
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
      brandId,
      wineData,
      spiritData
    } = body

    if (!name || !brandId) {
      return NextResponse.json(
        { error: 'Product name and brand ID are required' },
        { status: 400 }
      )
    }

    // Verify brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: brandId }
    })

    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      )
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        brandId,
        ...(wineData && {
          wineData: {
            create: wineData
          }
        }),
        ...(spiritData && {
          spiritData: {
            create: spiritData
          }
        })
      },
      include: {
        brand: true,
        wineData: true,
        spiritData: true
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

