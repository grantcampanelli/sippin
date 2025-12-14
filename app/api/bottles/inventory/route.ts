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
    const includeFinished = searchParams.get('includeFinished') === 'true'

    // Get all bottles for the user
    const bottles = await prisma.bottle.findMany({
      where: {
        userId: session.user.id,
        ...(includeFinished ? {} : { finished: false })
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

    // Aggregate bottles by product
    const productMap = new Map<string, {
      product: any
      totalCount: number
      activeCount: number
      finishedCount: number
      bottles: any[]
      totalValue: number
      averageRating: number | null
    }>()

    bottles.forEach(bottle => {
      const productId = bottle.productId
      
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          product: bottle.product,
          totalCount: 0,
          activeCount: 0,
          finishedCount: 0,
          bottles: [],
          totalValue: 0,
          averageRating: null
        })
      }

      const entry = productMap.get(productId)!
      entry.totalCount++
      entry.bottles.push(bottle)
      
      if (bottle.finished) {
        entry.finishedCount++
      } else {
        entry.activeCount++
      }

      if (bottle.purchasePrice) {
        entry.totalValue += bottle.purchasePrice
      }
    })

    // Calculate average ratings
    productMap.forEach(entry => {
      const ratedBottles = entry.bottles.filter(b => b.rating !== null)
      if (ratedBottles.length > 0) {
        const sum = ratedBottles.reduce((acc, b) => acc + b.rating!, 0)
        entry.averageRating = sum / ratedBottles.length
      }
    })

    // Convert map to array and sort by active count (descending)
    const aggregatedProducts = Array.from(productMap.values())
      .sort((a, b) => b.activeCount - a.activeCount || b.totalCount - a.totalCount)
      .map(({ bottles, ...rest }) => rest) // Remove bottles array from response for cleaner data

    return NextResponse.json(aggregatedProducts)
  } catch (error) {
    console.error('Error fetching bottle inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bottle inventory' },
      { status: 500 }
    )
  }
}
