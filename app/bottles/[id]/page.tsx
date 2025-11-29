import {
  Container,
  Title,
  Text,
  Card,
  Group,
  Badge,
  Stack,
  Button,
  Divider,
  Paper,
  Grid,
  Box
} from '@mantine/core'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { IconArrowLeft, IconBottle, IconCalendar, IconCurrencyDollar } from '@tabler/icons-react'

export default async function BottleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const bottle = await prisma.bottle.findFirst({
    where: {
      id,
      userId: session.user.id
    },
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

  if (!bottle) {
    redirect('/stashes')
  }

  const product = bottle.product
  const brand = product.brand

  const getProductDisplayName = () => {
    if (brand.type === 'WINE' && product.wineData) {
      const vintage = product.wineData.vintage ? `${product.wineData.vintage} ` : ''
      return `${vintage}${product.name}`
    }
    return product.name
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)' }}>
      <Container size="md" py="xl">
        <Group mb="xl">
          {bottle.shelfItem ? (
            <Link href={`/shelves/${bottle.shelfItem.shelfId}`} style={{ textDecoration: 'none' }}>
              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size={16} />}
                style={{ color: 'var(--color-wine)' }}
              >
                Back to {bottle.shelfItem.shelf.name}
              </Button>
            </Link>
          ) : (
            <Link href="/stashes" style={{ textDecoration: 'none' }}>
              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size={16} />}
                style={{ color: 'var(--color-wine)' }}
              >
                Back to Stashes
              </Button>
            </Link>
          )}
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
                  {getProductDisplayName()}
                </Title>
                <Text c="dimmed" mt="xs" size="lg">
                  {brand.name}
                </Text>
              </div>
              <Badge
                size="lg"
                color={brand.type === 'WINE' ? 'wine' : brand.type === 'SPIRIT' ? 'amber' : 'blue'}
                style={{ fontWeight: 600 }}
              >
                {brand.type}
              </Badge>
            </Group>
          </Card>

          {/* Product Details */}
          <Card 
            withBorder 
            p="lg"
            style={{ 
              borderColor: 'var(--color-beige)',
              background: 'white'
            }}
          >
            <Title order={3} mb="md" style={{ color: 'var(--color-burgundy)' }}>
              Product Details
            </Title>
          <Stack gap="sm">
            {product.wineData && (
              <>
                {product.wineData.varietal && (
                  <Group justify="space-between">
                    <Text c="dimmed">Varietal</Text>
                    <Text fw={500}>{product.wineData.varietal}</Text>
                  </Group>
                )}
                {product.wineData.region && (
                  <Group justify="space-between">
                    <Text c="dimmed">Region</Text>
                    <Text fw={500}>{product.wineData.region}</Text>
                  </Group>
                )}
                {product.wineData.vintage && (
                  <Group justify="space-between">
                    <Text c="dimmed">Vintage</Text>
                    <Text fw={500}>{product.wineData.vintage}</Text>
                  </Group>
                )}
                {product.wineData.abv && (
                  <Group justify="space-between">
                    <Text c="dimmed">ABV</Text>
                    <Text fw={500}>{product.wineData.abv}%</Text>
                  </Group>
                )}
              </>
            )}
            {product.spiritData && (
              <>
                {product.spiritData.style && (
                  <Group justify="space-between">
                    <Text c="dimmed">Style</Text>
                    <Text fw={500}>{product.spiritData.style}</Text>
                  </Group>
                )}
                {product.spiritData.ageStatement && (
                  <Group justify="space-between">
                    <Text c="dimmed">Age Statement</Text>
                    <Text fw={500}>{product.spiritData.ageStatement}</Text>
                  </Group>
                )}
                {product.spiritData.abv && (
                  <Group justify="space-between">
                    <Text c="dimmed">ABV</Text>
                    <Text fw={500}>{product.spiritData.abv}%</Text>
                  </Group>
                )}
                {product.spiritData.proof && (
                  <Group justify="space-between">
                    <Text c="dimmed">Proof</Text>
                    <Text fw={500}>{product.spiritData.proof}</Text>
                  </Group>
                )}
              </>
            )}
          </Stack>
        </Card>

        {/* Bottle Details */}
        <Card 
          withBorder 
          p="lg"
          style={{ 
            borderColor: 'var(--color-beige)',
            background: 'white'
          }}
        >
          <Title order={3} mb="md" style={{ color: 'var(--color-burgundy)' }}>
            Bottle Details
          </Title>
          <Stack gap="sm">
            {bottle.size && (
              <Group justify="space-between">
                <Text c="dimmed">Size</Text>
                <Text fw={500}>{bottle.size}ml</Text>
              </Group>
            )}
            {bottle.amountRemaining !== null && (
              <Group justify="space-between">
                <Text c="dimmed">Amount Remaining</Text>
                <Text fw={500}>{bottle.amountRemaining}%</Text>
              </Group>
            )}
            {bottle.purchasePrice !== null && (
              <Group justify="space-between">
                <Text c="dimmed">Purchase Price</Text>
                <Text fw={500}>${bottle.purchasePrice.toFixed(2)}</Text>
              </Group>
            )}
            {bottle.purchaseDate && (
              <Group justify="space-between">
                <Text c="dimmed">Purchase Date</Text>
                <Text fw={500}>{formatDate(bottle.purchaseDate)}</Text>
              </Group>
            )}
            {bottle.openDate && (
              <Group justify="space-between">
                <Text c="dimmed">Open Date</Text>
                <Text fw={500}>{formatDate(bottle.openDate)}</Text>
              </Group>
            )}
            {bottle.finished && (
              <Group justify="space-between">
                <Text c="dimmed">Status</Text>
                <Badge color="gray">Finished</Badge>
              </Group>
            )}
            {bottle.finishDate && (
              <Group justify="space-between">
                <Text c="dimmed">Finish Date</Text>
                <Text fw={500}>{formatDate(bottle.finishDate)}</Text>
              </Group>
            )}
            {bottle.rating && (
              <Group justify="space-between">
                <Text c="dimmed">Rating</Text>
                <Text fw={500}>{bottle.rating}/10</Text>
              </Group>
            )}
          </Stack>
        </Card>

        {/* Location */}
        {bottle.shelfItem && (
          <Card 
            withBorder 
            p="lg"
            style={{ 
              borderColor: 'var(--color-beige)',
              background: 'white'
            }}
          >
            <Title order={3} mb="md" style={{ color: 'var(--color-burgundy)' }}>
              Location
            </Title>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text c="dimmed">Stash</Text>
                <Text fw={500}>{bottle.shelfItem.shelf.stash?.name || 'N/A'}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">Shelf</Text>
                <Text fw={500}>{bottle.shelfItem.shelf.name}</Text>
              </Group>
            </Stack>
          </Card>
        )}

        {/* Notes */}
        {bottle.notes && (
          <Card 
            withBorder 
            p="lg"
            style={{ 
              borderColor: 'var(--color-beige)',
              background: 'white'
            }}
          >
            <Title order={3} mb="md" style={{ color: 'var(--color-burgundy)' }}>
              Notes
            </Title>
            <Text style={{ color: 'var(--color-brown)' }}>{bottle.notes}</Text>
          </Card>
        )}
      </Stack>
    </Container>
    </Box>
  )
}

