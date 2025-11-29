import { Container, Title, Text, Button, Group, Card, Stack, SimpleGrid, Box, Badge } from '@mantine/core'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { IconBottle, IconArrowRight, IconTemperature } from '@tabler/icons-react'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const [stashCount, bottleCount, recentStashes] = await Promise.all([
    prisma.stash.count({
      where: { userId: session.user.id }
    }),
    prisma.bottle.count({
      where: { userId: session.user.id }
    }),
    prisma.stash.findMany({
      where: { userId: session.user.id },
      take: 3,
      orderBy: { createdAt: 'desc' },
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
  ])

  return (
    <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)' }}>
      <Container size="xl" py="xl">
        <Stack gap="xl">
          {/* Welcome Header */}
          <Box>
            <Title order={1} mb="xs" style={{ color: 'var(--color-burgundy)' }}>
              Dashboard
            </Title>
            <Text size="lg" style={{ color: 'var(--color-brown)' }}>
              Welcome back, {session.user?.name || session.user?.email}!
            </Text>
          </Box>

          {/* Stats Cards */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
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
                  width: '120px',
                  height: '120px',
                  background: 'var(--gradient-wine)',
                  opacity: 0.1,
                  borderRadius: '50%',
                  transform: 'translate(30px, -30px)'
                }}
              />
              <Stack gap="sm" style={{ position: 'relative', zIndex: 1 }}>
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text size="sm" c="dimmed" fw={500} tt="uppercase" style={{ letterSpacing: '0.5px' }}>
                      Total Stashes
                    </Text>
                    <Title order={1} mt="xs" style={{ color: 'var(--color-burgundy)', fontSize: '3rem' }}>
                      {stashCount}
                    </Title>
                  </div>
                  <Box
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      background: 'var(--gradient-wine)',
                      color: 'white'
                    }}
                  >
                    <IconBottle size={32} />
                  </Box>
                </Group>
              </Stack>
            </Card>

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
                  width: '120px',
                  height: '120px',
                  background: 'var(--gradient-amber)',
                  opacity: 0.1,
                  borderRadius: '50%',
                  transform: 'translate(30px, -30px)'
                }}
              />
              <Stack gap="sm" style={{ position: 'relative', zIndex: 1 }}>
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text size="sm" c="dimmed" fw={500} tt="uppercase" style={{ letterSpacing: '0.5px' }}>
                      Total Bottles
                    </Text>
                    <Title order={1} mt="xs" style={{ color: 'var(--color-burgundy)', fontSize: '3rem' }}>
                      {bottleCount}
                    </Title>
                  </div>
                  <Box
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      background: 'var(--gradient-amber)',
                      color: 'var(--color-brown)'
                    }}
                  >
                    <IconBottle size={32} />
                  </Box>
                </Group>
              </Stack>
            </Card>
          </SimpleGrid>

          {/* Quick Actions */}
          <Card padding="xl" radius="md" withBorder style={{ borderColor: 'var(--color-beige)', background: 'white' }}>
            <Title order={3} mb="md" style={{ color: 'var(--color-burgundy)' }}>
              Quick Actions
            </Title>
            <Group gap="md">
              <Link href="/bottles" style={{ textDecoration: 'none', flex: 1 }}>
                <Button 
                  size="lg" 
                  fullWidth
                  rightSection={<IconArrowRight size={18} />}
                  style={{ 
                    background: 'var(--gradient-wine)',
                    color: 'white'
                  }}
                >
                  View My Bottles
                </Button>
              </Link>
              <Link href="/stashes" style={{ textDecoration: 'none', flex: 1 }}>
                <Button 
                  size="lg" 
                  fullWidth
                  variant="outline"
                  rightSection={<IconArrowRight size={18} />}
                  style={{ 
                    borderColor: 'var(--color-wine)',
                    color: 'var(--color-wine)'
                  }}
                >
                  View My Stashes
                </Button>
              </Link>
            </Group>
          </Card>

          {/* Recent Stashes */}
          {recentStashes.length > 0 && (
            <Card padding="xl" radius="md" withBorder style={{ borderColor: 'var(--color-beige)', background: 'white' }}>
              <Group justify="space-between" mb="md">
                <Title order={3} style={{ color: 'var(--color-burgundy)' }}>
                  Recent Stashes
                </Title>
                <Link href="/stashes" style={{ textDecoration: 'none' }}>
                  <Button variant="subtle" size="sm" rightSection={<IconArrowRight size={16} />}>
                    View All
                  </Button>
                </Link>
              </Group>
              <Stack gap="md">
                {recentStashes.map((stash: typeof recentStashes[0]) => {
                  const totalBottles = stash.shelves.reduce(
                    (sum: number, shelf: typeof stash.shelves[0]) => sum + shelf._count.shelfItems,
                    0
                  )
                  return (
                    <Link 
                      key={stash.id} 
                      href={`/stashes/${stash.id}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <Card
                        padding="md"
                        radius="md"
                        withBorder
                        style={{ 
                          borderColor: 'var(--color-beige)',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                      >
                        <Group justify="space-between">
                          <div style={{ flex: 1 }}>
                            <Text fw={600} size="lg" mb={4} style={{ color: 'var(--color-burgundy)' }}>
                              {stash.name}
                            </Text>
                            <Text size="sm" c="dimmed">
                              {stash.location}
                            </Text>
                          </div>
                          <Group gap="lg">
                            <div>
                              <Text size="xs" c="dimmed">Shelves</Text>
                              <Text fw={600}>{stash.shelves.length}</Text>
                            </div>
                            <div>
                              <Text size="xs" c="dimmed">Bottles</Text>
                              <Text fw={600}>{totalBottles}</Text>
                            </div>
                          </Group>
                        </Group>
                      </Card>
                    </Link>
                  )
                })}
              </Stack>
            </Card>
          )}
        </Stack>
      </Container>
    </Box>
  )
}

