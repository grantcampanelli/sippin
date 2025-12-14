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
  Alert,
  Collapse,
  Progress
} from '@mantine/core'
import Link from 'next/link'
import { IconBottle, IconTemperature, IconArrowLeft, IconArchive, IconArchiveOff, IconDots, IconTrash, IconAlertCircle, IconEdit, IconPlus, IconChevronDown, IconChevronUp, IconCurrencyDollar, IconListCheck, IconProgress } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { AddBottlesModal } from '@/components/stashes/AddBottlesModal'

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
    ageStatement: string | null
    region: string | null
  } | null
}

interface Bottle {
  id: string
  finished: boolean
  amountRemaining: number | null
  purchasePrice: number | null
  openDate: string | null
  product: Product
}

interface ShelfItem {
  id: string
  order: number
  bottle: Bottle
}

interface Shelf {
  id: string
  name: string
  order: number | null
  temp: number | null
  capacity: number | null
  shelfItems: ShelfItem[]
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
  const [expandedShelves, setExpandedShelves] = useState<Record<string, boolean>>({})

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

  // Helper Functions
  const calculateStashStats = (stash: Stash) => {
    const totalBottles = stash.shelves.reduce(
      (sum, shelf) => sum + shelf._count.shelfItems,
      0
    )
    
    const totalCapacity = stash.shelves.reduce(
      (sum, shelf) => sum + (shelf.capacity || 0),
      0
    )
    
    const hasCapacity = stash.shelves.some(shelf => shelf.capacity !== null)
    
    const totalValue = stash.shelves.reduce((sum, shelf) => {
      return sum + shelf.shelfItems.reduce((shelfSum, item) => {
        return shelfSum + (item.bottle.purchasePrice || 0)
      }, 0)
    }, 0)
    
    const openBottles = stash.shelves.reduce((sum, shelf) => {
      return sum + shelf.shelfItems.filter(item => item.bottle.openDate !== null).length
    }, 0)
    
    const temps = stash.shelves
      .map(shelf => shelf.temp)
      .filter((temp): temp is number => temp !== null)
    
    const tempRange = temps.length > 0 
      ? { min: Math.min(...temps), max: Math.max(...temps) }
      : null
    
    return {
      totalBottles,
      totalCapacity,
      hasCapacity,
      capacityPercentage: hasCapacity && totalCapacity > 0 
        ? Math.round((totalBottles / totalCapacity) * 100) 
        : null,
      totalValue,
      openBottles,
      tempRange
    }
  }

  const getProductDisplayName = (product: Product) => {
    if (product.brand.type === 'WINE' && product.wineData) {
      const vintage = product.wineData.vintage ? `${product.wineData.vintage} ` : ''
      return `${vintage}${product.name}`
    }
    if (product.brand.type === 'SPIRIT' && product.spiritData?.ageStatement) {
      return `${product.name} ${product.spiritData.ageStatement}`
    }
    return product.name
  }

  const getProductSubtitle = (product: Product) => {
    const parts = []
    if (product.brand.name) parts.push(product.brand.name)
    if (product.wineData?.varietal) parts.push(product.wineData.varietal)
    if (product.wineData?.region) parts.push(product.wineData.region)
    if (product.spiritData?.region) parts.push(product.spiritData.region)
    return parts.join(' • ')
  }

  const getShelfPreview = (shelf: Shelf) => {
    if (shelf.shelfItems.length === 0) return ''
    const previewCount = 2
    const preview = shelf.shelfItems
      .slice(0, previewCount)
      .map(item => getProductDisplayName(item.bottle.product))
      .join(', ')
    
    if (shelf.shelfItems.length > previewCount) {
      return `${preview}...`
    }
    return preview
  }

  const toggleShelf = (shelfId: string) => {
    setExpandedShelves(prev => ({
      ...prev,
      [shelfId]: !prev[shelfId]
    }))
  }

  const totalBottles = stash.shelves.reduce(
    (sum: number, shelf: typeof stash.shelves[0]) => sum + shelf._count.shelfItems,
    0
  )

  const stats = calculateStashStats(stash)
  
  // Determine if this is a "simple" stash (single default shelf)
  const isSimpleStash = stash.shelves.length === 1 && 
    (stash.shelves[0].name === 'Default Shelf' || stash.shelves[0].name === 'Main Shelf')

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

          </Card>

          {/* Stats Section */}
          {totalBottles > 0 && (
            <SimpleGrid cols={{ base: 2, sm: 2, md: 4 }} spacing="md">
              {/* Total Bottles */}
              <Card 
                padding="md" 
                radius="md" 
                withBorder
                style={{ 
                  borderColor: 'var(--color-beige)',
                  background: 'white'
                }}
              >
                <Group gap="xs" mb="xs">
                  <IconBottle size={20} style={{ color: 'var(--color-wine)' }} />
                  <Text size="xs" c="dimmed" fw={500}>Total Bottles</Text>
                </Group>
                <Text size="xl" fw={700} style={{ color: 'var(--color-burgundy)' }}>
                  {stats.totalBottles}
                </Text>
              </Card>

              {/* Capacity */}
              {stats.hasCapacity && (
                <Card 
                  padding="md" 
                  radius="md" 
                  withBorder
                  style={{ 
                    borderColor: 'var(--color-beige)',
                    background: 'white'
                  }}
                >
                  <Group gap="xs" mb="xs">
                    <IconProgress size={20} style={{ color: 'var(--color-wine)' }} />
                    <Text size="xs" c="dimmed" fw={500}>Capacity</Text>
                  </Group>
                  <Text size="xl" fw={700} style={{ color: 'var(--color-burgundy)' }} mb="xs">
                    {stats.totalBottles} / {stats.totalCapacity}
                  </Text>
                  <Progress 
                    value={stats.capacityPercentage || 0} 
                    size="sm" 
                    color="wine"
                    style={{ backgroundColor: 'var(--color-beige)' }}
                  />
                  <Text size="xs" c="dimmed" mt={4}>
                    {stats.capacityPercentage}% full
                  </Text>
                </Card>
              )}

              {/* Shelves - Only show for multi-shelf stashes */}
              {!isSimpleStash && (
                <Card 
                  padding="md" 
                  radius="md" 
                  withBorder
                  style={{ 
                    borderColor: 'var(--color-beige)',
                    background: 'white'
                  }}
                >
                  <Group gap="xs" mb="xs">
                    <IconListCheck size={20} style={{ color: 'var(--color-wine)' }} />
                    <Text size="xs" c="dimmed" fw={500}>Shelves</Text>
                  </Group>
                  <Text size="xl" fw={700} style={{ color: 'var(--color-burgundy)' }}>
                    {stash.shelves.length}
                  </Text>
                  {stats.tempRange && (
                    <Text size="xs" c="dimmed" mt="xs">
                      {stats.tempRange.min === stats.tempRange.max 
                        ? `${stats.tempRange.min}°C`
                        : `${stats.tempRange.min}-${stats.tempRange.max}°C`}
                    </Text>
                  )}
                </Card>
              )}

              {/* Value or Open Bottles */}
              {stats.totalValue > 0 ? (
                <Card 
                  padding="md" 
                  radius="md" 
                  withBorder
                  style={{ 
                    borderColor: 'var(--color-beige)',
                    background: 'white'
                  }}
                >
                  <Group gap="xs" mb="xs">
                    <IconCurrencyDollar size={20} style={{ color: 'var(--color-wine)' }} />
                    <Text size="xs" c="dimmed" fw={500}>Total Value</Text>
                  </Group>
                  <Text size="xl" fw={700} style={{ color: 'var(--color-burgundy)' }}>
                    ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Text>
                  {stats.openBottles > 0 && (
                    <Text size="xs" c="dimmed" mt="xs">
                      {stats.openBottles} open
                    </Text>
                  )}
                </Card>
              ) : stats.openBottles > 0 ? (
                <Card 
                  padding="md" 
                  radius="md" 
                  withBorder
                  style={{ 
                    borderColor: 'var(--color-beige)',
                    background: 'white'
                  }}
                >
                  <Group gap="xs" mb="xs">
                    <IconBottle size={20} style={{ color: 'var(--color-wine)' }} />
                    <Text size="xs" c="dimmed" fw={500}>Open Bottles</Text>
                  </Group>
                  <Text size="xl" fw={700} style={{ color: 'var(--color-burgundy)' }}>
                    {stats.openBottles}
                  </Text>
                </Card>
              ) : null}
            </SimpleGrid>
          )}

          <div>
            <Group justify="space-between" mb="md">
              <Title order={2} style={{ color: 'var(--color-burgundy)' }}>
                {isSimpleStash ? 'Bottles' : 'Shelves'}
              </Title>
              {stash.shelves.length > 0 && !stash.archived && (
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => {
                    setSelectedShelfId(isSimpleStash ? stash.shelves[0].id : null)
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
                <Stack gap="lg" align="center">
                  <Text ta="center" c="dimmed" size="lg">
                    No shelves in this stash yet.
                  </Text>
                  {!stash.archived && (
                    <>
                      <Text size="sm" c="dimmed" ta="center" style={{ maxWidth: '400px' }}>
                        Start adding bottles to your stash.
                      </Text>
                      <Group gap="md">
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
                      </Group>
                    </>
                  )}
                </Stack>
              </Card>
            ) : totalBottles === 0 ? (
              <Card 
                p="xl" 
                withBorder
                style={{ 
                  borderColor: 'var(--color-beige)',
                  background: 'white',
                  textAlign: 'center'
                }}
              >
                <Stack gap="xl" align="center">
                  <Box>
                    <Title order={3} ta="center" mb="md" style={{ color: 'var(--color-burgundy)' }}>
                      Ready to Add Bottles? 🍷
                    </Title>
                    <Text size="lg" c="dimmed" ta="center" mb="xl" style={{ maxWidth: '500px', margin: '0 auto' }}>
                      Your storage is set up! Now add bottles to start organizing your collection.
                    </Text>
                  </Box>
                  {!stash.archived && (
                    <Button
                      leftSection={<IconPlus size={18} />}
                      onClick={() => {
                        setSelectedShelfId(null)
                        setAddBottlesModalOpen(true)
                      }}
                      size="lg"
                      style={{ background: 'var(--color-wine)' }}
                    >
                      Add Your First Bottle
                    </Button>
                  )}
                  <Box mt="lg">
                    <Text size="sm" c="dimmed" ta="center" mb="xs">
                      💡 Don't have bottles in your inventory yet?
                    </Text>
                    <Link href="/bottles" style={{ textDecoration: 'none' }}>
                      <Button variant="subtle" size="sm" style={{ color: 'var(--color-wine)' }}>
                        Go to Bottles Page
                      </Button>
                    </Link>
                  </Box>
                </Stack>
              </Card>
            ) : (
              <Stack gap="lg">
                {stash.shelves.map((shelf: typeof stash.shelves[0]) => {
                  const isExpanded = expandedShelves[shelf.id] !== false // Default to expanded
                  const hasMany = shelf.shelfItems.length > 8
                  
                  return (
                    <Card
                      key={shelf.id}
                      padding="lg"
                      radius="md"
                      withBorder
                      style={{ 
                        borderColor: 'var(--color-beige)',
                        background: 'white',
                      }}
                    >
                      {/* Shelf Header - Hide for simple stashes */}
                      {!isSimpleStash && (
                        <Group justify="space-between" align="center" mb="md">
                          <Group gap="md" style={{ flex: 1 }}>
                            <div>
                              <Group gap="xs" align="center" mb={4}>
                                <Title order={3} style={{ color: 'var(--color-burgundy)' }}>
                                  {shelf.name}
                                </Title>
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
                                    <Text size="sm" c="dimmed">{shelf.temp}°C</Text>
                                  </Group>
                                )}
                                {shelf.capacity !== null ? (
                                  <Group gap={6}>
                                    <Text size="sm" fw={500} style={{ color: 'var(--color-burgundy)' }}>
                                      {shelf._count.shelfItems} / {shelf.capacity}
                                    </Text>
                                    <Text size="sm" c="dimmed">bottles</Text>
                                    {shelf.capacity > 0 && (
                                      <Progress 
                                        value={(shelf._count.shelfItems / shelf.capacity) * 100} 
                                        size="sm" 
                                        color="wine"
                                        style={{ width: '100px' }}
                                      />
                                    )}
                                  </Group>
                                ) : (
                                  <Text size="sm" c="dimmed">
                                    {shelf._count.shelfItems} {shelf._count.shelfItems === 1 ? 'bottle' : 'bottles'}
                                  </Text>
                                )}
                              </Group>
                            </div>
                          </Group>

                          <Group gap="xs">
                            {!stash.archived && (
                              <Button
                                size="sm"
                                variant="light"
                                leftSection={<IconPlus size={16} />}
                                onClick={() => {
                                  setSelectedShelfId(shelf.id)
                                  setAddBottlesModalOpen(true)
                                }}
                                style={{ color: 'var(--color-wine)' }}
                              >
                                Add
                              </Button>
                            )}
                            {hasMany && shelf._count.shelfItems > 0 && (
                              <Button
                                variant="subtle"
                                size="sm"
                                onClick={() => toggleShelf(shelf.id)}
                                style={{ color: 'var(--color-wine)' }}
                                px="sm"
                              >
                                {isExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                              </Button>
                            )}
                          </Group>
                        </Group>
                      )}

                      {/* Bottles List/Table */}
                      {shelf.shelfItems.length > 0 && (
                        <Collapse in={isExpanded || !hasMany}>
                          <Box 
                            style={{
                              border: '1px solid var(--color-beige)',
                              borderRadius: '8px',
                              overflow: 'hidden'
                            }}
                          >
                            {/* Table Header */}
                            <Group 
                              gap="md" 
                              p="sm"
                              style={{ 
                                background: 'var(--color-cream)',
                                borderBottom: '1px solid var(--color-beige)'
                              }}
                            >
                              <Text size="xs" fw={600} c="dimmed" style={{ flex: 1, minWidth: 0 }}>
                                BOTTLE
                              </Text>
                              <Text size="xs" fw={600} c="dimmed" visibleFrom="sm" style={{ width: '200px' }}>
                                DETAILS
                              </Text>
                              {shelf.shelfItems.some(item => item.bottle.product.brand.type !== 'WINE' && item.bottle.amountRemaining !== null) && (
                                <Text size="xs" fw={600} c="dimmed" style={{ width: '100px', textAlign: 'center' }}>
                                  REMAINING
                                </Text>
                              )}
                              <Text size="xs" fw={600} c="dimmed" visibleFrom="md" style={{ width: '80px', textAlign: 'right' }}>
                                PRICE
                              </Text>
                            </Group>

                            {/* Bottle Rows */}
                            <Stack gap={0}>
                              {shelf.shelfItems.map((item, index) => {
                                const bottle = item.bottle
                                const product = bottle.product
                                
                                return (
                                  <Link 
                                    key={item.id} 
                                    href={`/bottles/${bottle.id}`} 
                                    style={{ textDecoration: 'none' }}
                                  >
                                    <Group
                                      gap="md"
                                      p="sm"
                                      style={{
                                        borderTop: index > 0 ? '1px solid var(--color-beige)' : 'none',
                                        background: 'white',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer'
                                      }}
                                      onMouseOver={(e) => {
                                        e.currentTarget.style.background = 'var(--color-cream)'
                                      }}
                                      onMouseOut={(e) => {
                                        e.currentTarget.style.background = 'white'
                                      }}
                                    >
                                      {/* Bottle Name */}
                                      <Box style={{ flex: 1, minWidth: 0 }}>
                                        <Text size="sm" fw={600} style={{ color: 'var(--color-burgundy)' }} lineClamp={1}>
                                          {getProductDisplayName(product)}
                                        </Text>
                                        <Text size="xs" c="dimmed" lineClamp={1} hiddenFrom="sm">
                                          {getProductSubtitle(product)}
                                        </Text>
                                      </Box>

                                      {/* Details (hidden on mobile) */}
                                      <Box visibleFrom="sm" style={{ width: '200px', minWidth: 0 }}>
                                        <Text size="xs" c="dimmed" lineClamp={1}>
                                          {getProductSubtitle(product)}
                                        </Text>
                                      </Box>

                                      {/* Remaining (only for non-wine bottles) */}
                                      {product.brand.type !== 'WINE' && shelf.shelfItems.some(item => item.bottle.product.brand.type !== 'WINE' && item.bottle.amountRemaining !== null) && (
                                        <Box style={{ width: '100px' }}>
                                          {bottle.amountRemaining !== null ? (
                                            <Group gap="xs" justify="center">
                                              <Progress 
                                                value={bottle.amountRemaining} 
                                                size="xs" 
                                                color="wine"
                                                style={{ flex: 1 }}
                                              />
                                              <Text size="xs" c="dimmed" style={{ width: '35px', textAlign: 'right' }}>
                                                {bottle.amountRemaining}%
                                              </Text>
                                            </Group>
                                          ) : (
                                            <Text size="xs" c="dimmed" ta="center">-</Text>
                                          )}
                                        </Box>
                                      )}

                                      {/* Price (hidden on mobile) */}
                                      <Box visibleFrom="md" style={{ width: '80px', textAlign: 'right' }}>
                                        {bottle.purchasePrice !== null ? (
                                          <Text size="sm" fw={500} style={{ color: 'var(--color-burgundy)' }}>
                                            ${bottle.purchasePrice.toFixed(0)}
                                          </Text>
                                        ) : (
                                          <Text size="xs" c="dimmed">-</Text>
                                        )}
                                      </Box>
                                    </Group>
                                  </Link>
                                )
                              })}
                            </Stack>
                          </Box>
                        </Collapse>
                      )}

                      {/* Collapsed state message */}
                      {!isExpanded && hasMany && (
                        <Group justify="center" mt="sm">
                          <Button
                            variant="subtle"
                            size="sm"
                            onClick={() => toggleShelf(shelf.id)}
                            style={{ color: 'var(--color-wine)' }}
                            rightSection={<IconChevronDown size={16} />}
                          >
                            Show {shelf.shelfItems.length} bottles
                          </Button>
                        </Group>
                      )}
                    </Card>
                  )
                })}
              </Stack>
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
                    label={isSimpleStash ? "Keep bottles in this stash" : "Keep bottles on shelves (they will remain associated with this archived stash)"}
                  />
                  <Radio 
                    value="remove" 
                    label={isSimpleStash ? "Remove all bottles from this stash (bottles will remain in your inventory)" : "Remove all bottles from shelves (bottles will remain in your inventory but not on any shelf)"}
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
                This stash contains {totalBottles} {totalBottles === 1 ? 'bottle' : 'bottles'}{!isSimpleStash && ` across ${stash.shelves.length} ${stash.shelves.length === 1 ? 'shelf' : 'shelves'}`}.
              </Alert>
              
              <Radio.Group
                label="What would you like to do with the bottles?"
                value={removeItems}
                onChange={(value) => setRemoveItems(value as 'keep' | 'remove')}
              >
                <Stack gap="xs" mt="xs">
                  <Radio 
                    value="keep" 
                    label={isSimpleStash ? "Delete bottles with the stash" : "Keep bottles on shelves (shelves and bottles will be deleted with the stash)"}
                  />
                  <Radio 
                    value="remove" 
                    label={isSimpleStash ? "Remove bottles before deleting (bottles will remain in your inventory)" : "Remove all bottles from shelves before deleting (bottles will remain in your inventory)"}
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

