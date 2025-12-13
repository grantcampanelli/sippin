import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { detectText } from '@/lib/vision'
import { prisma } from '@/lib/prisma'
import sharp from 'sharp'

// Wine-related keywords
const WINE_KEYWORDS = [
  'cabernet', 'merlot', 'pinot', 'chardonnay', 'sauvignon', 'syrah', 'shiraz',
  'zinfandel', 'malbec', 'riesling', 'moscato', 'sangiovese', 'tempranillo',
  'grenache', 'nebbiolo', 'barbera', 'viognier', 'gewurztraminer', 'chenin',
  'red wine', 'white wine', 'rose', 'rosé', 'wine', 'vintage', 'reserve',
  'estate', 'vineyard', 'winery', 'cuvee', 'cuvée', 'blend'
]

// Spirit-related keywords
const SPIRIT_KEYWORDS = [
  'whiskey', 'whisky', 'bourbon', 'scotch', 'rye', 'vodka', 'gin', 'rum',
  'tequila', 'cognac', 'brandy', 'mezcal', 'single malt', 'blended',
  'aged', 'year old', 'proof', 'distillery', 'distilled', 'cask', 'barrel',
  'kentucky', 'tennessee', 'islay', 'highland', 'speyside', 'lowland'
]

// Wine regions
const WINE_REGIONS = [
  'napa', 'sonoma', 'bordeaux', 'burgundy', 'champagne', 'rioja', 'tuscany',
  'chianti', 'barolo', 'piedmont', 'rhone', 'rhône', 'loire', 'alsace',
  'mosel', 'douro', 'mendoza', 'marlborough', 'barossa', 'mclaren', 'walla walla',
  'willamette', 'paso robles', 'santa barbara', 'monterey', 'russian river'
]

// Spirit regions
const SPIRIT_REGIONS = [
  'kentucky', 'tennessee', 'scotland', 'ireland', 'japan', 'islay', 'highland',
  'speyside', 'lowland', 'campbeltown', 'cognac', 'armagnac', 'jalisco'
]

interface ParsedData {
  brandName?: string
  productName?: string
  vintage?: string
  type?: 'WINE' | 'SPIRIT' | 'BEER'
  varietal?: string
  region?: string
  abv?: number
  ageStatement?: string
  style?: string
}

/**
 * Parse extracted text to identify bottle information
 */
function parseBottleText(text: string): ParsedData {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const lowerText = text.toLowerCase()
  const parsed: ParsedData = {}

  // Detect type based on keywords
  const wineScore = WINE_KEYWORDS.reduce((score, keyword) => 
    lowerText.includes(keyword) ? score + 1 : score, 0
  )
  const spiritScore = SPIRIT_KEYWORDS.reduce((score, keyword) => 
    lowerText.includes(keyword) ? score + 1 : score, 0
  )

  if (wineScore > spiritScore && wineScore > 0) {
    parsed.type = 'WINE'
  } else if (spiritScore > 0) {
    parsed.type = 'SPIRIT'
  }

  // Extract vintage (4-digit year between 1900 and 2099)
  const vintageMatch = text.match(/\b(19\d{2}|20\d{2})\b/)
  if (vintageMatch) {
    const year = parseInt(vintageMatch[1])
    const currentYear = new Date().getFullYear()
    // Only use as vintage if it's reasonable (not too far in future)
    if (year <= currentYear + 5 && year >= 1900) {
      parsed.vintage = vintageMatch[1]
    }
  }

  // Extract ABV (alcohol by volume)
  const abvMatch = text.match(/(\d+\.?\d*)\s*%\s*(alc|vol|abv)?/i)
  if (abvMatch) {
    parsed.abv = parseFloat(abvMatch[1])
  }

  // Extract age statement (e.g., "12 Year", "18 Years Old")
  const ageMatch = text.match(/(\d+)\s+year(?:s)?\s*(?:old)?/i)
  if (ageMatch && parsed.type === 'SPIRIT') {
    parsed.ageStatement = ageMatch[1] + ' Year'
  }

  // Detect varietal (look for wine grape varieties)
  for (const keyword of WINE_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    const match = text.match(regex)
    if (match && parsed.type === 'WINE') {
      // Capitalize first letter
      parsed.varietal = match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase()
      break
    }
  }

  // Detect spirit style
  for (const keyword of SPIRIT_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    const match = text.match(regex)
    if (match && parsed.type === 'SPIRIT') {
      parsed.style = match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase()
      break
    }
  }

  // Detect region
  const allRegions = [...WINE_REGIONS, ...SPIRIT_REGIONS]
  for (const region of allRegions) {
    const regex = new RegExp(`\\b${region}\\b`, 'i')
    const match = text.match(regex)
    if (match) {
      parsed.region = match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase()
      break
    }
  }

  // Extract brand name (usually one of the first lines with proper capitalization)
  // Look for lines that are mostly uppercase or title case
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i]
    // Skip lines that are just years or very short
    if (line.length < 3 || /^\d{4}$/.test(line)) continue
    
    // If it has multiple capital letters and isn't all caps (which might be a label)
    const capitals = (line.match(/[A-Z]/g) || []).length
    const letters = (line.match(/[A-Za-z]/g) || []).length
    
    if (capitals >= 2 && capitals / letters >= 0.3 && line.length > 3) {
      if (!parsed.brandName && line.length < 50) {
        parsed.brandName = line
      } else if (!parsed.productName && line.length < 50 && line !== parsed.brandName) {
        parsed.productName = line
      }
    }
  }

  // If we didn't find a brand, use the first substantial line
  if (!parsed.brandName && lines.length > 0) {
    parsed.brandName = lines[0]
  }

  // Product name might be the second or third line
  if (!parsed.productName && lines.length > 1) {
    for (let i = 1; i < Math.min(4, lines.length); i++) {
      const line = lines[i]
      if (line.length > 3 && line !== parsed.brandName && !/^\d{4}$/.test(line)) {
        parsed.productName = line
        break
      }
    }
  }

  return parsed
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 1.0
  if (s1.includes(s2) || s2.includes(s1)) return 0.8
  
  // Simple word-based matching
  const words1 = s1.split(/\s+/)
  const words2 = s2.split(/\s+/)
  
  let matchCount = 0
  for (const word1 of words1) {
    if (word1.length < 3) continue // Skip short words
    for (const word2 of words2) {
      if (word2.length < 3) continue
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matchCount++
        break
      }
    }
  }
  
  const maxWords = Math.max(words1.length, words2.length)
  return maxWords > 0 ? matchCount / maxWords : 0
}

/**
 * Search for matching products in the database
 */
async function findMatchingProducts(parsed: ParsedData) {
  const { brandName, productName, vintage, type } = parsed
  
  if (!brandName && !productName) {
    return []
  }

  // Build OR conditions array
  const orConditions: any[] = []
  
  if (brandName) {
    orConditions.push({
      brand: {
        name: { contains: brandName, mode: 'insensitive' }
      }
    })
  }
  
  if (productName) {
    orConditions.push({
      name: { contains: productName, mode: 'insensitive' }
    })
  }
  
  if (brandName && productName) {
    orConditions.push({
      AND: [
        { brand: { name: { contains: brandName, mode: 'insensitive' } } },
        { name: { contains: productName, mode: 'insensitive' } }
      ]
    })
  }

  // Search for products
  const products = await prisma.product.findMany({
    where: {
      OR: orConditions
    },
    include: {
      brand: true,
      wineData: true,
      spiritData: true
    },
    take: 20
  })

  // Score each product
  const scoredProducts = products.map(product => {
    let score = 0
    
    // Brand name match (highest weight)
    if (brandName) {
      const brandSimilarity = calculateSimilarity(brandName, product.brand.name)
      score += brandSimilarity * 50
    }
    
    // Product name match
    if (productName) {
      const productSimilarity = calculateSimilarity(productName, product.name)
      score += productSimilarity * 30
    }
    
    // Type match
    if (type && product.brand.type === type) {
      score += 10
    }
    
    // Vintage exact match (for wine)
    if (vintage && product.wineData?.vintage === vintage) {
      score += 10
    }
    
    return { product, score }
  })

  // Sort by score and return top 5
  return scoredProducts
    .filter(item => item.score > 20) // Minimum threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => ({
      ...item.product,
      matchScore: Math.round(item.score)
    }))
}

/**
 * Determine confidence level based on match scores
 */
function determineConfidence(matches: any[]): 'high' | 'medium' | 'low' {
  if (matches.length === 0) return 'low'
  
  const topScore = matches[0].matchScore
  
  if (topScore >= 85) return 'high'
  if (topScore >= 60) return 'medium'
  return 'low'
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { image } = body

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      )
    }

    // Convert base64 to buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    let imageBuffer: Buffer = Buffer.from(base64Data, 'base64')

    // Optimize image size if needed (max 4MB for Vision API)
    const metadata = await sharp(imageBuffer).metadata()
    const maxSize = 4 * 1024 * 1024 // 4MB

    if (imageBuffer.length > maxSize) {
      // Resize to reduce file size
      imageBuffer = (await sharp(imageBuffer)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer()) as Buffer
    }

    // Perform OCR
    const extractedText = await detectText(imageBuffer)

    if (!extractedText) {
      return NextResponse.json({
        error: 'No text detected in image',
        extractedText: '',
        parsedData: {},
        matches: [],
        confidence: 'low'
      }, { status: 200 })
    }

    // Parse the extracted text
    const parsedData = parseBottleText(extractedText)

    // Find matching products
    const matches = await findMatchingProducts(parsedData)

    // Determine confidence
    const confidence = determineConfidence(matches)

    return NextResponse.json({
      extractedText,
      parsedData,
      matches,
      confidence
    })
  } catch (error: any) {
    console.error('Error scanning bottle:', error)
    
    // Provide more specific error messages
    if (error.message?.includes('credentials')) {
      return NextResponse.json(
        { error: 'Google Cloud credentials not configured. Please check your environment variables.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to scan bottle' },
      { status: 500 }
    )
  }
}

