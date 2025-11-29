import { Container, Title, Text, Button, Stack, Group, Box, SimpleGrid, Card } from '@mantine/core'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import Image from 'next/image'
import { IconBottle, IconTemperature } from '@tabler/icons-react'

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <Box style={{ minHeight: 'calc(100vh - 80px)' }}>
      {/* Hero Section */}
      <Box
        style={{
          background: 'var(--gradient-warm)',
          padding: '6rem 0 4rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container size="xl">
          <Stack gap="xl" align="center" style={{ position: 'relative', zIndex: 1 }}>
            <Title 
              order={1} 
              size="4rem" 
              ta="center"
              style={{ 
                color: 'var(--color-burgundy)',
                fontFamily: 'var(--font-playfair)',
                fontWeight: 700,
                lineHeight: 1.2
              }}
            >
              Welcome to Sippin
            </Title>
            <Text 
              size="xl" 
              ta="center"
              style={{ 
                color: 'var(--color-brown)',
                maxWidth: '600px',
                lineHeight: 1.6
              }}
            >
              Track and manage your wine and liquor collection with elegance and ease
            </Text>
            {session ? (
              <Stack gap="md" align="center" mt="xl">
                <Text size="lg" fw={500} style={{ color: 'var(--color-burgundy)' }}>
                  Welcome back, {session.user?.name || session.user?.email}!
                </Text>
                <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                  <Button 
                    size="lg" 
                    style={{ 
                      background: 'var(--gradient-wine)',
                      color: 'white',
                      padding: '0.75rem 2rem',
                      fontSize: '1.1rem'
                    }}
                  >
                    Go to Dashboard
                  </Button>
                </Link>
              </Stack>
            ) : (
              <Group gap="md" mt="xl">
                <Link href="/auth/signin" style={{ textDecoration: 'none' }}>
                  <Button 
                    size="lg"
                    variant="outline"
                    style={{ 
                      borderColor: 'var(--color-wine)',
                      color: 'var(--color-wine)',
                      padding: '0.75rem 2rem',
                      fontSize: '1.1rem'
                    }}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup" style={{ textDecoration: 'none' }}>
                  <Button 
                    size="lg"
                    style={{ 
                      background: 'var(--gradient-wine)',
                      color: 'white',
                      padding: '0.75rem 2rem',
                      fontSize: '1.1rem'
                    }}
                  >
                    Get Started
                  </Button>
                </Link>
              </Group>
            )}
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      {!session && (
        <Box style={{ padding: '4rem 0', background: 'white' }}>
          <Container size="xl">
            <Title order={2} ta="center" mb="xl" style={{ color: 'var(--color-burgundy)' }}>
              Organize Your Collection
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
              <Card 
                padding="xl" 
                radius="md" 
                withBorder
                style={{ 
                  borderColor: 'var(--color-beige)',
                  textAlign: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <IconBottle 
                  size={48} 
                  style={{ 
                    color: 'var(--color-wine)',
                    margin: '0 auto 1rem'
                  }} 
                />
                <Title order={4} mb="sm" style={{ color: 'var(--color-burgundy)' }}>
                  Track Bottles
                </Title>
                <Text c="dimmed">
                  Keep detailed records of every bottle in your collection
                </Text>
              </Card>

              <Card 
                padding="xl" 
                radius="md" 
                withBorder
                style={{ 
                  borderColor: 'var(--color-beige)',
                  textAlign: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <IconTemperature 
                  size={48} 
                  style={{ 
                    color: 'var(--color-wine)',
                    margin: '0 auto 1rem'
                  }} 
                />
                <Title order={4} mb="sm" style={{ color: 'var(--color-burgundy)' }}>
                  Organize Storage
                </Title>
                <Text c="dimmed">
                  Manage multiple stashes, shelves, and storage locations
                </Text>
              </Card>

              <Card 
                padding="xl" 
                radius="md" 
                withBorder
                style={{ 
                  borderColor: 'var(--color-beige)',
                  textAlign: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <IconBottle 
                  size={48} 
                  style={{ 
                    color: 'var(--color-wine)',
                    margin: '0 auto 1rem'
                  }} 
                />
                <Title order={4} mb="sm" style={{ color: 'var(--color-burgundy)' }}>
                  Wine & Spirits
                </Title>
                <Text c="dimmed">
                  Support for wine cellars, liquor cabinets, and more
                </Text>
              </Card>
            </SimpleGrid>
          </Container>
        </Box>
      )}
    </Box>
  )
}

