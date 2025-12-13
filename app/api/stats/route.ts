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

    const userId = session.user.id

    // Get all bottles with related data
    const bottles = await prisma.bottle.findMany({
      where: { userId },
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

    // Get all stashes
    const stashes = await prisma.stash.findMany({
      where: { userId },
      include: {
        shelves: {
          include: {
            _count: {
              select: { shelfItems: true }
            }
          }
        }
      }
    })

    // Calculate stats
    const totalBottles = bottles.length
    const finishedBottles = bottles.filter(b => b.finished).length
    const activeBottles = totalBottles - finishedBottles
    const openBottles = bottles.filter(b => b.openDate && !b.finished).length

    // Type breakdown
    const wineBottles = bottles.filter(b => b.product.brand.type === 'WINE')
    const spiritBottles = bottles.filter(b => b.product.brand.type === 'SPIRIT')
    const beerBottles = bottles.filter(b => b.product.brand.type === 'BEER')

    // Value calculations
    const bottlesWithPrice = bottles.filter(b => b.purchasePrice && !b.finished)
    const totalInvestment = bottles
      .filter(b => b.purchasePrice)
      .reduce((sum, b) => sum + (b.purchasePrice || 0), 0)
    const averagePrice = bottlesWithPrice.length > 0 
      ? totalInvestment / bottlesWithPrice.length 
      : 0
    const mostExpensive = bottles
      .filter(b => b.purchasePrice && !b.finished)
      .sort((a, b) => (b.purchasePrice || 0) - (a.purchasePrice || 0))
      .slice(0, 5)

    // Brand distribution
    const brandCounts = bottles
      .filter(b => !b.finished)
      .reduce((acc, bottle) => {
        const brandName = bottle.product.brand.name
        acc[brandName] = (acc[brandName] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const topBrands = Object.entries(brandCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // Recent additions
    const recentAdditions = bottles
      .filter(b => !b.finished)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)

    // Stash distribution
    const stashStats = stashes.map(stash => {
      const totalInStash = stash.shelves.reduce(
        (sum, shelf) => sum + shelf._count.shelfItems,
        0
      )
      return {
        id: stash.id,
        name: stash.name,
        type: stash.type,
        location: stash.location,
        bottleCount: totalInStash,
        shelfCount: stash.shelves.length
      }
    })

    // Wine-specific stats
    const wineStats = wineBottles.length > 0 ? {
      total: wineBottles.length,
      active: wineBottles.filter(b => !b.finished).length,
      byVarietal: wineBottles
        .filter(b => !b.finished && b.product.wineData?.varietal)
        .reduce((acc, bottle) => {
          const varietal = bottle.product.wineData?.varietal || 'Unknown'
          acc[varietal] = (acc[varietal] || 0) + 1
          return acc
        }, {} as Record<string, number>),
      byRegion: wineBottles
        .filter(b => !b.finished && b.product.wineData?.region)
        .reduce((acc, bottle) => {
          const region = bottle.product.wineData?.region || 'Unknown'
          acc[region] = (acc[region] || 0) + 1
          return acc
        }, {} as Record<string, number>),
      byStyle: wineBottles
        .filter(b => !b.finished && b.product.wineData?.style)
        .reduce((acc, bottle) => {
          const style = bottle.product.wineData?.style || 'Unknown'
          acc[style] = (acc[style] || 0) + 1
          return acc
        }, {} as Record<string, number>)
    } : null

    // Spirit-specific stats
    const spiritStats = spiritBottles.length > 0 ? {
      total: spiritBottles.length,
      active: spiritBottles.filter(b => !b.finished).length,
      byStyle: spiritBottles
        .filter(b => !b.finished && b.product.spiritData?.style)
        .reduce((acc, bottle) => {
          const style = bottle.product.spiritData?.style || 'Unknown'
          acc[style] = (acc[style] || 0) + 1
          return acc
        }, {} as Record<string, number>),
      byRegion: spiritBottles
        .filter(b => !b.finished && b.product.spiritData?.region)
        .reduce((acc, bottle) => {
          const region = bottle.product.spiritData?.region || 'Unknown'
          acc[region] = (acc[region] || 0) + 1
          return acc
        }, {} as Record<string, number>),
      aged: spiritBottles.filter(b => !b.finished && b.product.spiritData?.ageStatement).length,
      averageProof: spiritBottles
        .filter(b => !b.finished && b.product.spiritData?.proof)
        .reduce((sum, b) => sum + (b.product.spiritData?.proof || 0), 0) / 
        spiritBottles.filter(b => !b.finished && b.product.spiritData?.proof).length || 0
    } : null

    // Time-based stats
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const bottlesAddedLast30Days = bottles.filter(
      b => new Date(b.createdAt) > thirtyDaysAgo
    ).length
    const bottlesFinishedLast30Days = bottles.filter(
      b => b.finishDate && new Date(b.finishDate) > thirtyDaysAgo
    ).length

    return NextResponse.json({
      overview: {
        totalBottles,
        activeBottles,
        finishedBottles,
        openBottles,
        totalStashes: stashes.length
      },
      types: {
        wine: wineBottles.length,
        spirit: spiritBottles.length,
        beer: beerBottles.length
      },
      financial: {
        totalInvestment: Math.round(totalInvestment * 100) / 100,
        averagePrice: Math.round(averagePrice * 100) / 100,
        mostExpensive
      },
      topBrands,
      recentAdditions,
      stashStats,
      wineStats,
      spiritStats,
      recentActivity: {
        addedLast30Days: bottlesAddedLast30Days,
        finishedLast30Days: bottlesFinishedLast30Days
      }
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
