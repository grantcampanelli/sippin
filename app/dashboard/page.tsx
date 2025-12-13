import { Container, Title, Text, Button, Group, Card, Stack, SimpleGrid, Box, Badge, Progress, RingProgress, Center } from '@mantine/core'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { 
  IconBottle, 
  IconArrowRight, 
  IconGlass, 
  IconCurrencyDollar, 
  IconTrendingUp,
  IconGlassFull,
  IconBottleFilled,
  IconChartBar,
  IconFlame,
  IconMapPin
} from '@tabler/icons-react'

async function getStats(userId: string) {
  const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stats`, {
    headers: {
      'Cookie': `next-auth.session-token=${userId}`
    },
    cache: 'no-store'
  })
  
  if (!response.ok) {
    // Fallback to basic stats
    return null
  }
  
  return response.json()
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Fetch stats directly using prisma
  const bottles = await prisma.bottle.findMany({
    where: { userId: session.user.id },
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

  const stashes = await prisma.stash.findMany({
    where: { userId: session.user.id },
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

  const wineBottles = bottles.filter(b => b.product.brand.type === 'WINE' && !b.finished)
  const spiritBottles = bottles.filter(b => b.product.brand.type === 'SPIRIT' && !b.finished)

  const totalInvestment = bottles
    .filter(b => b.purchasePrice && !b.finished)
    .reduce((sum, b) => sum + (b.purchasePrice || 0), 0)
  
  const averagePrice = activeBottles > 0 && totalInvestment > 0
    ? totalInvestment / bottles.filter(b => b.purchasePrice && !b.finished).length
    : 0

  const mostExpensive = bottles
    .filter(b => b.purchasePrice && !b.finished)
    .sort((a, b) => (b.purchasePrice || 0) - (a.purchasePrice || 0))
    .slice(0, 3)

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

  // Spirit stats
  const spiritsByStyle = spiritBottles
    .filter(b => b.product.spiritData?.style)
    .reduce((acc, bottle) => {
      const style = bottle.product.spiritData?.style || 'Other'
      acc[style] = (acc[style] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  const topSpiritStyles = Object.entries(spiritsByStyle)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  // Wine stats  
  const winesByStyle = wineBottles
    .filter(b => b.product.wineData?.style)
    .reduce((acc, bottle) => {
      const style = bottle.product.wineData?.style || 'Other'
      acc[style] = (acc[style] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  const topWineStyles = Object.entries(winesByStyle)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  // Recent activity
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const recentlyAdded = bottles.filter(
    b => new Date(b.createdAt) > thirtyDaysAgo
  ).length
  const recentlyFinished = bottles.filter(
    b => b.finishDate && new Date(b.finishDate) > thirtyDaysAgo
  ).length

  const completionRate = totalBottles > 0 ? (finishedBottles / totalBottles) * 100 : 0

  return (
    <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)' }}>
      <Container size="xl" py="xl">
        <Stack gap="xl">
          {/* Welcome Header */}
          <Box>
            <Title order={1} mb="xs" style={{ color: 'var(--color-burgundy)' }}>
              Your Cellar
            </Title>
            <Text size="lg" style={{ color: 'var(--color-brown)' }}>
              Welcome back, {session.user?.name || session.user?.email}!
            </Text>
          </Box>

          {/* Main Stats Row */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
            {/* Total Bottles */}
            <Card 
              padding="xl" 
              radius="md" 
              withBorder
              style={{ 
                borderColor: 'var(--color-beige)',
                background: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '100px',
                  height: '100px',
                  background: 'var(--gradient-wine)',
                  opacity: 0.1,
                  borderRadius: '50%',
                  transform: 'translate(25px, -25px)'
                }}
              />
              <Stack gap="xs" style={{ position: 'relative', zIndex: 1 }}>
                <Group justify="space-between">
                  <IconBottleFilled size={28} style={{ color: 'var(--color-burgundy)' }} />
                </Group>
                <Title order={1} style={{ color: 'var(--color-burgundy)', fontSize: '2.5rem' }}>
                  {activeBottles}
                </Title>
                <Text size="sm" c="dimmed" fw={500} tt="uppercase">
                  Active Bottles
                </Text>
              </Stack>
            </Card>

            {/* Open Bottles */}
            <Card 
              padding="xl" 
              radius="md" 
              withBorder
              style={{ 
                borderColor: 'var(--color-beige)',
                background: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '100px',
                  height: '100px',
                  background: 'var(--gradient-amber)',
                  opacity: 0.1,
                  borderRadius: '50%',
                  transform: 'translate(25px, -25px)'
                }}
              />
              <Stack gap="xs" style={{ position: 'relative', zIndex: 1 }}>
                <Group justify="space-between">
                  <IconGlass size={28} style={{ color: 'var(--color-amber)' }} />
                </Group>
                <Title order={1} style={{ color: 'var(--color-amber)', fontSize: '2.5rem' }}>
                  {openBottles}
                </Title>
                <Text size="sm" c="dimmed" fw={500} tt="uppercase">
                  Currently Open
                </Text>
              </Stack>
            </Card>

            {/* Total Value */}
            <Card 
              padding="xl" 
              radius="md" 
              withBorder
              style={{ 
                borderColor: 'var(--color-beige)',
                background: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '100px',
                  height: '100px',
                  background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                  opacity: 0.1,
                  borderRadius: '50%',
                  transform: 'translate(25px, -25px)'
                }}
              />
              <Stack gap="xs" style={{ position: 'relative', zIndex: 1 }}>
                <Group justify="space-between">
                  <IconCurrencyDollar size={28} style={{ color: '#27ae60' }} />
                </Group>
                <Title order={1} style={{ color: '#27ae60', fontSize: '2.5rem' }}>
                  ${Math.round(totalInvestment)}
                </Title>
                <Text size="sm" c="dimmed" fw={500} tt="uppercase">
                  Total Value
                </Text>
              </Stack>
            </Card>

            {/* Completion Rate */}
            <Card 
              padding="xl" 
              radius="md" 
              withBorder
              style={{ 
                borderColor: 'var(--color-beige)',
                background: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '100px',
                  height: '100px',
                  background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                  opacity: 0.1,
                  borderRadius: '50%',
                  transform: 'translate(25px, -25px)'
                }}
              />
              <Stack gap="xs" style={{ position: 'relative', zIndex: 1 }}>
                <Group justify="space-between">
                  <IconTrendingUp size={28} style={{ color: '#2980b9' }} />
                </Group>
                <Title order={1} style={{ color: '#2980b9', fontSize: '2.5rem' }}>
                  {Math.round(completionRate)}%
                </Title>
                <Text size="sm" c="dimmed" fw={500} tt="uppercase">
                  Enjoyed
                </Text>
              </Stack>
            </Card>
          </SimpleGrid>

          {/* Collection Breakdown */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {/* Collection Composition */}
            <Card padding="xl" radius="md" withBorder style={{ borderColor: 'var(--color-beige)', background: 'white' }}>
              <Title order={3} mb="lg" style={{ color: 'var(--color-burgundy)' }}>
                <Group gap="sm">
                  <IconChartBar size={24} />
                  <span>Collection Breakdown</span>
                </Group>
              </Title>
              <Stack gap="lg">
                <div>
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <IconGlassFull size={20} style={{ color: 'var(--color-wine)' }} />
                      <Text fw={500}>Wine</Text>
                    </Group>
                    <Text fw={600} style={{ color: 'var(--color-wine)' }}>
                      {wineBottles.length}
                    </Text>
                  </Group>
                  <Progress 
                    value={activeBottles > 0 ? (wineBottles.length / activeBottles) * 100 : 0} 
                    color="var(--color-wine)"
                    size="lg"
                    radius="xl"
                  />
                </div>
                
                <div>
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <IconBottle size={20} style={{ color: 'var(--color-amber)' }} />
                      <Text fw={500}>Spirits</Text>
                    </Group>
                    <Text fw={600} style={{ color: 'var(--color-amber)' }}>
                      {spiritBottles.length}
                    </Text>
                  </Group>
                  <Progress 
                    value={activeBottles > 0 ? (spiritBottles.length / activeBottles) * 100 : 0} 
                    color="var(--color-amber)"
                    size="lg"
                    radius="xl"
                  />
                </div>

                {averagePrice > 0 && (
                  <Box mt="md" p="md" style={{ background: 'var(--color-cream)', borderRadius: '8px' }}>
                    <Text size="sm" c="dimmed" mb={4}>Average Bottle Value</Text>
                    <Text size="xl" fw={700} style={{ color: 'var(--color-burgundy)' }}>
                      ${Math.round(averagePrice)}
                    </Text>
                  </Box>
                )}
              </Stack>
            </Card>

            {/* Recent Activity */}
            <Card padding="xl" radius="md" withBorder style={{ borderColor: 'var(--color-beige)', background: 'white' }}>
              <Title order={3} mb="lg" style={{ color: 'var(--color-burgundy)' }}>
                <Group gap="sm">
                  <IconFlame size={24} />
                  <span>Recent Activity</span>
                </Group>
              </Title>
              <Stack gap="lg">
                <Box>
                  <Group justify="space-between" mb="sm">
                    <Text size="sm" c="dimmed">Added (Last 30 Days)</Text>
                    <Badge size="xl" variant="light" color="green">
                      +{recentlyAdded}
                    </Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Finished (Last 30 Days)</Text>
                    <Badge size="xl" variant="light" color="orange">
                      {recentlyFinished}
                    </Badge>
                  </Group>
                </Box>

                <Box mt="md">
                  <Center>
                    <RingProgress
                      size={180}
                      thickness={16}
                      sections={[
                        { value: (activeBottles / totalBottles) * 100, color: 'var(--color-wine)' },
                        { value: (finishedBottles / totalBottles) * 100, color: 'var(--color-beige)' }
                      ]}
                      label={
                        <Center>
                          <Stack gap={0} align="center">
                            <Text size="xl" fw={700} style={{ color: 'var(--color-burgundy)' }}>
                              {activeBottles}
                            </Text>
                            <Text size="xs" c="dimmed">Active</Text>
                          </Stack>
                        </Center>
                      }
                    />
                  </Center>
                  <Text size="xs" c="dimmed" ta="center" mt="md">
                    {finishedBottles} bottles enjoyed so far
                  </Text>
                </Box>
              </Stack>
            </Card>
          </SimpleGrid>

          {/* Top Collections */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {/* Top Brands */}
            {topBrands.length > 0 && (
              <Card padding="xl" radius="md" withBorder style={{ borderColor: 'var(--color-beige)', background: 'white' }}>
                <Title order={3} mb="lg" style={{ color: 'var(--color-burgundy)' }}>
                  Top Brands
                </Title>
                <Stack gap="md">
                  {topBrands.map(([brand, count], index) => (
                    <Box key={brand}>
                      <Group justify="space-between" mb="xs">
                        <Group gap="sm">
                          <Badge size="lg" variant="filled" color="var(--color-wine)">
                            #{index + 1}
                          </Badge>
                          <Text fw={500}>{brand}</Text>
                        </Group>
                        <Text fw={600} size="lg" style={{ color: 'var(--color-burgundy)' }}>
                          {count}
                        </Text>
                      </Group>
                      <Progress 
                        value={(count / topBrands[0][1]) * 100} 
                        color="var(--color-burgundy)"
                        size="sm"
                        radius="xl"
                      />
                    </Box>
                  ))}
                </Stack>
              </Card>
            )}

            {/* Spirit Styles or Wine Styles */}
            {(topSpiritStyles.length > 0 || topWineStyles.length > 0) && (
              <Card padding="xl" radius="md" withBorder style={{ borderColor: 'var(--color-beige)', background: 'white' }}>
                <Title order={3} mb="lg" style={{ color: 'var(--color-burgundy)' }}>
                  {spiritBottles.length >= wineBottles.length ? 'Spirit Styles' : 'Wine Styles'}
                </Title>
                <Stack gap="md">
                  {(spiritBottles.length >= wineBottles.length ? topSpiritStyles : topWineStyles).map(([style, count], index) => (
                    <Box key={style}>
                      <Group justify="space-between" mb="xs">
                        <Text fw={500}>{style}</Text>
                        <Text fw={600} size="lg" style={{ color: 'var(--color-amber)' }}>
                          {count}
                        </Text>
                      </Group>
                      <Progress 
                        value={(count / (spiritBottles.length >= wineBottles.length ? topSpiritStyles : topWineStyles)[0][1]) * 100} 
                        color="var(--color-amber)"
                        size="sm"
                        radius="xl"
                      />
                    </Box>
                  ))}
                </Stack>
              </Card>
            )}
          </SimpleGrid>

          {/* Most Valuable Bottles */}
          {mostExpensive.length > 0 && (
            <Card padding="xl" radius="md" withBorder style={{ borderColor: 'var(--color-beige)', background: 'white' }}>
              <Group justify="space-between" mb="lg">
                <Title order={3} style={{ color: 'var(--color-burgundy)' }}>
                  <Group gap="sm">
                    <IconCurrencyDollar size={24} />
                    <span>Most Valuable Bottles</span>
                  </Group>
                </Title>
                <Link href="/bottles" style={{ textDecoration: 'none' }}>
                  <Button variant="subtle" size="sm" rightSection={<IconArrowRight size={16} />}>
                    View All
                  </Button>
                </Link>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                {mostExpensive.map((bottle) => (
                  <Link 
                    key={bottle.id} 
                    href={`/bottles/${bottle.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <Card
                      padding="lg"
                      radius="md"
                      withBorder
                      style={{ 
                        borderColor: 'var(--color-beige)',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        height: '100%'
                      }}
                    >
                      <Stack gap="sm">
                        <Badge size="lg" variant="light" color="green">
                          ${bottle.purchasePrice}
                        </Badge>
                        <Text fw={600} size="md" style={{ color: 'var(--color-burgundy)' }}>
                          {bottle.product.brand.name}
                        </Text>
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {bottle.product.name}
                        </Text>
                        {bottle.product.spiritData?.ageStatement && (
                          <Badge size="sm" variant="outline" color="var(--color-brown)">
                            {bottle.product.spiritData.ageStatement}
                          </Badge>
                        )}
                        {bottle.product.wineData?.vintage && (
                          <Badge size="sm" variant="outline" color="var(--color-brown)">
                            {bottle.product.wineData.vintage}
                          </Badge>
                        )}
                      </Stack>
                    </Card>
                  </Link>
                ))}
              </SimpleGrid>
            </Card>
          )}

          {/* Storage Overview */}
          {stashes.length > 0 && (
            <Card padding="xl" radius="md" withBorder style={{ borderColor: 'var(--color-beige)', background: 'white' }}>
              <Group justify="space-between" mb="lg">
                <Title order={3} style={{ color: 'var(--color-burgundy)' }}>
                  <Group gap="sm">
                    <IconMapPin size={24} />
                    <span>Storage Locations</span>
                  </Group>
                </Title>
                <Link href="/stashes" style={{ textDecoration: 'none' }}>
                  <Button variant="subtle" size="sm" rightSection={<IconArrowRight size={16} />}>
                    View All
                  </Button>
                </Link>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {stashes.map((stash) => {
                  const bottleCount = stash.shelves.reduce(
                    (sum, shelf) => sum + shelf._count.shelfItems,
                    0
                  )
                  return (
                    <Link 
                      key={stash.id} 
                      href={`/stashes/${stash.id}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <Card
                        padding="lg"
                        radius="md"
                        withBorder
                        style={{ 
                          borderColor: 'var(--color-beige)',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          height: '100%'
                        }}
                      >
                        <Stack gap="sm">
                          <Text fw={600} size="lg" style={{ color: 'var(--color-burgundy)' }}>
                            {stash.name}
                          </Text>
                          <Text size="sm" c="dimmed">{stash.location}</Text>
                          <Group gap="md" mt="xs">
                            <Box>
                              <Text size="xs" c="dimmed">Bottles</Text>
                              <Text fw={600} size="lg" style={{ color: 'var(--color-wine)' }}>
                                {bottleCount}
                              </Text>
                            </Box>
                            <Box>
                              <Text size="xs" c="dimmed">Shelves</Text>
                              <Text fw={600} size="lg" style={{ color: 'var(--color-amber)' }}>
                                {stash.shelves.length}
                              </Text>
                            </Box>
                          </Group>
                        </Stack>
                      </Card>
                    </Link>
                  )
                })}
              </SimpleGrid>
            </Card>
          )}
        </Stack>
      </Container>
    </Box>
  )
}

