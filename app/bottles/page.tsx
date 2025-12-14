'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Group,
  Badge,
  Stack,
  TextInput,
  Switch,
  Box,
  Loader,
  Center,
  Button,
  Modal,
  Select,
  NumberInput,
  ActionIcon,
  Autocomplete,
  Divider,
} from '@mantine/core'
import { IconSearch, IconBottle, IconFilter, IconPlus, IconX, IconCamera, IconMapPin, IconStack2 } from '@tabler/icons-react'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import Link from 'next/link'

interface Bottle {
  id: string
  finished: boolean
  amountRemaining: number | null
  purchasePrice: number | null
  purchaseDate: Date | null
  openDate: Date | null
  finishDate: Date | null
  rating: number | null
  product: {
    id: string
    name: string
    brand: {
      id: string
      name: string
      type: string
    }
    wineData: {
      vintage: string | null
      varietal: string | null
      region: string | null
    } | null
    spiritData: {
      style: string | null
      ageStatement: string | null
    } | null
  }
  shelfItem: {
    shelf: {
      name: string
      stash: {
        name: string
      } | null
    }
  } | null
}

interface Product {
  id: string
  name: string
  brand: {
    id: string
    name: string
    type: string
  }
  wineData: {
    vintage: string | null
    varietal: string | null
    region: string | null
  } | null
  spiritData: {
    style: string | null
  } | null
}

interface Brand {
  id: string
  name: string
  type: string
}

export default function BottlesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bottles, setBottles] = useState<Bottle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFinished, setShowFinished] = useState(false)
  const [quickAddOpened, setQuickAddOpened] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [creatingProduct, setCreatingProduct] = useState(false)
  const [creatingBrand, setCreatingBrand] = useState(false)
  const [showBrandForm, setShowBrandForm] = useState(false)
  const [quickSearch, setQuickSearch] = useState('')
  const [quickSearchProducts, setQuickSearchProducts] = useState<Product[]>([])
  const [showQuickSearch, setShowQuickSearch] = useState(true)
  const [selectedProductData, setSelectedProductData] = useState<Product | null>(null)
  const [stashSuggestionOpened, setStashSuggestionOpened] = useState(false)
  const [userHasStashes, setUserHasStashes] = useState<boolean | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      fetchBottles()
      checkUserHasStashes()
    }
  }, [status, router])

  const form = useForm({
    initialValues: {
      productId: '',
      purchasePrice: '',
      purchaseDate: '',
      notes: '',
      quantity: 1,
    },
    validate: {
      productId: (value) => (!value ? 'Product is required' : null),
      quantity: (value) => (value < 1 ? 'Quantity must be at least 1' : null),
    },
  })

  const brandForm = useForm({
    initialValues: {
      name: '',
      type: 'WINE' as 'WINE' | 'SPIRIT' | 'BEER',
    },
    validate: {
      name: (value) => (!value ? 'Brand name is required' : null),
    },
  })

  const productForm = useForm({
    initialValues: {
      name: '',
      brandId: '',
      vintage: '',
      varietal: '',
      region: '',
    },
    validate: {
      name: (value) => (!value ? 'Product name is required' : null),
      brandId: (value) => (!value ? 'Brand is required' : null),
      vintage: (value, values) => {
        const brand = brands.find((b) => b.id === values.brandId)
        if (brand?.type === 'WINE' && !value) {
          return 'Vintage is required for wine products'
        }
        return null
      },
      varietal: (value, values) => {
        const brand = brands.find((b) => b.id === values.brandId)
        if (brand?.type === 'WINE' && !value) {
          return 'Varietal is required for wine products'
        }
        return null
      },
    },
  })

  const fetchBottles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/bottles')
      if (response.ok) {
        const data = await response.json()
        setBottles(data)
      }
    } catch (error) {
      console.error('Error fetching bottles:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkUserHasStashes = async () => {
    try {
      const response = await fetch('/api/stashes')
      if (response.ok) {
        const stashes = await response.json()
        setUserHasStashes(stashes.length > 0)
        return stashes.length > 0
      }
      return false
    } catch (error) {
      console.error('Error checking stashes:', error)
      return false
    }
  }

  const fetchProducts = async (search: string) => {
    try {
      const brandId = productForm.values.brandId
      let url = `/api/products?limit=20`
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search)}`
      }
      if (brandId) {
        url += `&brandId=${encodeURIComponent(brandId)}`
      }
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchBrands = async (search: string) => {
    try {
      const response = await fetch(`/api/brands?search=${encodeURIComponent(search)}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setBrands(data)
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }

  useEffect(() => {
    if (quickAddOpened) {
      fetchBrands('')
    }
  }, [quickAddOpened])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (productSearch.trim()) {
        fetchProducts(productSearch)
      } else {
        setProducts([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [productSearch])

  // Helper function to check if a word partially matches (handles partial word matches)
  const partialMatch = (text: string, query: string): boolean => {
    if (!text || !query) return false
    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    
    // Exact match
    if (lowerText.includes(lowerQuery)) return true
    
    // Check if query matches the start of any word in text
    const words = lowerText.split(/\s+/)
    return words.some(word => word.startsWith(lowerQuery))
  }

  // Quick search effect - searches all products without brand filter with fuzzy matching
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (quickSearch.trim()) {
        fetch('/api/products?search=' + encodeURIComponent(quickSearch) + '&limit=100')
          .then(res => res.json())
          .then(data => {
            // Apply fuzzy matching and scoring
            const query = quickSearch.toLowerCase().trim()
            const queryWords = query.split(/\s+/).filter(w => w.length > 0)
            
            const scoredProducts: Array<{ product: Product; score: number }> = data.map((product: Product) => {
              const productName = (product.name || '').toLowerCase()
              const brandName = (product.brand?.name || '').toLowerCase()
              const vintage = (product.wineData?.vintage || '').toLowerCase()
              const varietal = (product.wineData?.varietal || '').toLowerCase()
              const region = (product.wineData?.region || '').toLowerCase()
              
              // Create searchable text
              const searchableText = `${brandName} ${productName} ${vintage} ${varietal} ${region}`.toLowerCase()
              
              let score = 0
              
              // Exact phrase match gets highest score
              if (searchableText.includes(query)) {
                score += 100
              }
              
              // Check if all query words/partials match across brand AND product
              const allWordsMatch = queryWords.every(word => 
                partialMatch(productName, word) || 
                partialMatch(brandName, word) || 
                partialMatch(vintage, word) ||
                partialMatch(varietal, word) ||
                partialMatch(region, word)
              )
              
              if (allWordsMatch) {
                score += 50
                
                // Bonus: if words match across brand AND product (cross-entity match)
                const brandMatches = queryWords.filter(word => 
                  partialMatch(brandName, word)
                ).length
                const productMatches = queryWords.filter(word => 
                  partialMatch(productName, word)
                ).length
                
                if (brandMatches > 0 && productMatches > 0) {
                  score += 30 // Bonus for cross-entity matches like "just iso" → "Justin" + "Isosceles"
                }
              }
              
              // Check individual word/partial matches with scoring
              queryWords.forEach(word => {
                // Product name matches
                if (productName.includes(word)) {
                  score += productName.startsWith(word) ? 15 : 10
                } else if (productName.split(/\s+/).some(w => w.startsWith(word))) {
                  score += 12 // Partial word match in product name
                }
                
                // Brand name matches
                if (brandName.includes(word)) {
                  score += brandName.startsWith(word) ? 12 : 8
                } else if (brandName.split(/\s+/).some(w => w.startsWith(word))) {
                  score += 10 // Partial word match in brand name
                }
                
                // Exact vintage match is important
                if (vintage === word) score += 15
                else if (vintage.includes(word)) score += 8
                
                // Varietal matches
                if (varietal.includes(word)) score += 5
                else if (varietal.split(/\s+/).some(w => w.startsWith(word))) score += 3
                
                // Region matches
                if (region.includes(word)) score += 5
                else if (region.split(/\s+/).some(w => w.startsWith(word))) score += 3
              })
              
              // Boost score if query starts with product name or brand name
              if (productName.startsWith(queryWords[0])) score += 20
              if (brandName.startsWith(queryWords[0])) score += 15
              
              return { product, score }
            })
            
            // Sort by score and take top results
            const sorted = scoredProducts
              .filter((item: { product: Product; score: number }) => item.score > 0)
              .sort((a: { product: Product; score: number }, b: { product: Product; score: number }) => b.score - a.score)
              .slice(0, 10)
              .map((item: { product: Product; score: number }) => item.product)
            
            setQuickSearchProducts(sorted)
          })
          .catch(err => console.error('Error fetching quick search:', err))
      } else {
        setQuickSearchProducts([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [quickSearch])

  const handleCreateBrand = async () => {
    if (!brandForm.validate().hasErrors) {
      setCreatingBrand(true)
      try {
        const response = await fetch('/api/brands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(brandForm.values),
        })
        if (response.ok) {
          const newBrand = await response.json()
          // Add brand to list
          setBrands([...brands, newBrand])
          // Automatically select the new brand
          productForm.setFieldValue('brandId', newBrand.id)
          // Close the brand creation form
          setShowBrandForm(false)
          // Reset brand form
          brandForm.reset()
          // Fetch products for the newly selected brand
          fetchProducts('')
          notifications.show({
            title: 'Brand created',
            message: `${newBrand.name} has been selected`,
            color: 'green',
          })
          return newBrand
        } else {
          const error = await response.json()
          notifications.show({
            title: 'Error',
            message: error.error || 'Failed to create brand',
            color: 'red',
          })
          return null
        }
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to create brand',
          color: 'red',
        })
        return null
      } finally {
        setCreatingBrand(false)
      }
    }
    return null
  }

  const handleCreateProduct = async () => {
    if (!productForm.validate().hasErrors) {
      setCreatingProduct(true)
      try {
        const brand = brands.find((b) => b.id === productForm.values.brandId)
        const isWine = brand?.type === 'WINE'
        
        const wineData = isWine ? {
          vintage: productForm.values.vintage || null,
          varietal: productForm.values.varietal || null,
          region: productForm.values.region || null,
        } : undefined

        const spiritData = !isWine ? {
          style: productForm.values.varietal || null,
          ageStatement: productForm.values.vintage || null,
        } : undefined

        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: productForm.values.name,
            brandId: productForm.values.brandId,
            wineData,
            spiritData,
          }),
        })
        if (response.ok) {
          const newProduct = await response.json()
          form.setFieldValue('productId', newProduct.id)
          setSelectedProductData(newProduct)
          const displayName =
            newProduct.brand.type === 'WINE' && newProduct.wineData?.vintage
              ? `${newProduct.wineData.vintage} ${newProduct.name}`
              : newProduct.name
          setProductSearch(`${newProduct.brand.name} ${displayName}`)
          // Reset product form but keep brandId
          productForm.setFieldValue('name', '')
          productForm.setFieldValue('vintage', '')
          productForm.setFieldValue('varietal', '')
          productForm.setFieldValue('region', '')
          notifications.show({
            title: 'Product created',
            message: `${newProduct.name} has been added`,
            color: 'green',
          })
        } else {
          const error = await response.json()
          notifications.show({
            title: 'Error',
            message: error.error || 'Failed to create product',
            color: 'red',
          })
        }
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to create product',
          color: 'red',
        })
      } finally {
        setCreatingProduct(false)
      }
    }
  }

  const handleQuickAdd = async () => {
    if (!form.validate().hasErrors) {
      try {
        const quantity = form.values.quantity || 1
        const bottleData = {
          productId: form.values.productId,
          purchasePrice: form.values.purchasePrice ? parseFloat(form.values.purchasePrice) : null,
          purchaseDate: form.values.purchaseDate ? new Date(form.values.purchaseDate).toISOString() : null,
          notes: form.values.notes || null,
          amountRemaining: 100,
        }

        // Create multiple bottles if quantity > 1
        const promises = Array.from({ length: quantity }, () =>
          fetch('/api/bottles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bottleData),
          })
        )

        const results = await Promise.all(promises)
        const failed = results.filter(r => !r.ok)

        if (failed.length === 0) {
          const isFirstBottle = bottles.length === 0
          
          notifications.show({
            title: 'Bottles added',
            message: `${quantity} ${quantity === 1 ? 'bottle has' : 'bottles have'} been added to your inventory`,
            color: 'green',
          })
          form.reset()
          form.setFieldValue('quantity', 1) // Ensure quantity resets to 1
          setSelectedProductData(null)
          setProductSearch('')
          setQuickSearch('')
          setQuickAddOpened(false)
          await fetchBottles()

          // If this was the first bottle and user has no stashes, suggest creating one
          if (isFirstBottle) {
            const hasStashes = await checkUserHasStashes()
            if (!hasStashes) {
              setTimeout(() => {
                setStashSuggestionOpened(true)
              }, 500)
            }
          }
        } else {
          const error = await failed[0].json()
          notifications.show({
            title: 'Error',
            message: error.error || 'Failed to add bottles',
            color: 'red',
          })
        }
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to add bottles',
          color: 'red',
        })
      }
    }
  }

  // Normalize strings for search - handles apostrophes and special characters
  // Removes apostrophes entirely for more flexible matching
  const normalizeForSearch = (str: string): string => {
    if (!str) return ''
    return str
      .toLowerCase()
      .normalize('NFD') // Normalize to decomposed form
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[''`´\u2018\u2019\u201A\u201B\u2032\u2035]/g, '') // Remove all apostrophe types
      .replace(/["""\u201C\u201D\u201E\u201F\u2033\u2036]/g, '') // Remove all quote types
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  const filteredBottles = useMemo(() => {
    let filtered = bottles

    // Filter by finished status
    if (!showFinished) {
      filtered = filtered.filter((bottle) => !bottle.finished)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const normalizedQuery = normalizeForSearch(searchQuery)
      
      filtered = filtered.filter((bottle) => {
        const productName = normalizeForSearch(bottle.product.name)
        const brandName = normalizeForSearch(bottle.product.brand.name)
        const varietal = normalizeForSearch(bottle.product.wineData?.varietal || '')
        const region = normalizeForSearch(bottle.product.wineData?.region || '')
        const vintage = normalizeForSearch(bottle.product.wineData?.vintage || '')
        const style = normalizeForSearch(bottle.product.spiritData?.style || '')

        return (
          productName.includes(normalizedQuery) ||
          brandName.includes(normalizedQuery) ||
          varietal.includes(normalizedQuery) ||
          region.includes(normalizedQuery) ||
          vintage.includes(normalizedQuery) ||
          style.includes(normalizedQuery)
        )
      })
    }

    return filtered
  }, [bottles, searchQuery, showFinished])

  const getProductDisplayName = (product: Bottle['product']) => {
    if (product.brand.type === 'WINE' && product.wineData?.vintage) {
      return `${product.wineData.vintage} ${product.name}`
    }
    return product.name
  }

  const getProductSubtitle = (product: Bottle['product']) => {
    const parts = []
    if (product.brand.name) parts.push(product.brand.name)
    if (product.wineData?.varietal) parts.push(product.wineData.varietal)
    if (product.wineData?.region) parts.push(product.wineData.region)
    if (product.spiritData?.style) parts.push(product.spiritData.style)
    return parts.join(' • ')
  }

  if (status === 'loading' || loading) {
    return (
      <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size="lg" color="wine" />
      </Box>
    )
  }

  const finishedCount = bottles.filter((b) => b.finished).length
  const activeCount = bottles.filter((b) => !b.finished).length

  return (
    <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)' }}>
      <Container size="xl" py="xl">
        <Stack gap="xl">
          {/* Header */}
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={1} mb="xs" style={{ color: 'var(--color-burgundy)' }}>
                My Bottles
              </Title>
              <Text size="lg" style={{ color: 'var(--color-brown)' }}>
                Manage your wine and liquor collection
              </Text>
            </div>
            <Group gap="sm">
              <Link href="/bottles/inventory" style={{ textDecoration: 'none' }}>
                <Button
                  leftSection={<IconStack2 size={18} />}
                  size="lg"
                  variant="outline"
                  style={{
                    borderColor: 'var(--color-wine)',
                    color: 'var(--color-wine)',
                  }}
                >
                  Inventory
                </Button>
              </Link>
              <Link href="/bottles/scan" style={{ textDecoration: 'none' }}>
                <Button
                  leftSection={<IconCamera size={18} />}
                  size="lg"
                  variant="outline"
                  style={{
                    borderColor: 'var(--color-wine)',
                    color: 'var(--color-wine)',
                  }}
                >
                  Scan Bottle
                </Button>
              </Link>
              <Button
                leftSection={<IconPlus size={18} />}
                onClick={() => setQuickAddOpened(true)}
                size="lg"
                style={{
                  background: 'var(--gradient-wine)',
                  color: 'white',
                }}
              >
                Quick Add
              </Button>
            </Group>
          </Group>

          {/* Helpful tip when user has bottles but no stashes */}
          {bottles.length > 0 && userHasStashes === false && (
            <Card
              padding="lg"
              radius="md"
              withBorder
              style={{
                borderColor: 'var(--color-amber)',
                borderWidth: 2,
                background: 'linear-gradient(135deg, #FFF9E6 0%, #FFFBF0 100%)',
              }}
            >
              <Group justify="space-between" align="center">
                <Group gap="md">
                  <Box
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'var(--gradient-amber)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <IconMapPin size={24} color="white" />
                  </Box>
                  <div>
                    <Text fw={600} size="md" mb={4} style={{ color: 'var(--color-burgundy)' }}>
                      Keep your collection organized
                    </Text>
                    <Text size="sm" c="dimmed">
                      Create a storage location to organize your {bottles.length} {bottles.length === 1 ? 'bottle' : 'bottles'} by location
                    </Text>
                  </div>
                </Group>
                <Button
                  component={Link}
                  href="/stashes/create"
                  leftSection={<IconPlus size={16} />}
                  style={{ background: 'var(--gradient-amber)' }}
                >
                  Create Storage Location
                </Button>
              </Group>
            </Card>
          )}

          {/* Search and Filters */}
          <Card
            padding="lg"
            radius="md"
            withBorder
            style={{
              borderColor: 'var(--color-beige)',
              background: 'white',
            }}
          >
            <Stack gap="md">
              <TextInput
                placeholder="Search by name, brand, varietal, region..."
                leftSection={<IconSearch size={18} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="md"
              />
              <Group justify="space-between" align="center">
                <Group gap="lg">
                  <Text size="sm" fw={500} style={{ color: 'var(--color-brown)' }}>
                    {filteredBottles.length} {filteredBottles.length === 1 ? 'bottle' : 'bottles'}
                    {searchQuery && ` matching "${searchQuery}"`}
                  </Text>
                  {!showFinished && finishedCount > 0 && (
                    <Text size="sm" c="dimmed">
                      ({finishedCount} finished {finishedCount === 1 ? 'bottle' : 'bottles'} hidden)
                    </Text>
                  )}
                </Group>
                <Group gap="xs">
                  <IconFilter size={18} style={{ color: 'var(--color-wine)' }} />
                  <Switch
                    label="Show finished bottles"
                    checked={showFinished}
                    onChange={(e) => setShowFinished(e.currentTarget.checked)}
                    styles={{
                      label: {
                        color: 'var(--color-brown)',
                      },
                    }}
                  />
                </Group>
              </Group>
            </Stack>
          </Card>

          {/* Stats Cards */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <Card
              padding="lg"
              radius="md"
              withBorder
              style={{
                borderColor: 'var(--color-beige)',
                background: 'white',
              }}
            >
              <Group justify="space-between">
                <div>
                  <Text size="sm" c="dimmed" fw={500} tt="uppercase" style={{ letterSpacing: '0.5px' }}>
                    Active Bottles
                  </Text>
                  <Title order={2} mt="xs" style={{ color: 'var(--color-burgundy)' }}>
                    {activeCount}
                  </Title>
                </div>
                <Box
                  style={{
                    padding: '0.75rem',
                    borderRadius: '12px',
                    background: 'var(--gradient-wine)',
                    color: 'white',
                  }}
                >
                  <IconBottle size={28} />
                </Box>
              </Group>
            </Card>

            <Card
              padding="lg"
              radius="md"
              withBorder
              style={{
                borderColor: 'var(--color-beige)',
                background: 'white',
              }}
            >
              <Group justify="space-between">
                <div>
                  <Text size="sm" c="dimmed" fw={500} tt="uppercase" style={{ letterSpacing: '0.5px' }}>
                    Finished Bottles
                  </Text>
                  <Title order={2} mt="xs" style={{ color: 'var(--color-burgundy)' }}>
                    {finishedCount}
                  </Title>
                </div>
                <Box
                  style={{
                    padding: '0.75rem',
                    borderRadius: '12px',
                    background: 'var(--gradient-amber)',
                    color: 'var(--color-brown)',
                  }}
                >
                  <IconBottle size={28} />
                </Box>
              </Group>
            </Card>
          </SimpleGrid>

          {/* Bottles Grid */}
          {filteredBottles.length === 0 ? (
            <Card
              p="xl"
              withBorder
              style={{
                borderColor: 'var(--color-beige)',
                background: 'white',
                textAlign: 'center',
              }}
            >
              {searchQuery ? (
                <Text ta="center" c="dimmed" size="lg">
                  No bottles found matching "{searchQuery}"
                </Text>
              ) : showFinished ? (
                <Text ta="center" c="dimmed" size="lg">
                  No finished bottles yet.
                </Text>
              ) : bottles.length === 0 ? (
                <Stack gap="xl" align="center">
                  <Box>
                    <Title order={2} ta="center" mb="md" style={{ color: 'var(--color-burgundy)' }}>
                      Start Your Collection
                    </Title>
                    <Text size="lg" c="dimmed" ta="center" mb="xl" style={{ maxWidth: '500px', margin: '0 auto' }}>
                      Add your first bottle to begin tracking your wine and spirits collection.
                    </Text>
                  </Box>
                  <Group gap="md" justify="center">
                    <Link href="/bottles/scan" style={{ textDecoration: 'none' }}>
                      <Button
                        leftSection={<IconCamera size={18} />}
                        size="lg"
                        variant="outline"
                        style={{
                          borderColor: 'var(--color-wine)',
                          color: 'var(--color-wine)',
                        }}
                      >
                        Scan Bottle
                      </Button>
                    </Link>
                    <Button
                      leftSection={<IconPlus size={18} />}
                      onClick={() => setQuickAddOpened(true)}
                      size="lg"
                      style={{
                        background: 'var(--gradient-wine)',
                        color: 'white',
                      }}
                    >
                      Add Manually
                    </Button>
                  </Group>
                  <Box mt="lg">
                    <Text size="sm" c="dimmed" ta="center" mb="xs">
                      💡 Tip: After adding bottles, you can organize them in storage locations
                    </Text>
                    <Link href="/stashes/create" style={{ textDecoration: 'none' }}>
                      <Button variant="subtle" size="sm" style={{ color: 'var(--color-wine)' }}>
                        Create a Storage Location
                      </Button>
                    </Link>
                  </Box>
                </Stack>
              ) : (
                <Text ta="center" c="dimmed" size="lg">
                  No active bottles yet.
                </Text>
              )}
            </Card>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              {filteredBottles.map((bottle) => {
                const product = bottle.product
                const brand = product.brand

                return (
                  <Link
                    key={bottle.id}
                    href={`/bottles/${bottle.id}`}
                    style={{ textDecoration: 'none', height: '100%', display: 'block' }}
                  >
                    <Card
                      shadow="md"
                      padding="lg"
                      radius="md"
                      withBorder
                      style={{
                        height: '100%',
                        borderColor: 'var(--color-beige)',
                        background: 'white',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        opacity: bottle.finished ? 0.7 : 1,
                      }}
                    >
                      <Stack gap="sm">
                        <Group justify="space-between" align="flex-start">
                          <div style={{ flex: 1 }}>
                            <Text
                              fw={600}
                              size="lg"
                              lineClamp={2}
                              style={{ color: 'var(--color-burgundy)' }}
                            >
                              {getProductDisplayName(product)}
                            </Text>
                            <Text size="sm" c="dimmed" mt={4} lineClamp={1}>
                              {getProductSubtitle(product)}
                            </Text>
                          </div>
                          <Badge
                            color={
                              brand.type === 'WINE'
                                ? 'wine'
                                : brand.type === 'SPIRIT'
                                ? 'amber'
                                : 'blue'
                            }
                            variant="light"
                            style={{ fontWeight: 600 }}
                          >
                            {brand.type}
                          </Badge>
                        </Group>

                        {bottle.finished && (
                          <Badge color="gray" variant="light" size="sm" style={{ width: 'fit-content' }}>
                            Finished
                          </Badge>
                        )}

                        <Group justify="space-between" mt="xs">
                          {bottle.amountRemaining !== null && !bottle.finished && (
                            <div>
                              <Text size="xs" c="dimmed">
                                Remaining
                              </Text>
                              <Text size="sm" fw={600} style={{ color: 'var(--color-burgundy)' }}>
                                {bottle.amountRemaining}%
                              </Text>
                            </div>
                          )}
                          {bottle.purchasePrice !== null && (
                            <div>
                              <Text size="xs" c="dimmed">
                                Price
                              </Text>
                              <Text size="sm" fw={600} style={{ color: 'var(--color-burgundy)' }}>
                                ${bottle.purchasePrice.toFixed(2)}
                              </Text>
                            </div>
                          )}
                          {bottle.rating !== null && (
                            <div>
                              <Text size="xs" c="dimmed">
                                Rating
                              </Text>
                              <Text size="sm" fw={600} style={{ color: 'var(--color-burgundy)' }}>
                                {bottle.rating}/10
                              </Text>
                            </div>
                          )}
                        </Group>

                        {bottle.shelfItem && (
                          <Text size="xs" c="dimmed" mt="xs">
                            📍 {bottle.shelfItem.shelf.stash?.name} • {bottle.shelfItem.shelf.name}
                          </Text>
                        )}
                      </Stack>
                    </Card>
                  </Link>
                )
              })}
            </SimpleGrid>
          )}
        </Stack>
      </Container>

      {/* Quick Add Modal */}
      <Modal
        opened={quickAddOpened}
        onClose={() => {
          setQuickAddOpened(false)
          form.reset()
          form.setFieldValue('quantity', 1)
          setSelectedProductData(null)
          productForm.reset()
          brandForm.reset()
          setProductSearch('')
          setQuickSearch('')
          setShowBrandForm(false)
          setProducts([])
          setQuickSearchProducts([])
          setShowQuickSearch(true)
        }}
        title="Quick Add Bottle"
        size="lg"
        styles={{
          title: {
            color: 'var(--color-burgundy)',
            fontFamily: 'var(--font-playfair)',
            fontWeight: 600,
          },
        }}
      >
        <Stack gap="lg">
          {/* Quick Search Step */}
          {showQuickSearch && !form.values.productId && (
            <div>
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={600} style={{ color: 'var(--color-burgundy)' }}>
                  Quick Search (Optional)
                </Text>
                <Text size="xs" c="dimmed">
                  e.g., "2017 Justification", "Macallan 18"
                </Text>
              </Group>
              <Autocomplete
                placeholder="Type product name to search..."
                value={quickSearch}
                onChange={(value) => {
                  setQuickSearch(value)
                }}
                onOptionSubmit={(value) => {
                  const product = quickSearchProducts.find((p) => p.id === value)
                  if (product) {
                    form.setFieldValue('productId', product.id)
                    setSelectedProductData(product)
                    const displayName =
                      product.brand.type === 'WINE' && product.wineData?.vintage
                        ? `${product.wineData.vintage} ${product.name}`
                        : product.name
                    setQuickSearch(`${product.brand.name} ${displayName}`)
                    setShowQuickSearch(false)
                    // Set the brand in productForm for consistency
                    productForm.setFieldValue('brandId', product.brand.id)
                  }
                }}
                data={quickSearchProducts.map((product) => {
                  const displayName =
                    product.brand.type === 'WINE' && product.wineData?.vintage
                      ? `${product.wineData.vintage} ${product.name}`
                      : product.name
                  return {
                    value: product.id,
                    label: `${product.brand.name} ${displayName}`,
                  }
                })}
                rightSection={
                  quickSearch && (
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => {
                        setQuickSearch('')
                        setQuickSearchProducts([])
                      }}
                    >
                      <IconX size={16} />
                    </ActionIcon>
                  )
                }
              />
              {quickSearch && quickSearchProducts.length === 0 && (
                <Text size="xs" c="dimmed" mt="xs">
                  No products found. Continue below to create it.
                </Text>
              )}
              {!quickSearch && (
                <Text size="xs" c="dimmed" mt="xs" ta="center">
                  Or skip to brand selection below ↓
                </Text>
              )}
            </div>
          )}

          {/* Show selected product */}
          {form.values.productId && (() => {
            // Try to find product in all available sources
            const selectedProduct = selectedProductData || 
              quickSearchProducts.find((p) => p.id === form.values.productId) || 
              products.find((p) => p.id === form.values.productId)
            
            if (selectedProduct) {
              const displayName =
                selectedProduct.brand.type === 'WINE' && selectedProduct.wineData?.vintage
                  ? `${selectedProduct.wineData.vintage} ${selectedProduct.name}`
                  : selectedProduct.name
              
              return (
                <Card 
                  padding="md" 
                  withBorder 
                  style={{ 
                    borderColor: 'var(--color-wine)', 
                    background: 'var(--color-cream)',
                    borderWidth: 2
                  }}
                >
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Text size="xs" c="dimmed" mb={4}>
                        Selected Product
                      </Text>
                      <Text fw={600} size="lg" style={{ color: 'var(--color-burgundy)' }}>
                        {displayName}
                      </Text>
                      <Text size="sm" c="dimmed" mt={4}>
                        {selectedProduct.brand.name}
                        {selectedProduct.wineData?.varietal && ` • ${selectedProduct.wineData.varietal}`}
                        {selectedProduct.wineData?.region && ` • ${selectedProduct.wineData.region}`}
                      </Text>
                    </div>
                    <Badge
                      color={selectedProduct.brand.type === 'WINE' ? 'wine' : selectedProduct.brand.type === 'SPIRIT' ? 'amber' : 'blue'}
                      variant="light"
                      style={{ fontWeight: 600 }}
                    >
                      {selectedProduct.brand.type}
                    </Badge>
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => {
                        form.setFieldValue('productId', '')
                        setSelectedProductData(null)
                        setQuickSearch('')
                        setQuickSearchProducts([])
                        setProducts([])
                        productForm.setFieldValue('brandId', '')
                        setShowQuickSearch(true)
                      }}
                    >
                      Change
                    </Button>
                  </Group>
                </Card>
              )
            }
            return null
          })()}

          {/* Step 1: Brand Selection */}
          {!form.values.productId && (
            <div>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={600} style={{ color: 'var(--color-burgundy)' }}>
                1. Brand (Producer/Winery)
              </Text>
              <Text size="xs" c="dimmed">
                e.g., "Domaine de la Romanée-Conti", "Macallan"
              </Text>
            </Group>
            {!showBrandForm ? (
              <Group gap="xs">
                <Select
                  placeholder="Search or select brand"
                  data={brands.map((b) => ({ value: b.id, label: b.name }))}
                  searchable
                  style={{ flex: 1 }}
                  onSearchChange={(value) => {
                    if (value) {
                      fetchBrands(value)
                    }
                  }}
                  value={productForm.values.brandId || null}
                  onChange={(value) => {
                    productForm.setFieldValue('brandId', value || '')
                    form.setFieldValue('productId', '')
                    setProductSearch('')
                    if (value) {
                      // Fetch products for this brand
                      fetchProducts('')
                    } else {
                      setProducts([])
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBrandForm(true)
                    brandForm.setFieldValue('name', '')
                    brandForm.setFieldValue('type', 'WINE')
                  }}
                  style={{
                    borderColor: 'var(--color-wine)',
                    color: 'var(--color-wine)',
                  }}
                >
                  + New
                </Button>
              </Group>
            ) : (
              <Card padding="md" withBorder style={{ borderColor: 'var(--color-beige)', background: 'var(--color-cream)' }}>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text size="sm" fw={500} style={{ color: 'var(--color-burgundy)' }}>
                      Create New Brand
                    </Text>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => {
                        setShowBrandForm(false)
                        brandForm.reset()
                      }}
                    >
                      <IconX size={16} />
                    </ActionIcon>
                  </Group>
                  <TextInput
                    placeholder="Brand name"
                    {...brandForm.getInputProps('name')}
                  />
                  <Select
                    placeholder="Type"
                    data={[
                      { value: 'WINE', label: 'Wine' },
                      { value: 'SPIRIT', label: 'Spirit' },
                      { value: 'BEER', label: 'Beer' },
                    ]}
                    {...brandForm.getInputProps('type')}
                  />
                  <Button
                    size="sm"
                    onClick={handleCreateBrand}
                    loading={creatingBrand}
                    style={{
                      background: 'var(--gradient-wine)',
                      color: 'white',
                    }}
                  >
                    Create Brand
                  </Button>
                </Stack>
              </Card>
            )}
            </div>
          )}

          {/* Step 2: Product Selection */}
          {!form.values.productId && productForm.values.brandId && (
            <div>
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={600} style={{ color: 'var(--color-burgundy)' }}>
                  2. Product (Wine/Spirit Name)
                </Text>
                <Text size="xs" c="dimmed">
                  e.g., "Cabernet Sauvignon", "18 Year Single Malt"
                </Text>
              </Group>
              {!form.values.productId ? (
                <Stack gap="sm">
                  <Autocomplete
                    placeholder={`Search products for ${brands.find(b => b.id === productForm.values.brandId)?.name || 'this brand'}...`}
                    value={productSearch}
                    onChange={(value) => {
                      setProductSearch(value)
                      if (productForm.values.brandId) {
                        // Always filter by selected brand
                        fetchProducts(value)
                      } else if (value.trim()) {
                        fetchProducts(value)
                      } else {
                        setProducts([])
                      }
                    }}
                    onFocus={() => {
                      // Load products for the selected brand when focusing
                      if (productForm.values.brandId && !productSearch) {
                        fetchProducts('')
                      }
                    }}
                    onOptionSubmit={(value) => {
                      const product = products.find((p) => p.id === value)
                      if (product) {
                        form.setFieldValue('productId', product.id)
                        setSelectedProductData(product)
                        const displayName =
                          product.brand.type === 'WINE' && product.wineData?.vintage
                            ? `${product.wineData.vintage} ${product.name}`
                            : product.name
                        setProductSearch(displayName)
                      }
                    }}
                    data={products.map((product) => {
                      const displayName =
                        product.brand.type === 'WINE' && product.wineData?.vintage
                          ? `${product.wineData.vintage} ${product.name}`
                          : product.name
                      return {
                        value: product.id,
                        label: displayName,
                      }
                    })}
                    rightSection={
                      productSearch && (
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => {
                            setProductSearch('')
                            setProducts([])
                          }}
                        >
                          <IconX size={16} />
                        </ActionIcon>
                      )
                    }
                  />
                  <Divider label="OR" labelPosition="center" />
                  <Card padding="md" withBorder style={{ borderColor: 'var(--color-beige)', background: 'var(--color-cream)' }}>
                    <Stack gap="sm">
                      <div>
                        <Text size="sm" fw={500} style={{ color: 'var(--color-burgundy)' }} mb={4}>
                          Create New Product
                        </Text>
                        <Text size="xs" c="dimmed">
                          Fill in the details below to add this product to your collection
                        </Text>
                      </div>
                      <TextInput
                        label="Product Name"
                        placeholder="e.g., Cabernet Sauvignon, Reserve Blend"
                        required
                        description="The name of the wine or spirit"
                        {...productForm.getInputProps('name')}
                      />
                      {productForm.values.brandId && (() => {
                        const selectedBrand = brands.find((b) => b.id === productForm.values.brandId)
                        const isWine = selectedBrand?.type === 'WINE'
                        
                        return (
                          <>
                            {isWine ? (
                              <>
                                <Select
                                  label="Vintage"
                                  placeholder="Select year"
                                  required
                                  description="The year the grapes were harvested"
                                  data={Array.from({ length: 50 }, (_, i) => {
                                    const year = new Date().getFullYear() - i
                                    return { value: year.toString(), label: year.toString() }
                                  })}
                                  searchable
                                  {...productForm.getInputProps('vintage')}
                                />
                                <TextInput
                                  label="Varietal"
                                  placeholder="e.g., Cabernet Sauvignon, Chardonnay, Pinot Noir"
                                  required
                                  description="The grape variety or blend"
                                  {...productForm.getInputProps('varietal')}
                                />
                                <TextInput
                                  label="Region"
                                  placeholder="e.g., Napa Valley, Bordeaux, Tuscany"
                                  description="The wine region or appellation"
                                  {...productForm.getInputProps('region')}
                                />
                              </>
                            ) : (
                              <>
                                <TextInput
                                  label="Style"
                                  placeholder="e.g., Single Malt, Bourbon, Vodka"
                                  description="The style or type of spirit"
                                  {...productForm.getInputProps('varietal')}
                                />
                                <TextInput
                                  label="Age Statement (optional)"
                                  placeholder="e.g., 12 Year, 18 Year"
                                  description="Age statement if applicable"
                                  {...productForm.getInputProps('vintage')}
                                />
                              </>
                            )}
                          </>
                        )
                      })()}
                      <Button
                        onClick={handleCreateProduct}
                        loading={creatingProduct}
                        size="sm"
                        style={{
                          background: 'var(--gradient-wine)',
                          color: 'white',
                        }}
                      >
                        Create Product
                      </Button>
                    </Stack>
                  </Card>
                </Stack>
              ) : (
                <Card padding="sm" withBorder style={{ borderColor: 'var(--color-beige)' }}>
                  <Group justify="space-between">
                    <div>
                      <Text fw={500} size="sm">
                        {(() => {
                          const product = products.find((p) => p.id === form.values.productId)
                          if (product) {
                            const displayName =
                              product.brand.type === 'WINE' && product.wineData?.vintage
                                ? `${product.wineData.vintage} ${product.name}`
                                : product.name
                            return `${product.brand.name} ${displayName}`
                          }
                          return productSearch
                        })()}
                      </Text>
                    </div>
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => {
                        form.setFieldValue('productId', '')
                        setProductSearch('')
                        setProducts([])
                      }}
                    >
                      Change
                    </Button>
                  </Group>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: Bottle Details */}
          {form.values.productId && (
            <>
              <Divider />
              <div>
                <Text size="sm" fw={600} mb="xs" style={{ color: 'var(--color-burgundy)' }}>
                  3. Bottle Details (Optional)
                </Text>
                <Stack gap="sm">
                  <Group grow>
                    <NumberInput
                      label="Purchase Price"
                      placeholder="0.00"
                      prefix="$"
                      decimalScale={2}
                      fixedDecimalScale
                      {...form.getInputProps('purchasePrice')}
                    />
                    <TextInput
                      label="Purchase Date"
                      type="date"
                      {...form.getInputProps('purchaseDate')}
                    />
                  </Group>
                  <TextInput
                    label="Notes"
                    placeholder="Add any notes about this bottle..."
                    {...form.getInputProps('notes')}
                  />
                  <div>
                    <Text size="sm" fw={500} mb={4} style={{ color: 'var(--color-brown)' }}>
                      Quantity
                    </Text>
                    <Group gap="xs" align="center" justify="center">
                      <ActionIcon
                        size="md"
                        variant="light"
                        color="wine"
                        onClick={() => {
                          const current = form.values.quantity || 1
                          if (current > 1) {
                            form.setFieldValue('quantity', current - 1)
                          }
                        }}
                        disabled={!form.values.quantity || form.values.quantity <= 1}
                        style={{
                          border: '1px solid var(--color-beige)',
                        }}
                      >
                        <IconX size={16} />
                      </ActionIcon>
                      <Box
                        style={{
                          minWidth: '60px',
                          textAlign: 'center',
                          padding: '0.5rem 1rem',
                          background: 'var(--color-cream)',
                          borderRadius: '8px',
                          border: '1px solid var(--color-beige)',
                        }}
                      >
                        <Text
                          fw={600}
                          size="lg"
                          style={{
                            color: 'var(--color-burgundy)',
                            fontFamily: 'var(--font-playfair)',
                          }}
                        >
                          {form.values.quantity || 1}
                        </Text>
                      </Box>
                      <ActionIcon
                        size="md"
                        variant="light"
                        color="wine"
                        onClick={() => {
                          const current = form.values.quantity || 1
                          form.setFieldValue('quantity', current + 1)
                        }}
                        disabled={form.values.quantity >= 100}
                        style={{
                          border: '1px solid var(--color-beige)',
                        }}
                      >
                        <IconPlus size={16} />
                      </ActionIcon>
                    </Group>
                  </div>
                </Stack>
              </div>
              <Button
                onClick={handleQuickAdd}
                fullWidth
                size="md"
                style={{
                  background: 'var(--gradient-wine)',
                  color: 'white',
                }}
              >
                Add {form.values.quantity > 1 ? `${form.values.quantity} Bottles` : 'Bottle'} to Inventory
              </Button>
            </>
          )}
        </Stack>
      </Modal>

      {/* Stash Suggestion Modal */}
      <Modal
        opened={stashSuggestionOpened}
        onClose={() => setStashSuggestionOpened(false)}
        title="Great start! 🎉"
        size="md"
        centered
        styles={{
          title: {
            color: 'var(--color-burgundy)',
            fontFamily: 'var(--font-playfair)',
            fontWeight: 600,
            fontSize: '1.5rem',
          },
        }}
      >
        <Stack gap="lg">
          <Text size="md">
            You've added your first bottle! To keep your collection organized, consider creating a storage location.
          </Text>
          
          <Card padding="md" radius="md" style={{ background: 'var(--color-cream)', border: '1px solid var(--color-beige)' }}>
            <Stack gap="xs">
              <Text fw={600} size="sm" style={{ color: 'var(--color-burgundy)' }}>
                What's a Storage Location?
              </Text>
              <Text size="sm" c="dimmed">
                A storage location (or "stash") represents a physical space like a wine cellar, liquor cabinet, or refrigerator where you keep your bottles organized on shelves.
              </Text>
            </Stack>
          </Card>

          <Group justify="space-between" mt="md">
            <Button
              variant="subtle"
              onClick={() => setStashSuggestionOpened(false)}
            >
              Maybe Later
            </Button>
            <Button
              component={Link}
              href="/stashes/create"
              leftSection={<IconPlus size={16} />}
              style={{ background: 'var(--color-wine)' }}
              onClick={() => setStashSuggestionOpened(false)}
            >
              Create Storage Location
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  )
}

