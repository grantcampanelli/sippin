import { PrismaClient, BrandType, StashType } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// User ID from the requirements
const USER_ID = 'cmikozv590000smac3p9ettci'

interface CSVRow {
  bottle_id: string
  bottle_size: string
  bottle_serving_size: string
  bottle_purchase_price: string
  bottle_purchase_date: string
  bottle_open_date: string
  bottle_finished: string
  bottle_finish_date: string
  bottle_amount_remaining: string
  bottle_notes: string
  product_id: string
  product_name: string
  product_vintage: string
  product_varietal: string
  product_region: string
  brand_id: string
  brand_name: string
  brand_type: string
  shelf_item_id: string
  shelf_item_order: string
  shelf_id: string
  shelf_name: string
  shelf_order: string
  shelf_capacity: string
  shelf_temp: string
  stash_id: string
  stash_name: string
  stash_location: string
  stash_type: string
}

interface StashShelfRow {
  stash_id: string
  stash_name: string
  stash_location: string
  stash_type: string
  shelf_id: string
  shelf_name: string
  shelf_order: string
  shelf_capacity: string
  shelf_temp: string
}

function parseCSV(content: string): CSVRow[] {
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('Stashes'))
  const headers = lines[0].split(',')
  const rows: CSVRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    const row: any = {}
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || ''
    })
    rows.push(row as CSVRow)
  }

  return rows
}

function parseStashShelfCSV(content: string): StashShelfRow[] {
  const stashSection = content.split('Stashes and Shelves:')[1]
  if (!stashSection) return []
  
  const lines = stashSection.split('\n').filter(line => line.trim())
  const headers = lines[0].split(',')
  const rows: StashShelfRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    const row: any = {}
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || ''
    })
    rows.push(row as StashShelfRow)
  }

  return rows
}

function mapBrandType(type: string): BrandType {
  const upper = type.toUpperCase()
  if (upper === 'WINE') return BrandType.WINE
  if (upper === 'SPIRIT') return BrandType.SPIRIT
  if (upper === 'BEER') return BrandType.BEER
  return BrandType.WINE // default
}

function mapStashType(type: string): StashType {
  const lower = type.toLowerCase()
  if (lower === 'fridge') return StashType.FRIDGE
  if (lower === 'wine_cellar' || lower === 'wine cellar') return StashType.WINE_CELLAR
  if (lower === 'liquor_cabinet' || lower === 'liquor cabinet') return StashType.LIQUOR_CABINET
  if (lower === 'bar') return StashType.BAR
  if (lower === 'refrigerator') return StashType.REFRIGERATOR
  if (lower === 'general_storage' || lower === 'general storage') return StashType.GENERAL_STORAGE
  if (lower === 'display_cabinet' || lower === 'display cabinet') return StashType.DISPLAY_CABINET
  return StashType.FRIDGE // default
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === '') return null
  try {
    return new Date(dateStr)
  } catch {
    return null
  }
}

function parseFloatValue(value: string): number | null {
  if (!value || value === '') return null
  const parsed = parseFloat(value)
  return isNaN(parsed) ? null : parsed
}

function parseBoolean(value: string): boolean {
  return value.toLowerCase() === 'true'
}

async function main() {
  console.log('Starting seed...')

  // Read CSV file
  const csvPath = path.join(process.cwd(), 'resources', 'seed_data.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')

  // Parse CSV
  const rows = parseCSV(csvContent)
  const stashShelfRows = parseStashShelfCSV(csvContent)

  console.log(`Found ${rows.length} bottle rows`)
  console.log(`Found ${stashShelfRows.length} stash/shelf rows`)

  // Create unique brands
  const brandMap = new Map<string, { id: string; name: string; type: BrandType }>()
  rows.forEach(row => {
    if (row.brand_id && row.brand_name && !brandMap.has(row.brand_id)) {
      brandMap.set(row.brand_id, {
        id: row.brand_id,
        name: row.brand_name,
        type: mapBrandType(row.brand_type)
      })
    }
  })

  // Create brands
  console.log('Creating brands...')
  for (const [id, brand] of brandMap) {
    await prisma.brand.upsert({
      where: { id },
      update: {
        name: brand.name,
        type: brand.type
      },
      create: {
        id,
        name: brand.name,
        type: brand.type
      }
    })
  }
  console.log(`Created ${brandMap.size} brands`)

  // Create unique products
  const productMap = new Map<string, { 
    id: string
    name: string
    brandId: string
    vintage?: string
    varietal?: string
    region?: string
  }>()
  rows.forEach(row => {
    if (row.product_id && row.product_name && !productMap.has(row.product_id)) {
      productMap.set(row.product_id, {
        id: row.product_id,
        name: row.product_name,
        brandId: row.brand_id,
        vintage: row.product_vintage || undefined,
        varietal: row.product_varietal || undefined,
        region: row.product_region || undefined
      })
    }
  })

  // Create products and wine/spirit data
  console.log('Creating products...')
  for (const [id, product] of productMap) {
    const brand = brandMap.get(product.brandId)
    if (!brand) continue

    // Create or update product
    await prisma.product.upsert({
      where: { id },
      update: {
        name: product.name,
        brandId: product.brandId
      },
      create: {
        id,
        name: product.name,
        brandId: product.brandId
      }
    })

    // Create wine or spirit data based on brand type
    if (brand.type === BrandType.WINE && (product.vintage || product.varietal || product.region)) {
      await prisma.wineProduct.upsert({
        where: { productId: id },
        update: {
          vintage: product.vintage || null,
          varietal: product.varietal || null,
          region: product.region || null
        },
        create: {
          productId: id,
          vintage: product.vintage || null,
          varietal: product.varietal || null,
          region: product.region || null
        }
      })
    } else if (brand.type === BrandType.SPIRIT) {
      // For spirits, we might have some data in varietal field (like "Whiskey")
      await prisma.spiritProduct.upsert({
        where: { productId: id },
        update: {
          style: product.varietal || null
        },
        create: {
          productId: id,
          style: product.varietal || null
        }
      })
    }
  }
  console.log(`Created ${productMap.size} products`)

  // Create stashes
  const stashMap = new Map<string, { id: string; name: string; location: string; type: StashType }>()
  stashShelfRows.forEach(row => {
    if (row.stash_id && row.stash_name && !stashMap.has(row.stash_id)) {
      stashMap.set(row.stash_id, {
        id: row.stash_id,
        name: row.stash_name,
        location: row.stash_location,
        type: mapStashType(row.stash_type)
      })
    }
  })

  console.log('Creating stashes...')
  for (const [id, stash] of stashMap) {
    await prisma.stash.upsert({
      where: { id },
      update: {
        name: stash.name,
        location: stash.location,
        type: stash.type,
        userId: USER_ID
      },
      create: {
        id,
        name: stash.name,
        location: stash.location,
        type: stash.type,
        userId: USER_ID
      }
    })
  }
  console.log(`Created ${stashMap.size} stashes`)

  // Create shelves
  const shelfMap = new Map<string, { 
    id: string
    name: string
    order: number | null
    capacity: number | null
    temp: number | null
    stashId: string | null
  }>()
  stashShelfRows.forEach(row => {
    if (row.shelf_id && row.shelf_name && !shelfMap.has(row.shelf_id)) {
      shelfMap.set(row.shelf_id, {
        id: row.shelf_id,
        name: row.shelf_name,
        order: row.shelf_order ? parseInt(row.shelf_order) : null,
        capacity: row.shelf_capacity ? parseInt(row.shelf_capacity) : null,
        temp: row.shelf_temp ? parseFloatValue(row.shelf_temp) : null,
        stashId: row.stash_id || null
      })
    }
  })

  console.log('Creating shelves...')
  for (const [id, shelf] of shelfMap) {
    await prisma.shelf.upsert({
      where: { id },
      update: {
        name: shelf.name,
        order: shelf.order,
        capacity: shelf.capacity,
        temp: shelf.temp,
        stashId: shelf.stashId
      },
      create: {
        id,
        name: shelf.name,
        order: shelf.order,
        capacity: shelf.capacity,
        temp: shelf.temp,
        stashId: shelf.stashId
      }
    })
  }
  console.log(`Created ${shelfMap.size} shelves`)

  // Create bottles
  console.log('Creating bottles...')
  let bottleCount = 0
  for (const row of rows) {
    if (!row.bottle_id || !row.product_id) continue

    const bottle = await prisma.bottle.upsert({
      where: { id: row.bottle_id },
      update: {
        size: parseFloatValue(row.bottle_size),
        servingSize: parseFloatValue(row.bottle_serving_size),
        purchasePrice: parseFloatValue(row.bottle_purchase_price),
        purchaseDate: parseDate(row.bottle_purchase_date),
        openDate: parseDate(row.bottle_open_date),
        finished: parseBoolean(row.bottle_finished),
        finishDate: parseDate(row.bottle_finish_date),
        amountRemaining: parseFloatValue(row.bottle_amount_remaining),
        notes: row.bottle_notes || null,
        userId: USER_ID,
        productId: row.product_id
      },
      create: {
        id: row.bottle_id,
        size: parseFloatValue(row.bottle_size),
        servingSize: parseFloatValue(row.bottle_serving_size),
        purchasePrice: parseFloatValue(row.bottle_purchase_price),
        purchaseDate: parseDate(row.bottle_purchase_date),
        openDate: parseDate(row.bottle_open_date),
        finished: parseBoolean(row.bottle_finished),
        finishDate: parseDate(row.bottle_finish_date),
        amountRemaining: parseFloatValue(row.bottle_amount_remaining),
        notes: row.bottle_notes || null,
        userId: USER_ID,
        productId: row.product_id
      }
    })

    // Create shelf item if bottle is on a shelf
    if (row.shelf_item_id && row.shelf_id && row.bottle_id) {
      await prisma.shelfItem.upsert({
        where: { id: row.shelf_item_id },
        update: {
          order: row.shelf_item_order ? parseInt(row.shelf_item_order) : 0,
          bottleId: row.bottle_id,
          shelfId: row.shelf_id
        },
        create: {
          id: row.shelf_item_id,
          order: row.shelf_item_order ? parseInt(row.shelf_item_order) : 0,
          bottleId: row.bottle_id,
          shelfId: row.shelf_id
        }
      })
    }

    bottleCount++
  }
  console.log(`Created ${bottleCount} bottles`)

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

