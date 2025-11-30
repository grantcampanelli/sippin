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
  Menu,
  Loader,
  Modal,
  Radio,
  Alert
} from '@mantine/core'
import Link from 'next/link'
import { IconBottle, IconTemperature, IconArrowLeft, IconArchive, IconArchiveOff, IconDots, IconTrash, IconAlertCircle, IconEdit, IconPlus } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { AddBottlesModal } from '@/components/stashes/AddBottlesModal'

interface Shelf {
  id: string
  name: string
  order: number | null
  temp: number | null
  capacity: number | null
  _count: {
    shelfItems: number
  }
}

interface Stash {
  id: string
  name: string
  location: string
  type: string
  description: string | null
  archived: boolean
  shelves: Shelf[]
}

export default function StashDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [stash, setStash] = useState<Stash | null>(null)
  const [loading, setLoading] = useState(true)
  const [archiveModalOpen, setArchiveModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [removeItems, setRemoveItems] = useState<'keep' | 'remove'>('keep')
  const [processing, setProcessing] = useState(false)
  const [addBottlesModalOpen, setAddBottlesModalOpen] = useState(false)
  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && id) {
      fetchStash()
    }
  }, [status, router, id])

  const fetchStash = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/stashes/${id}`)
      if (response.ok) {
        const data = await response.json()
        setStash(data)
      } else if (response.status === 404) {
        router.push('/stashes')
      }
    } catch (error) {
      console.error('Error fetching stash:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async (archived: boolean) => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/stashes/${id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          archived,
          removeItems: removeItems === 'remove'
        }),
      })
      if (response.ok) {
        const updatedStash = await response.json()
        setStash(updatedStash)
        setArchiveModalOpen(false)
        setRemoveItems('keep')
        notifications.show({
          title: archived ? 'Stash archived' : 'Stash unarchived',
          message: `${stash?.name} has been ${archived ? 'archived' : 'unarchived'}`,
          color: 'green',
        })
        if (archived) {
          // Redirect to stashes page after archiving
          setTimeout(() => {
            router.push('/stashes')
          }, 1000)
        }
      } else {
        notifications.show({
          title: 'Error',
          message: 'Failed to update stash',
          color: 'red',
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update stash',
        color: 'red',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async () => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/stashes/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          removeItems: removeItems === 'remove'
        }),
      })
      if (response.ok) {
        setDeleteModalOpen(false)
        setRemoveItems('keep')
        notifications.show({
          title: 'Stash deleted',
          message: `${stash?.name} has been deleted`,
          color: 'green',
        })
        router.push('/stashes')
      } else {
        const error = await response.json()
        notifications.show({
          title: 'Error',
          message: error.error || 'Failed to delete stash',
          color: 'red',
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete stash',
        color: 'red',
      })
    } finally {
      setProcessing(false)
    }
  }

  if (status === 'loading' || loading || !stash) {
    return (
      <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size="lg" color="wine" />
      </Box>
    )
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

  const totalBottles = stash.shelves.reduce(
    (sum: number, shelf: typeof stash.shelves[0]) => sum + shelf._count.shelfItems,
    0
  )

  return (
    <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)' }}>
      <Container size="xl" py="xl">
        <Group mb="xl">
          <Link href="/stashes" style={{ textDecoration: 'none' }}>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              style={{ color: 'var(--color-wine)' }}
            >
              Back to Stashes
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
              <div style={{ flex: 1 }}>
                <Group gap="xs" align="center" mb={4}>
                  <Title order={1} style={{ color: 'var(--color-burgundy)' }}>
                    {stash.name}
                  </Title>
                  {stash.archived && (
                    <Badge color="gray" variant="light">
                      Archived
                    </Badge>
                  )}
                </Group>
                <Text c="dimmed" mt="xs" size="lg">
                  {stash.location}
                </Text>
              </div>
              <Group gap="sm">
                <Badge 
                  size="lg" 
                  color={getStashTypeColor(stash.type)}
                  style={{ fontWeight: 600 }}
                >
                  {getStashTypeLabel(stash.type)}
                </Badge>
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <Button variant="subtle" size="sm">
                      <IconDots size={18} />
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {!stash.archived && (
                      <>
                        <Link href={`/stashes/${id}/edit`} style={{ textDecoration: 'none' }}>
                          <Menu.Item
                            leftSection={<IconEdit size={16} />}
                          >
                            Edit Stash
                          </Menu.Item>
                        </Link>
                        <Menu.Divider />
                      </>
                    )}
                    {stash.archived ? (
                      <Menu.Item
                        leftSection={<IconArchiveOff size={16} />}
                        onClick={() => {
                          setRemoveItems('keep')
                          handleArchive(false)
                        }}
                      >
                        Unarchive Stash
                      </Menu.Item>
                    ) : (
                      <>
                        <Menu.Item
                          leftSection={<IconArchive size={16} />}
                          onClick={() => setArchiveModalOpen(true)}
                        >
                          Archive Stash
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          leftSection={<IconTrash size={16} />}
                          color="red"
                          onClick={() => setDeleteModalOpen(true)}
                        >
                          Delete Stash
                        </Menu.Item>
                      </>
                    )}
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Group>

            {stash.description && (
              <Text mb="md" style={{ color: 'var(--color-brown)' }}>
                {stash.description}
              </Text>
            )}

            <Group gap="xl" mt="md">
              <Group gap={6}>
                <IconBottle size={24} style={{ color: 'var(--color-wine)' }} />
                <div>
                  <Text size="xs" c="dimmed">Shelves</Text>
                  <Text size="lg" fw={600} style={{ color: 'var(--color-burgundy)' }}>
                    {stash.shelves.length}
                  </Text>
                </div>
              </Group>
              <Group gap={6}>
                <IconBottle size={24} style={{ color: 'var(--color-wine)' }} />
                <div>
                  <Text size="xs" c="dimmed">Bottles</Text>
                  <Text size="lg" fw={600} style={{ color: 'var(--color-burgundy)' }}>
                    {totalBottles}
                  </Text>
                </div>
              </Group>
            </Group>
          </Card>

          <div>
            <Group justify="space-between" mb="md">
              <Title order={2} style={{ color: 'var(--color-burgundy)' }}>
                Shelves
              </Title>
              {stash.shelves.length > 0 && !stash.archived && (
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => {
                    setSelectedShelfId(null)
                    setAddBottlesModalOpen(true)
                  }}
                  style={{ background: 'var(--color-wine)' }}
                >
                  Add Bottles
                </Button>
              )}
            </Group>
            
            {stash.shelves.length === 0 ? (
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
                  No shelves in this stash yet.
                </Text>
              </Card>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                {stash.shelves.map((shelf: typeof stash.shelves[0]) => (
                  <Card
                    key={shelf.id}
                    shadow="md"
                    padding="lg"
                    radius="md"
                    withBorder
                    style={{ 
                      height: '100%',
                      borderColor: 'var(--color-beige)',
                      background: 'white',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Stack gap="md">
                      <Group justify="space-between" align="flex-start">
                        <Link href={`/shelves/${shelf.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                          <Title order={4} style={{ color: 'var(--color-burgundy)' }}>
                            {shelf.name}
                          </Title>
                        </Link>
                        {shelf.order !== null && (
                          <Badge variant="light" size="sm" color="wine">
                            #{shelf.order}
                          </Badge>
                        )}
                      </Group>

                      <Group gap="md">
                        {shelf.temp !== null && (
                          <Group gap={4}>
                            <IconTemperature size={16} style={{ color: 'var(--color-wine)' }} />
                            <Text size="sm">{shelf.temp}°C</Text>
                          </Group>
                        )}
                        {shelf.capacity !== null && (
                          <Text size="sm" c="dimmed">
                            {shelf._count.shelfItems} / {shelf.capacity}
                          </Text>
                        )}
                      </Group>

                      <Group justify="space-between" align="center">
                        <Text size="sm" fw={500} style={{ color: 'var(--color-burgundy)' }}>
                          {shelf._count.shelfItems} {shelf._count.shelfItems === 1 ? 'bottle' : 'bottles'}
                        </Text>
                        {!stash.archived && (
                          <Button
                            size="xs"
                            variant="light"
                            leftSection={<IconPlus size={14} />}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setSelectedShelfId(shelf.id)
                              setAddBottlesModalOpen(true)
                            }}
                          >
                            Add
                          </Button>
                        )}
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </div>
        </Stack>
      </Container>

      {/* Archive Confirmation Modal */}
      <Modal
        opened={archiveModalOpen}
        onClose={() => {
          setArchiveModalOpen(false)
          setRemoveItems('keep')
        }}
        title="Archive Stash"
        centered
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to archive <strong>{stash.name}</strong>?
          </Text>
          
          {totalBottles > 0 && (
            <>
              <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
                This stash contains {totalBottles} {totalBottles === 1 ? 'bottle' : 'bottles'} across {stash.shelves.length} {stash.shelves.length === 1 ? 'shelf' : 'shelves'}.
              </Alert>
              
              <Radio.Group
                label="What would you like to do with the bottles?"
                value={removeItems}
                onChange={(value) => setRemoveItems(value as 'keep' | 'remove')}
              >
                <Stack gap="xs" mt="xs">
                  <Radio 
                    value="keep" 
                    label="Keep bottles on shelves (they will remain associated with this archived stash)"
                  />
                  <Radio 
                    value="remove" 
                    label="Remove all bottles from shelves (bottles will remain in your inventory but not on any shelf)"
                  />
                </Stack>
              </Radio.Group>
            </>
          )}

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => {
                setArchiveModalOpen(false)
                setRemoveItems('keep')
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleArchive(true)}
              disabled={processing}
              style={{ background: 'var(--color-wine)' }}
            >
              {processing ? 'Archiving...' : 'Archive Stash'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setRemoveItems('keep')
        }}
        title="Delete Stash"
        centered
      >
        <Stack gap="md">
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            This action cannot be undone. The stash will be permanently deleted.
          </Alert>
          
          <Text>
            Are you sure you want to delete <strong>{stash.name}</strong>?
          </Text>
          
          {totalBottles > 0 && (
            <>
              <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
                This stash contains {totalBottles} {totalBottles === 1 ? 'bottle' : 'bottles'} across {stash.shelves.length} {stash.shelves.length === 1 ? 'shelf' : 'shelves'}.
              </Alert>
              
              <Radio.Group
                label="What would you like to do with the bottles?"
                value={removeItems}
                onChange={(value) => setRemoveItems(value as 'keep' | 'remove')}
              >
                <Stack gap="xs" mt="xs">
                  <Radio 
                    value="keep" 
                    label="Keep bottles on shelves (shelves and bottles will be deleted with the stash)"
                  />
                  <Radio 
                    value="remove" 
                    label="Remove all bottles from shelves before deleting (bottles will remain in your inventory)"
                  />
                </Stack>
              </Radio.Group>
            </>
          )}

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => {
                setDeleteModalOpen(false)
                setRemoveItems('keep')
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDelete}
              disabled={processing}
            >
              {processing ? 'Deleting...' : 'Delete Stash'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Add Bottles Modal */}
      <AddBottlesModal
        opened={addBottlesModalOpen}
        onClose={() => {
          setAddBottlesModalOpen(false)
          setSelectedShelfId(null)
        }}
        onSuccess={() => {
          fetchStash()
        }}
        preselectedStashId={id}
        preselectedShelfId={selectedShelfId || undefined}
      />
    </Box>
  )
}

