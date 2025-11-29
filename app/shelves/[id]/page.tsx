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
  Table
} from '@mantine/core'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { IconBottle, IconTemperature, IconArrowLeft } from '@tabler/icons-react'

export default async function ShelfDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const shelf = await prisma.shelf.findFirst({
    where: {
      id,
      stash: {
        userId: session.user.id
      }
    },
    include: {
      stash: true,
      shelfItems: {
        include: {
          bottle: {
            include: {
              product: {
                include: {
                  brand: true,
                  wineData: true,
                  spiritData: true
                }
              }
            }
          }
        },
        orderBy: {
          order: 'asc'
        }
      }
    }
  })

  if (!shelf) {
    redirect('/stashes')
  }

  const getProductDisplayName = (product: any) => {
    if (product.brand.type === 'WINE' && product.wineData) {
      const vintage = product.wineData.vintage ? `${product.wineData.vintage} ` : ''
      return `${vintage}${product.name}`
    }
    return product.name
  }

  const getProductSubtitle = (product: any) => {
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
            <Title order={2} mb="md" style={{ color: 'var(--color-burgundy)' }}>
              Bottles
            </Title>
            
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
                <Text ta="center" c="dimmed">
                  No bottles on this shelf yet.
                </Text>
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
    </Box>
  )
}

