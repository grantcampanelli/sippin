import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupDuplicates() {
  console.log('Starting duplicate cleanup...')

  // Find duplicate brands (same name and type)
  console.log('\n=== Finding duplicate brands ===')
  const brands = await prisma.brand.findMany({
    include: {
      products: {
        include: {
          bottles: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc', // Keep older ones first
    },
  })

  // Group brands by name and type
  const brandGroups = new Map<string, typeof brands>()
  for (const brand of brands) {
    const key = `${brand.name.toLowerCase()}|${brand.type}`
    if (!brandGroups.has(key)) {
      brandGroups.set(key, [])
    }
    brandGroups.get(key)!.push(brand)
  }

  // Find duplicates
  const duplicateBrandGroups = Array.from(brandGroups.entries()).filter(
    ([_, group]) => group.length > 1
  )

  console.log(`Found ${duplicateBrandGroups.length} groups of duplicate brands`)

  let brandsDeleted = 0
  let brandsKept = 0

  for (const [key, duplicateBrands] of duplicateBrandGroups) {
    const [name, type] = key.split('|')
    console.log(`\nProcessing duplicates for: ${name} (${type})`)

    // Find which brands are in use (have products with bottles)
    const brandsInUse = new Set<string>()
    for (const brand of duplicateBrands) {
      for (const product of brand.products) {
        if (product.bottles.length > 0) {
          brandsInUse.add(brand.id)
          console.log(`  Brand ${brand.id} is in use (has ${product.bottles.length} bottles)`)
        }
      }
    }

    // Keep the first brand (oldest) if none are in use, otherwise keep the one in use
    let brandToKeep: typeof duplicateBrands[0]
    if (brandsInUse.size > 0) {
      // Keep the first one that's in use
      brandToKeep = duplicateBrands.find((b) => brandsInUse.has(b.id))!
      console.log(`  Keeping brand ${brandToKeep.id} (in use)`)
    } else {
      // Keep the oldest one
      brandToKeep = duplicateBrands[0]
      console.log(`  Keeping brand ${brandToKeep.id} (oldest, not in use)`)
    }

    // Delete the others (if not in use)
    for (const brand of duplicateBrands) {
      if (brand.id === brandToKeep.id) {
        brandsKept++
        continue
      }

      // Check if this brand has any products with bottles
      const hasBottles = brand.products.some((p) => p.bottles.length > 0)

      if (hasBottles) {
        console.log(`  ⚠️  Skipping brand ${brand.id} - has bottles in use`)
        brandsKept++
      } else {
        // Check if any products exist
        const productCount = brand.products.length
        if (productCount > 0) {
          console.log(`  Deleting brand ${brand.id} and ${productCount} products (not in use)`)
          // Delete products first (cascade should handle this, but being explicit)
          await prisma.product.deleteMany({
            where: {
              brandId: brand.id,
            },
          })
        }
        await prisma.brand.delete({
          where: {
            id: brand.id,
          },
        })
        brandsDeleted++
        console.log(`  ✓ Deleted brand ${brand.id}`)
      }
    }
  }

  // Now find duplicate products (same name and brand)
  console.log('\n=== Finding duplicate products ===')
  const products = await prisma.product.findMany({
    include: {
      bottles: true,
      brand: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  // Group products by name and brandId
  const productGroups = new Map<string, typeof products>()
  for (const product of products) {
    const key = `${product.name.toLowerCase()}|${product.brandId}`
    if (!productGroups.has(key)) {
      productGroups.set(key, [])
    }
    productGroups.get(key)!.push(product)
  }

  // Find duplicates
  const duplicateProductGroups = Array.from(productGroups.entries()).filter(
    ([_, group]) => group.length > 1
  )

  console.log(`Found ${duplicateProductGroups.length} groups of duplicate products`)

  let productsDeleted = 0
  let productsKept = 0

  for (const [key, duplicateProducts] of duplicateProductGroups) {
    const [name, brandId] = key.split('|')
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    })
    console.log(`\nProcessing duplicates for: ${name} (Brand: ${brand?.name || 'Unknown'})`)

    // Find which products are in use (have bottles)
    const productsInUse = duplicateProducts.filter((p) => p.bottles.length > 0)

    let productToKeep: typeof duplicateProducts[0]
    if (productsInUse.length > 0) {
      // Keep the first one that's in use
      productToKeep = productsInUse[0]
      console.log(`  Keeping product ${productToKeep.id} (in use, has ${productToKeep.bottles.length} bottles)`)
    } else {
      // Keep the oldest one
      productToKeep = duplicateProducts[0]
      console.log(`  Keeping product ${productToKeep.id} (oldest, not in use)`)
    }

    // Delete the others (if not in use)
    for (const product of duplicateProducts) {
      if (product.id === productToKeep.id) {
        productsKept++
        continue
      }

      if (product.bottles.length > 0) {
        console.log(`  ⚠️  Skipping product ${product.id} - has ${product.bottles.length} bottles in use`)
        productsKept++
      } else {
        // Delete wine/spirit product data first
        const wineProduct = await prisma.wineProduct.findUnique({
          where: { productId: product.id },
        })
        if (wineProduct) {
          await prisma.wineProduct.delete({
            where: { productId: product.id },
          })
        }

        const spiritProduct = await prisma.spiritProduct.findUnique({
          where: { productId: product.id },
        })
        if (spiritProduct) {
          await prisma.spiritProduct.delete({
            where: { productId: product.id },
          })
        }

        // Delete the product
        await prisma.product.delete({
          where: {
            id: product.id,
          },
        })
        productsDeleted++
        console.log(`  ✓ Deleted product ${product.id}`)
      }
    }
  }

  console.log('\n=== Cleanup Summary ===')
  console.log(`Brands deleted: ${brandsDeleted}`)
  console.log(`Brands kept: ${brandsKept}`)
  console.log(`Products deleted: ${productsDeleted}`)
  console.log(`Products kept: ${productsKept}`)
  console.log('\nCleanup completed!')
}

cleanupDuplicates()
  .catch((e) => {
    console.error('Error during cleanup:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

