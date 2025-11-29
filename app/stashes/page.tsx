'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Container, Title, Text, SimpleGrid, Card, Group, Badge, Stack, Button, Box, Switch, Loader } from '@mantine/core'
import Link from 'next/link'
import { IconBottle, IconTemperature } from '@tabler/icons-react'

interface Stash {
  id: string
  name: string
  location: string
  type: string
  archived: boolean
  shelves: Array<{
    _count: {
      shelfItems: number
    }
  }>
  _count: {
    shelves: number
  }
}

export default function StashesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stashes, setStashes] = useState<Stash[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      fetchStashes()
    }
  }, [status, router, showArchived])

  const fetchStashes = async () => {
    try {
      setLoading(true)
      const url = showArchived 
        ? '/api/stashes?includeArchived=true'
        : '/api/stashes'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setStashes(data || [])
      } else {
        const errorText = await response.text()
        let error
        try {
          error = JSON.parse(errorText)
        } catch {
          error = { error: errorText || 'Unknown error', status: response.status }
        }
        console.error('Error fetching stashes:', error, 'Status:', response.status)
        if (response.status === 401) {
          router.push('/auth/signin')
        }
      }
    } catch (error) {
      console.error('Error fetching stashes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStashTypeColor = (type: string) => {
    switch (type) {
      case 'WINE_CELLAR':
        return 'red'
      case 'LIQUOR_CABINET':
        return 'orange'
      case 'FRIDGE':
      case 'REFRIGERATOR':
        return 'blue'
      case 'BAR':
        return 'violet'
      default:
        return 'gray'
    }
  }

  const getStashTypeLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
  }

  if (status === 'loading' || loading) {
    return (
      <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size="lg" color="wine" />
      </Box>
    )
  }

  const archivedStashes = stashes.filter(s => s.archived)
  const displayedStashes = stashes

  return (
    <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)' }}>
      <Container size="xl" py="xl">
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={1} style={{ color: 'var(--color-burgundy)' }}>My Stashes</Title>
            <Text mt="xs" style={{ color: 'var(--color-brown)' }}>
              Manage your beverage storage locations
            </Text>
          </div>
          {archivedStashes.length > 0 && (
            <Switch
              label="Show archived"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.currentTarget.checked)}
              styles={{
                label: {
                  color: 'var(--color-brown)',
                },
              }}
            />
          )}
        </Group>

        {displayedStashes.length === 0 ? (
          <Card 
            p="xl" 
            withBorder 
            style={{ 
              borderColor: 'var(--color-beige)',
              background: 'white',
              textAlign: 'center'
            }}
          >
            <Text ta="center" c="dimmed" size="lg">
              {showArchived 
                ? 'No archived stashes.'
                : 'No stashes yet. Create your first stash to get started!'}
            </Text>
          </Card>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {displayedStashes.map((stash: Stash) => {
              const totalBottles = stash.shelves.reduce(
                (sum: number, shelf: typeof stash.shelves[0]) => sum + shelf._count.shelfItems,
                0
              )

              return (
                <Link key={stash.id} href={`/stashes/${stash.id}`} style={{ textDecoration: 'none', height: '100%', display: 'block' }}>
                  <Card
                    shadow="md"
                    padding="xl"
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
                    <Stack gap="md">
                      <Group justify="space-between" align="flex-start">
                        <div style={{ flex: 1 }}>
                          <Group gap="xs" align="center" mb={4}>
                            <Title order={3} style={{ color: 'var(--color-burgundy)' }}>
                              {stash.name}
                            </Title>
                            {stash.archived && (
                              <Badge color="gray" variant="light" size="sm">
                                Archived
                              </Badge>
                            )}
                          </Group>
                          <Text size="sm" c="dimmed">
                            {stash.location}
                          </Text>
                        </div>
                        <Badge 
                          color={getStashTypeColor(stash.type)}
                          size="lg"
                          style={{ 
                            fontWeight: 600,
                            textTransform: 'capitalize'
                          }}
                        >
                          {getStashTypeLabel(stash.type)}
                        </Badge>
                      </Group>

                      <Group gap="lg" mt="md">
                        <Group gap={6}>
                          <IconBottle size={20} style={{ color: 'var(--color-wine)' }} />
                          <div>
                            <Text size="xs" c="dimmed">Shelves</Text>
                            <Text size="sm" fw={600}>
                              {stash._count.shelves}
                            </Text>
                          </div>
                        </Group>
                        <Group gap={6}>
                          <IconBottle size={20} style={{ color: 'var(--color-wine)' }} />
                          <div>
                            <Text size="xs" c="dimmed">Bottles</Text>
                            <Text size="sm" fw={600}>
                              {totalBottles}
                            </Text>
                          </div>
                        </Group>
                      </Group>
                    </Stack>
                  </Card>
                </Link>
              )
            })}
          </SimpleGrid>
        )}
      </Container>
    </Box>
  )
}

