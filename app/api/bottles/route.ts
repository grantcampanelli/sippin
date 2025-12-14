import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCloudinaryUrl } from '@/lib/cloudinary'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const finished = searchParams.get('finished')
    const productId = searchParams.get('productId')
    const availableOnly = searchParams.get('availableOnly') === 'true' // Not on any shelf

    const where: any = {
      userId: session.user.id
    }

    if (finished !== null) {
      where.finished = finished === 'true'
    }

    if (productId) {
      where.productId = productId
    }

    if (availableOnly) {
      where.shelfItem = null
    }

    const bottles = await prisma.bottle.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(bottles)
  } catch (error) {
    console.error('Error fetching bottles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bottles' },
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
      productId,
      size,
      servingSize,
      purchasePrice,
      purchaseDate,
      purchaseLocation,
      notes,
      amountRemaining,
      imageUrl
    } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Validate Cloudinary URL if provided
    if (imageUrl && !isCloudinaryUrl(imageUrl)) {
      return NextResponse.json(
        { error: 'Invalid image URL. Must be a Cloudinary URL.' },
        { status: 400 }
      )
    }

    const bottle = await prisma.bottle.create({
      data: {
        productId,
        size: size ?? null,
        servingSize: servingSize ?? null,
        purchasePrice: purchasePrice ?? null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchaseLocation: purchaseLocation || null,
        notes: notes || null,
        amountRemaining: amountRemaining ?? 100,
        imageUrl: imageUrl || null,
        userId: session.user.id
      },
      include: {
        product: {
          include: {
            brand: true,
            wineData: true,
            spiritData: true
          }
        }
      }
    })

    return NextResponse.json(bottle, { status: 201 })
  } catch (error) {
    console.error('Error creating bottle:', error)
    return NextResponse.json(
      { error: 'Failed to create bottle' },
      { status: 500 }
    )
  }
}

