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
  Button,
  Table,
} from '@mantine/core'
import { IconSearch, IconBottle, IconFilter, IconArrowLeft, IconStar } from '@tabler/icons-react'
import Link from 'next/link'

interface ProductInventory {
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
  totalCount: number
  activeCount: number
  finishedCount: number
  totalValue: number
  averageRating: number | null
}

export default function BottleInventoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [inventory, setInventory] = useState<ProductInventory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [includeFinished, setIncludeFinished] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      fetchInventory()
    }
  }, [status, router, includeFinished])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/bottles/inventory?includeFinished=${includeFinished}`)
      if (response.ok) {
        const data = await response.json()
        setInventory(data)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  // Normalize strings for search
  const normalizeForSearch = (str: string): string => {
    if (!str) return ''
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[''`´\u2018\u2019\u201A\u201B\u2032\u2035]/g, '')
      .replace(/["""\u201C\u201D\u201E\u201F\u2033\u2036]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const filteredInventory = useMemo(() => {
    let filtered = inventory

    // Filter by search query
    if (searchQuery.trim()) {
      const normalizedQuery = normalizeForSearch(searchQuery)
      
      filtered = filtered.filter((item) => {
        const productName = normalizeForSearch(item.product.name)
        const brandName = normalizeForSearch(item.product.brand.name)
        const varietal = normalizeForSearch(item.product.wineData?.varietal || '')
        const region = normalizeForSearch(item.product.wineData?.region || '')
        const vintage = normalizeForSearch(item.product.wineData?.vintage || '')
        const style = normalizeForSearch(item.product.spiritData?.style || '')

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
  }, [inventory, searchQuery])

  const getProductDisplayName = (product: ProductInventory['product']) => {
    if (product.brand.type === 'WINE' && product.wineData?.vintage) {
      return `${product.wineData.vintage} ${product.name}`
    }
    return product.name
  }

  const getProductSubtitle = (product: ProductInventory['product']) => {
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

  const totalProducts = filteredInventory.length
  const totalBottles = filteredInventory.reduce((sum, item) => sum + (includeFinished ? item.totalCount : item.activeCount), 0)
  const totalValue = filteredInventory.reduce((sum, item) => sum + item.totalValue, 0)

  return (
    <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)' }}>
      <Container size="xl" py="xl">
        <Stack gap="xl">
          {/* Header */}
          <Group justify="space-between" align="flex-start">
            <div>
              <Group gap="sm" mb="xs">
                <Link href="/bottles" style={{ textDecoration: 'none' }}>
                  <Button
                    variant="subtle"
                    leftSection={<IconArrowLeft size={18} />}
                    style={{ color: 'var(--color-wine)' }}
                  >
                    Back to Bottles
                  </Button>
                </Link>
              </Group>
              <Title order={1} mb="xs" style={{ color: 'var(--color-burgundy)' }}>
                Inventory by Product
              </Title>
              <Text size="lg" style={{ color: 'var(--color-brown)' }}>
                See how many bottles you have of each product
              </Text>
            </div>
          </Group>

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
                    {totalProducts} {totalProducts === 1 ? 'product' : 'products'} • {totalBottles} {totalBottles === 1 ? 'bottle' : 'bottles'}
                    {searchQuery && ` matching "${searchQuery}"`}
                  </Text>
                </Group>
                <Group gap="xs">
                  <IconFilter size={18} style={{ color: 'var(--color-wine)' }} />
                  <Switch
                    label="Include finished bottles"
                    checked={includeFinished}
                    onChange={(e) => setIncludeFinished(e.currentTarget.checked)}
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
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
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
                    Total Products
                  </Text>
                  <Title order={2} mt="xs" style={{ color: 'var(--color-burgundy)' }}>
                    {totalProducts}
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
                    Total Bottles
                  </Text>
                  <Title order={2} mt="xs" style={{ color: 'var(--color-burgundy)' }}>
                    {totalBottles}
                  </Title>
                </div>
                <Box
                  style={{
                    padding: '0.75rem',
                    borderRadius: '12px',
                    background: 'var(--gradient-amber)',
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
                    Total Value
                  </Text>
                  <Title order={2} mt="xs" style={{ color: 'var(--color-burgundy)' }}>
                    ${totalValue.toFixed(2)}
                  </Title>
                </div>
                <Box
                  style={{
                    padding: '0.75rem',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                    color: 'white',
                  }}
                >
                  <Text size="xl" fw={700}>$</Text>
                </Box>
              </Group>
            </Card>
          </SimpleGrid>

          {/* Inventory Table/Grid */}
          {filteredInventory.length === 0 ? (
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
                  No products found matching "{searchQuery}"
                </Text>
              ) : (
                <Stack gap="xl" align="center">
                  <Box>
                    <Title order={2} ta="center" mb="md" style={{ color: 'var(--color-burgundy)' }}>
                      No Products Found
                    </Title>
                    <Text size="lg" c="dimmed" ta="center" mb="xl" style={{ maxWidth: '500px', margin: '0 auto' }}>
                      Start adding bottles to see your inventory by product.
                    </Text>
                  </Box>
                  <Link href="/bottles" style={{ textDecoration: 'none' }}>
                    <Button
                      size="lg"
                      style={{
                        background: 'var(--gradient-wine)',
                        color: 'white',
                      }}
                    >
                      Go to Bottles
                    </Button>
                  </Link>
                </Stack>
              )}
            </Card>
          ) : (
            <Card
              padding="0"
              radius="md"
              withBorder
              style={{
                borderColor: 'var(--color-beige)',
                background: 'white',
                overflow: 'hidden',
              }}
            >
              <Box style={{ overflowX: 'auto' }}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr style={{ background: 'var(--color-cream)' }}>
                      <Table.Th style={{ color: 'var(--color-burgundy)', fontWeight: 600 }}>Product</Table.Th>
                      <Table.Th style={{ color: 'var(--color-burgundy)', fontWeight: 600 }}>Type</Table.Th>
                      <Table.Th style={{ color: 'var(--color-burgundy)', fontWeight: 600, textAlign: 'center' }}>
                        {includeFinished ? 'Total' : 'Active'}
                      </Table.Th>
                      {includeFinished && (
                        <>
                          <Table.Th style={{ color: 'var(--color-burgundy)', fontWeight: 600, textAlign: 'center' }}>Active</Table.Th>
                          <Table.Th style={{ color: 'var(--color-burgundy)', fontWeight: 600, textAlign: 'center' }}>Finished</Table.Th>
                        </>
                      )}
                      <Table.Th style={{ color: 'var(--color-burgundy)', fontWeight: 600, textAlign: 'right' }}>Total Value</Table.Th>
                      <Table.Th style={{ color: 'var(--color-burgundy)', fontWeight: 600, textAlign: 'center' }}>Avg Rating</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredInventory.map((item) => (
                      <Table.Tr key={item.product.id} style={{ cursor: 'pointer' }}>
                        <Table.Td>
                          <div>
                            <Text fw={600} size="sm" style={{ color: 'var(--color-burgundy)' }}>
                              {getProductDisplayName(item.product)}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {getProductSubtitle(item.product)}
                            </Text>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={
                              item.product.brand.type === 'WINE'
                                ? 'wine'
                                : item.product.brand.type === 'SPIRIT'
                                ? 'amber'
                                : 'blue'
                            }
                            variant="light"
                            size="sm"
                          >
                            {item.product.brand.type}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text fw={700} ta="center" size="lg" style={{ color: 'var(--color-burgundy)' }}>
                            {includeFinished ? item.totalCount : item.activeCount}
                          </Text>
                        </Table.Td>
                        {includeFinished && (
                          <>
                            <Table.Td>
                              <Text ta="center" size="sm" c="dimmed">
                                {item.activeCount}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text ta="center" size="sm" c="dimmed">
                                {item.finishedCount}
                              </Text>
                            </Table.Td>
                          </>
                        )}
                        <Table.Td>
                          <Text ta="right" fw={500} style={{ color: 'var(--color-brown)' }}>
                            {item.totalValue > 0 ? `$${item.totalValue.toFixed(2)}` : '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          {item.averageRating ? (
                            <Group gap={4} justify="center">
                              <IconStar size={14} style={{ color: 'var(--color-amber)' }} fill="var(--color-amber)" />
                              <Text size="sm" fw={500}>
                                {item.averageRating.toFixed(1)}
                              </Text>
                            </Group>
                          ) : (
                            <Text ta="center" c="dimmed" size="sm">—</Text>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Box>
            </Card>
          )}
        </Stack>
      </Container>
    </Box>
  )
}
