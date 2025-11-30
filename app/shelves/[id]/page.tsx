'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Group,
  Badge,
  Stack,
  Button,
  Divider,
  Paper,
  Box,
  Loader
} from '@mantine/core'
import Link from 'next/link'
import { IconBottle, IconTemperature, IconArrowLeft, IconPlus } from '@tabler/icons-react'
import { AddBottlesModal } from '@/components/stashes/AddBottlesModal'

interface Shelf {
  id: string
  name: string
  order: number | null
  temp: number | null
  capacity: number | null
  description: string | null
  stashId: string | null
  stash: {
    id: string
    name: string
    location: string
  } | null
  shelfItems: Array<{
    id: string
    order: number
    bottle: {
      id: string
      finished: boolean
      amountRemaining: number | null
      purchasePrice: number | null
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
        } | null
      }
    }
  }>
}

export default function ShelfDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [shelf, setShelf] = useState<Shelf | null>(null)
  const [loading, setLoading] = useState(true)
  const [addBottlesModalOpen, setAddBottlesModalOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && id) {
      fetchShelf()
    }
  }, [status, router, id])

  const fetchShelf = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/shelves/${id}`)
      if (response.ok) {
        const data = await response.json()
        setShelf(data)
      } else if (response.status === 404) {
        router.push('/stashes')
      }
    } catch (error) {
      console.error('Error fetching shelf:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading || !shelf) {
    return (
      <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size="lg" color="wine" />
      </Box>
    )
  }

  const getProductDisplayName = (product: Shelf['shelfItems'][0]['bottle']['product']) => {
    if (product.brand.type === 'WINE' && product.wineData) {
      const vintage = product.wineData.vintage ? `${product.wineData.vintage} ` : ''
      return `${vintage}${product.name}`
    }
    return product.name
  }

  const getProductSubtitle = (product: Shelf['shelfItems'][0]['bottle']['product']) => {
    const parts = []
    if (product.brand.name) parts.push(product.brand.name)
    if (product.wineData?.varietal) parts.push(product.wineData.varietal)
    if (product.wineData?.region) parts.push(product.wineData.region)
    if (product.spiritData?.style) parts.push(product.spiritData.style)
    return parts.join(' • ')
  }

  return (
    <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)' }}>
      <Container size="xl" py="xl">
        <Group mb="xl">
          <Link href={`/stashes/${shelf.stashId}`} style={{ textDecoration: 'none' }}>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              style={{ color: 'var(--color-wine)' }}
            >
              Back to {shelf.stash?.name}
            </Button>
          </Link>
        </Group>

        <Stack gap="xl">
          <Card 
            padding="xl" 
            radius="md" 
            withBorder
            style={{ 
              borderColor: 'var(--color-beige)',
              background: 'white'
            }}
          >
            <Group justify="space-between" align="flex-start" mb="md">
              <div>
                <Title order={1} style={{ color: 'var(--color-burgundy)' }}>
                  {shelf.name}
                </Title>
                <Text c="dimmed" mt="xs" size="lg">
                  {shelf.stash?.name} • {shelf.stash?.location}
                </Text>
              </div>
              {shelf.order !== null && (
                <Badge size="lg" variant="light" color="wine" style={{ fontWeight: 600 }}>
                  Shelf #{shelf.order}
                </Badge>
              )}
            </Group>

            {shelf.description && (
              <Text mb="md" style={{ color: 'var(--color-brown)' }}>
                {shelf.description}
              </Text>
            )}

            <Group gap="xl" mt="md">
              {shelf.temp !== null && (
                <Group gap={6}>
                  <IconTemperature size={24} style={{ color: 'var(--color-wine)' }} />
                  <div>
                    <Text size="xs" c="dimmed">Temperature</Text>
                    <Text size="lg" fw={600} style={{ color: 'var(--color-burgundy)' }}>
                      {shelf.temp}°C
                    </Text>
                  </div>
                </Group>
              )}
              {shelf.capacity !== null ? (
                <Group gap={6}>
                  <IconBottle size={24} style={{ color: 'var(--color-wine)' }} />
                  <div>
                    <Text size="xs" c="dimmed">Capacity</Text>
                    <Text size="lg" fw={600} style={{ color: 'var(--color-burgundy)' }}>
                      {shelf.shelfItems.length} / {shelf.capacity}
                    </Text>
                  </div>
                </Group>
              ) : (
                <Group gap={6}>
                  <IconBottle size={24} style={{ color: 'var(--color-wine)' }} />
                  <div>
                    <Text size="xs" c="dimmed">Bottles</Text>
                    <Text size="lg" fw={600} style={{ color: 'var(--color-burgundy)' }}>
                      {shelf.shelfItems.length}
                    </Text>
                  </div>
                </Group>
              )}
            </Group>
          </Card>

          <div>
            <Group justify="space-between" mb="md">
              <Title order={2} style={{ color: 'var(--color-burgundy)' }}>
                Bottles
              </Title>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setAddBottlesModalOpen(true)}
                style={{ background: 'var(--color-wine)' }}
              >
                Add Bottles
              </Button>
            </Group>
            
            {shelf.shelfItems.length === 0 ? (
              <Card 
                p="xl" 
                withBorder
                style={{ 
                  borderColor: 'var(--color-beige)',
                  background: 'white',
                  textAlign: 'center'
                }}
              >
                <Stack gap="md" align="center">
                  <Text ta="center" c="dimmed">
                    No bottles on this shelf yet.
                  </Text>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => setAddBottlesModalOpen(true)}
                    style={{ background: 'var(--color-wine)' }}
                  >
                    Add Your First Bottle
                  </Button>
                </Stack>
              </Card>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                {shelf.shelfItems.map((shelfItem: typeof shelf.shelfItems[0]) => {
                  const bottle = shelfItem.bottle
                  const product = bottle.product
                  const brand = product.brand

                  return (
                    <Link key={shelfItem.id} href={`/bottles/${bottle.id}`} style={{ textDecoration: 'none', height: '100%', display: 'block' }}>
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
                          cursor: 'pointer'
                        }}
                      >
                        <Stack gap="sm">
                          <Group justify="space-between" align="flex-start">
                            <div style={{ flex: 1 }}>
                              <Text fw={600} size="lg" lineClamp={2} style={{ color: 'var(--color-burgundy)' }}>
                                {getProductDisplayName(product)}
                              </Text>
                              <Text size="sm" c="dimmed" mt={4} lineClamp={1}>
                                {getProductSubtitle(product)}
                              </Text>
                            </div>
                            <Badge
                              color={brand.type === 'WINE' ? 'wine' : brand.type === 'SPIRIT' ? 'amber' : 'blue'}
                              variant="light"
                              style={{ fontWeight: 600 }}
                            >
                              {brand.type}
                            </Badge>
                          </Group>

                          <Divider />

                          <Group justify="space-between">
                            {bottle.amountRemaining !== null && (
                              <div>
                                <Text size="xs" c="dimmed">Remaining</Text>
                                <Text size="sm" fw={600} style={{ color: 'var(--color-burgundy)' }}>
                                  {bottle.amountRemaining}%
                                </Text>
                              </div>
                            )}
                            {bottle.purchasePrice !== null && (
                              <div>
                                <Text size="xs" c="dimmed">Price</Text>
                                <Text size="sm" fw={600} style={{ color: 'var(--color-burgundy)' }}>
                                  ${bottle.purchasePrice.toFixed(2)}
                                </Text>
                              </div>
                            )}
                            {bottle.finished && (
                              <Badge color="gray" variant="light" size="sm">
                                Finished
                              </Badge>
                            )}
                          </Group>
                        </Stack>
                      </Card>
                    </Link>
                  )
                })}
              </SimpleGrid>
            )}
          </div>
        </Stack>
      </Container>

      {/* Add Bottles Modal */}
      <AddBottlesModal
        opened={addBottlesModalOpen}
        onClose={() => setAddBottlesModalOpen(false)}
        onSuccess={() => {
          fetchShelf()
        }}
        preselectedStashId={shelf.stashId || undefined}
        preselectedShelfId={shelf.id}
      />
    </Box>
  )
}

