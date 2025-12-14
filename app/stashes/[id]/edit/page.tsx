'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Box,
  Divider,
  NumberInput,
  Switch,
  Paper,
  ActionIcon,
  Badge,
  Alert,
  Loader,
  SegmentedControl,
  SimpleGrid
} from '@mantine/core'
import { IconPlus, IconTrash, IconArrowLeft, IconInfoCircle, IconTemperature, IconDroplet, IconBox, IconAlertCircle, IconWand, IconSettings } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import Link from 'next/link'

type SetupMode = 'quick' | 'advanced'

interface ShelfFormData {
  id?: string
  name: string
  order: number
  capacity: number | null
  temp: number | null
  humidity: number | null
  description: string | null
  itemCount?: number
}

interface ShelfPreset {
  value: string
  label: string
  description: string
  shelves: number
  capacity: number
}

interface StashData {
  id: string
  name: string
  location: string
  type: string
  description: string | null
  shelves: Array<{
    id: string
    name: string
    order: number | null
    capacity: number | null
    temp: number | null
    humidity: number | null
    description: string | null
    _count: {
      shelfItems: number
    }
  }>
}

const STASH_TYPES = [
  { value: 'WINE_CELLAR', label: 'Wine Cellar' },
  { value: 'LIQUOR_CABINET', label: 'Liquor Cabinet' },
  { value: 'BAR', label: 'Bar' },
  { value: 'REFRIGERATOR', label: 'Refrigerator' },
  { value: 'FRIDGE', label: 'Fridge' },
  { value: 'GENERAL_STORAGE', label: 'General Storage' },
  { value: 'DISPLAY_CABINET', label: 'Display Cabinet' },
]

const SHELF_PRESETS: ShelfPreset[] = [
  {
    value: 'single',
    label: 'Single Shelf',
    description: 'One general purpose shelf',
    shelves: 1,
    capacity: 12
  },
  {
    value: 'small',
    label: 'Small Cabinet',
    description: '3 shelves, 6 bottles each',
    shelves: 3,
    capacity: 6
  },
  {
    value: 'medium',
    label: 'Medium Cabinet',
    description: '5 shelves, 12 bottles each',
    shelves: 5,
    capacity: 12
  },
  {
    value: 'large',
    label: 'Large Cellar',
    description: '10 shelves, 20 bottles each',
    shelves: 10,
    capacity: 20
  },
]

export default function EditStashPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stash, setStash] = useState<StashData | null>(null)
  
  // Stash form data
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [type, setType] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  
  // Setup mode
  const [setupMode, setSetupMode] = useState<SetupMode>('advanced') // Default to advanced for edit
  
  // Quick setup
  const [quickPreset, setQuickPreset] = useState<string | null>('single')
  const [customShelfCount, setCustomShelfCount] = useState<number | string>('')
  const [customShelfCapacity, setCustomShelfCapacity] = useState<number | string>('')
  
  // Shelf configuration
  const [hasMultipleShelves, setHasMultipleShelves] = useState(false)
  const [shelves, setShelves] = useState<ShelfFormData[]>([])
  
  // Bulk settings
  const [bulkSettings, setBulkSettings] = useState({
    capacity: null as number | null,
    temp: null as number | null,
    humidity: null as number | null,
  })
  const [applyBulkSettings, setApplyBulkSettings] = useState(false)

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
        const data: StashData = await response.json()
        setStash(data)
        setName(data.name)
        setLocation(data.location)
        setType(data.type)
        setDescription(data.description || '')
        
        // Load shelves
        if (data.shelves && data.shelves.length > 0) {
          const shelvesData = data.shelves.map(shelf => ({
            id: shelf.id,
            name: shelf.name,
            order: shelf.order ?? 1,
            capacity: shelf.capacity,
            temp: shelf.temp,
            humidity: shelf.humidity,
            description: shelf.description,
            itemCount: shelf._count.shelfItems
          }))
          setShelves(shelvesData)
          setHasMultipleShelves(data.shelves.length > 1 || data.shelves[0].name !== 'Default Shelf')
        } else {
          // No shelves, create default
          setShelves([
            { name: 'Default Shelf', order: 1, capacity: null, temp: null, humidity: null, description: null }
          ])
          setHasMultipleShelves(false)
        }
      } else if (response.status === 404) {
        router.push('/stashes')
      }
    } catch (error) {
      console.error('Error fetching stash:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load stash',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  // Generate shelves from quick setup
  const generateShelvesFromQuickSetup = (): ShelfFormData[] => {
    // If custom configuration is provided, use it
    if (typeof customShelfCount === 'number' && typeof customShelfCapacity === 'number') {
      if (customShelfCount > 0 && customShelfCount <= 100 && customShelfCapacity > 0 && customShelfCapacity <= 1000) {
        return Array.from({ length: customShelfCount }, (_, i) => ({
          name: `Shelf ${i + 1}`,
          order: i + 1,
          capacity: customShelfCapacity,
          temp: null,
          humidity: null,
          description: null
        }))
      }
      
      // Invalid numbers
      return []
    }
    
    // Use preset
    if (quickPreset) {
      const preset = SHELF_PRESETS.find(p => p.value === quickPreset)
      if (preset) {
        return Array.from({ length: preset.shelves }, (_, i) => ({
          name: preset.shelves === 1 ? 'Main Shelf' : `Shelf ${i + 1}`,
          order: i + 1,
          capacity: preset.capacity,
          temp: null,
          humidity: null,
          description: null
        }))
      }
    }
    
    // Default: single shelf
    return [{
      name: 'Main Shelf',
      order: 1,
      capacity: 12,
      temp: null,
      humidity: null,
      description: null
    }]
  }
  
  const hasCustomConfig = typeof customShelfCount === 'number' && typeof customShelfCapacity === 'number'

  const handleAddShelf = () => {
    const newOrder = shelves.length + 1
    setShelves([
      ...shelves,
      {
        name: `Shelf ${newOrder}`,
        order: newOrder,
        capacity: applyBulkSettings ? bulkSettings.capacity : null,
        temp: applyBulkSettings ? bulkSettings.temp : null,
        humidity: applyBulkSettings ? bulkSettings.humidity : null,
        description: null
      }
    ])
  }

  const handleRemoveShelf = (index: number) => {
    const shelf = shelves[index]
    
    // Check if shelf has items
    if (shelf.itemCount && shelf.itemCount > 0) {
      notifications.show({
        title: 'Cannot remove shelf',
        message: `This shelf contains ${shelf.itemCount} ${shelf.itemCount === 1 ? 'bottle' : 'bottles'}. Remove all bottles before deleting the shelf.`,
        color: 'red',
      })
      return
    }

    if (shelves.length === 1) {
      notifications.show({
        title: 'Cannot remove shelf',
        message: 'A stash must have at least one shelf',
        color: 'red',
      })
      return
    }
    
    const updated = shelves.filter((_, i) => i !== index)
    // Reorder shelves
    updated.forEach((shelf, i) => {
      shelf.order = i + 1
    })
    setShelves(updated)
  }

  const handleUpdateShelf = (index: number, field: keyof ShelfFormData, value: any) => {
    const updated = [...shelves]
    updated[index] = { ...updated[index], [field]: value }
    setShelves(updated)
  }

  const applyBulkSettingsToAll = () => {
    const updated = shelves.map(shelf => ({
      ...shelf,
      capacity: applyBulkSettings && bulkSettings.capacity !== null ? bulkSettings.capacity : shelf.capacity,
      temp: applyBulkSettings && bulkSettings.temp !== null ? bulkSettings.temp : shelf.temp,
      humidity: applyBulkSettings && bulkSettings.humidity !== null ? bulkSettings.humidity : shelf.humidity,
    }))
    setShelves(updated)
    notifications.show({
      title: 'Settings applied',
      message: 'Bulk settings have been applied to all shelves',
      color: 'green',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !location || !type) {
      notifications.show({
        title: 'Missing required fields',
        message: 'Please fill in all required fields',
        color: 'red',
      })
      return
    }

    // Determine shelves based on setup mode
    let shelvesToSend: ShelfFormData[] = []
    
    if (setupMode === 'quick') {
      shelvesToSend = generateShelvesFromQuickSetup()
      
      // Validate custom configuration if provided
      if (hasCustomConfig && shelvesToSend.length === 0) {
        notifications.show({
          title: 'Invalid configuration',
          message: 'Please enter valid numbers for shelves (1-100) and capacity (1-1000)',
          color: 'red',
        })
        return
      }
    } else {
      // Advanced mode
      shelvesToSend = hasMultipleShelves ? shelves : []
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/stashes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          location,
          type,
          description: description || null,
          shelves: shelvesToSend
        }),
      })

      if (response.ok) {
        const updatedStash = await response.json()
        notifications.show({
          title: 'Stash updated!',
          message: `${updatedStash.name} has been updated successfully`,
          color: 'green',
        })
        router.push(`/stashes/${id}`)
      } else {
        const error = await response.json()
        notifications.show({
          title: 'Error updating stash',
          message: error.error || 'Failed to update stash',
          color: 'red',
        })
      }
    } catch (error) {
      console.error('Error updating stash:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to update stash',
        color: 'red',
      })
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size="lg" color="wine" />
      </Box>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (!stash) {
    return (
      <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Stash not found">
          The stash you're looking for doesn't exist or you don't have permission to access it.
        </Alert>
      </Box>
    )
  }

  return (
    <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)' }}>
      <Container size="md" py="xl">
        <Group mb="xl">
          <Link href={`/stashes/${id}`} style={{ textDecoration: 'none' }}>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              style={{ color: 'var(--color-wine)' }}
            >
              Back to Stash
            </Button>
          </Link>
        </Group>

        <form onSubmit={handleSubmit}>
          <Stack gap="xl">
            {/* Stash Basic Information */}
            <Card 
              padding="xl" 
              radius="md" 
              withBorder
              style={{ 
                borderColor: 'var(--color-beige)',
                background: 'white'
              }}
            >
              <Title order={2} mb="md" style={{ color: 'var(--color-burgundy)' }}>
                Stash Information
              </Title>
              
              <Stack gap="md">
                <TextInput
                  label="Name"
                  placeholder="e.g., Main Wine Cellar"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  styles={{
                    label: { color: 'var(--color-brown)', fontWeight: 500 }
                  }}
                />

                <TextInput
                  label="Location"
                  placeholder="e.g., Basement, Kitchen, Living Room"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  styles={{
                    label: { color: 'var(--color-brown)', fontWeight: 500 }
                  }}
                />

                <Select
                  label="Type"
                  placeholder="Select stash type"
                  required
                  data={STASH_TYPES}
                  value={type}
                  onChange={setType}
                  styles={{
                    label: { color: 'var(--color-brown)', fontWeight: 500 }
                  }}
                />

                <Textarea
                  label="Description"
                  placeholder="Optional description of your stash..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  minRows={3}
                  styles={{
                    label: { color: 'var(--color-brown)', fontWeight: 500 }
                  }}
                />
              </Stack>
            </Card>

            {/* Shelf Configuration */}
            <Card 
              padding="xl" 
              radius="md" 
              withBorder
              style={{ 
                borderColor: 'var(--color-beige)',
                background: 'white'
              }}
            >
              <Stack gap="md">
                <div>
                  <Title order={2} mb="xs" style={{ color: 'var(--color-burgundy)' }}>
                    Shelf Configuration
                  </Title>
                  <Text size="sm" c="dimmed">
                    Choose how you want to set up your shelves
                  </Text>
                </div>

                {/* Setup Mode Toggle */}
                <SegmentedControl
                  value={setupMode}
                  onChange={(value) => setSetupMode(value as SetupMode)}
                  data={[
                    {
                      value: 'quick',
                      label: (
                        <Group gap="xs" justify="center">
                          <IconWand size={16} />
                          <span>Quick Setup</span>
                        </Group>
                      ),
                    },
                    {
                      value: 'advanced',
                      label: (
                        <Group gap="xs" justify="center">
                          <IconSettings size={16} />
                          <span>Advanced</span>
                        </Group>
                      ),
                    },
                  ]}
                  fullWidth
                  color="wine"
                  styles={{
                    root: {
                      background: 'var(--color-cream)',
                    },
                  }}
                />

                {/* Quick Setup Mode */}
                {setupMode === 'quick' && (
                  <Stack gap="lg">
                    <Alert icon={<IconInfoCircle size={16} />} color="orange" variant="light">
                      Note: Using quick setup will replace all existing shelf configurations. Switch to Advanced mode to keep current settings.
                    </Alert>
                    
                    <div>
                      <Text fw={600} mb="sm" style={{ color: 'var(--color-burgundy)' }}>
                        Choose a preset or enter custom dimensions
                      </Text>
                      
                      {/* Preset Options */}
                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="md">
                        {SHELF_PRESETS.map((preset) => (
                          <Paper
                            key={preset.value}
                            p="md"
                            withBorder
                            style={{
                              borderColor: quickPreset === preset.value && !hasCustomConfig 
                                ? 'var(--color-wine)' 
                                : 'var(--color-beige)',
                              borderWidth: quickPreset === preset.value && !hasCustomConfig ? 2 : 1,
                              background: quickPreset === preset.value && !hasCustomConfig 
                                ? 'var(--color-cream)' 
                                : 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => {
                              setQuickPreset(preset.value)
                              setCustomShelfCount('')
                              setCustomShelfCapacity('')
                            }}
                          >
                            <Stack gap="xs">
                              <Group justify="space-between">
                                <Text fw={600} style={{ color: 'var(--color-burgundy)' }}>
                                  {preset.label}
                                </Text>
                                {quickPreset === preset.value && !hasCustomConfig && (
                                  <Badge color="wine" size="sm">Selected</Badge>
                                )}
                              </Group>
                              <Text size="sm" c="dimmed">
                                {preset.description}
                              </Text>
                              <Group gap="xs">
                                <Badge variant="light" color="blue">
                                  {preset.shelves} {preset.shelves === 1 ? 'shelf' : 'shelves'}
                                </Badge>
                                <Badge variant="light" color="green">
                                  {preset.capacity} bottles each
                                </Badge>
                              </Group>
                            </Stack>
                          </Paper>
                        ))}
                      </SimpleGrid>

                      {/* Custom Configuration */}
                      <Paper p="md" withBorder style={{ 
                        borderColor: hasCustomConfig ? 'var(--color-wine)' : 'var(--color-beige)',
                        borderWidth: hasCustomConfig ? 2 : 1,
                        background: hasCustomConfig ? 'var(--color-cream)' : 'white'
                      }}>
                        <Stack gap="md">
                          <Group justify="space-between" align="flex-start">
                            <div>
                              <Text fw={600} style={{ color: 'var(--color-burgundy)' }}>
                                Custom Configuration
                              </Text>
                              <Text size="sm" c="dimmed">
                                Specify the number of shelves and capacity per shelf
                              </Text>
                            </div>
                            {hasCustomConfig && (
                              <Badge color="wine" size="sm">Custom</Badge>
                            )}
                          </Group>
                          
                          <Group grow align="flex-start">
                            <NumberInput
                              label="Number of Shelves"
                              placeholder="e.g., 3"
                              value={customShelfCount}
                              onChange={(value) => {
                                setCustomShelfCount(value)
                                if (value) {
                                  setQuickPreset(null)
                                }
                              }}
                              min={1}
                              max={100}
                              allowDecimal={false}
                              leftSection={<IconBox size={16} />}
                              styles={{
                                label: { color: 'var(--color-brown)', fontWeight: 500 }
                              }}
                            />
                            <NumberInput
                              label="Bottles per Shelf"
                              placeholder="e.g., 5"
                              value={customShelfCapacity}
                              onChange={(value) => {
                                setCustomShelfCapacity(value)
                                if (value) {
                                  setQuickPreset(null)
                                }
                              }}
                              min={1}
                              max={1000}
                              allowDecimal={false}
                              leftSection={<IconBox size={16} />}
                              styles={{
                                label: { color: 'var(--color-brown)', fontWeight: 500 }
                              }}
                            />
                          </Group>
                          
                          {hasCustomConfig && (
                            <Alert color="green" variant="light" icon={<IconInfoCircle size={16} />}>
                              Will create {customShelfCount} {customShelfCount === 1 ? 'shelf' : 'shelves'} with {customShelfCapacity} bottle capacity each
                            </Alert>
                          )}
                        </Stack>
                      </Paper>
                    </div>
                  </Stack>
                )}

                {/* Advanced Setup Mode */}
                {setupMode === 'advanced' && (
                  <>
                    <Switch
                      label="Configure multiple shelves"
                      checked={hasMultipleShelves}
                      onChange={(e) => {
                        const checked = e.currentTarget.checked
                        setHasMultipleShelves(checked)
                        if (!checked && shelves.length > 1) {
                          // Keep only the first shelf
                          setShelves([shelves[0]])
                        }
                      }}
                      styles={{
                        label: { color: 'var(--color-brown)', fontWeight: 500 }
                      }}
                    />

                {hasMultipleShelves && (
                  <>
                    {/* Bulk Settings */}
                    <Paper p="md" withBorder style={{ background: 'var(--color-cream)', borderColor: 'var(--color-beige)' }}>
                      <Stack gap="md">
                        <Group justify="space-between" align="center">
                          <div>
                            <Text fw={600} style={{ color: 'var(--color-burgundy)' }}>
                              Bulk Settings
                            </Text>
                            <Text size="sm" c="dimmed">
                              Apply these settings to all shelves at once
                            </Text>
                          </div>
                          <Switch
                            checked={applyBulkSettings}
                            onChange={(e) => setApplyBulkSettings(e.currentTarget.checked)}
                          />
                        </Group>

                        {applyBulkSettings && (
                          <>
                            <Group grow>
                              <NumberInput
                                label="Capacity"
                                placeholder="Max bottles"
                                leftSection={<IconBox size={16} />}
                                value={bulkSettings.capacity || ''}
                                onChange={(value) => setBulkSettings({ ...bulkSettings, capacity: typeof value === 'number' ? value : null })}
                                min={1}
                                allowDecimal={false}
                              />
                              <NumberInput
                                label="Temperature (°C)"
                                placeholder="e.g., 12"
                                leftSection={<IconTemperature size={16} />}
                                value={bulkSettings.temp || ''}
                                onChange={(value) => setBulkSettings({ ...bulkSettings, temp: typeof value === 'number' ? value : null })}
                                allowDecimal={true}
                              />
                              <NumberInput
                                label="Humidity (%)"
                                placeholder="0-100"
                                leftSection={<IconDroplet size={16} />}
                                value={bulkSettings.humidity || ''}
                                onChange={(value) => setBulkSettings({ ...bulkSettings, humidity: typeof value === 'number' ? value : null })}
                                min={0}
                                max={100}
                                allowDecimal={true}
                              />
                            </Group>
                            <Button
                              variant="light"
                              onClick={applyBulkSettingsToAll}
                              style={{ alignSelf: 'flex-start' }}
                            >
                              Apply to All Shelves
                            </Button>
                          </>
                        )}
                      </Stack>
                    </Paper>

                    <Divider />

                    {/* Individual Shelves */}
                    <div>
                      <Group justify="space-between" mb="md">
                        <Text fw={600} style={{ color: 'var(--color-burgundy)' }}>
                          Shelves ({shelves.length})
                        </Text>
                        <Button
                          leftSection={<IconPlus size={16} />}
                          onClick={handleAddShelf}
                          variant="light"
                          size="sm"
                        >
                          Add Shelf
                        </Button>
                      </Group>

                      <Stack gap="md">
                        {shelves.map((shelf, index) => (
                          <Paper
                            key={shelf.id || index}
                            p="md"
                            withBorder
                            style={{ borderColor: 'var(--color-beige)', background: 'white' }}
                          >
                            <Stack gap="sm">
                              <Group justify="space-between" align="flex-start">
                                <TextInput
                                  placeholder="Shelf name"
                                  value={shelf.name}
                                  onChange={(e) => handleUpdateShelf(index, 'name', e.target.value)}
                                  style={{ flex: 1 }}
                                  required
                                />
                                <Group gap="xs">
                                  {shelf.itemCount !== undefined && shelf.itemCount > 0 && (
                                    <Badge variant="light" color="blue" size="sm">
                                      {shelf.itemCount} {shelf.itemCount === 1 ? 'bottle' : 'bottles'}
                                    </Badge>
                                  )}
                                  <Badge variant="light" color="wine" size="lg">
                                    #{shelf.order}
                                  </Badge>
                                  {shelves.length > 1 && (
                                    <ActionIcon
                                      color="red"
                                      variant="subtle"
                                      onClick={() => handleRemoveShelf(index)}
                                      disabled={shelf.itemCount !== undefined && shelf.itemCount > 0}
                                      title={shelf.itemCount && shelf.itemCount > 0 ? 'Cannot delete shelf with bottles' : 'Delete shelf'}
                                    >
                                      <IconTrash size={18} />
                                    </ActionIcon>
                                  )}
                                </Group>
                              </Group>

                              {shelf.itemCount !== undefined && shelf.itemCount > 0 && (
                                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                                  <Text size="sm">
                                    This shelf contains {shelf.itemCount} {shelf.itemCount === 1 ? 'bottle' : 'bottles'}. Remove all bottles before deleting.
                                  </Text>
                                </Alert>
                              )}

                              <Group grow>
                                <NumberInput
                                  label="Capacity"
                                  placeholder="Max bottles"
                                  leftSection={<IconBox size={16} />}
                                  value={shelf.capacity || ''}
                                  onChange={(value) => handleUpdateShelf(index, 'capacity', typeof value === 'number' ? value : null)}
                                  min={1}
                                  allowDecimal={false}
                                />
                                <NumberInput
                                  label="Temperature (°C)"
                                  placeholder="e.g., 12"
                                  leftSection={<IconTemperature size={16} />}
                                  value={shelf.temp || ''}
                                  onChange={(value) => handleUpdateShelf(index, 'temp', typeof value === 'number' ? value : null)}
                                  allowDecimal={true}
                                />
                                <NumberInput
                                  label="Humidity (%)"
                                  placeholder="0-100"
                                  leftSection={<IconDroplet size={16} />}
                                  value={shelf.humidity || ''}
                                  onChange={(value) => handleUpdateShelf(index, 'humidity', typeof value === 'number' ? value : null)}
                                  min={0}
                                  max={100}
                                  allowDecimal={true}
                                />
                              </Group>

                              <Textarea
                                label="Description"
                                placeholder="Optional shelf description..."
                                value={shelf.description || ''}
                                onChange={(e) => handleUpdateShelf(index, 'description', e.target.value || null)}
                                minRows={2}
                              />
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    </div>
                  </>
                )}

                {!hasMultipleShelves && setupMode === 'advanced' && (
                  <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                    Your stash has a single shelf. Enable multiple shelves to add more and customize each one.
                  </Alert>
                )}
                  </>
                )}
              </Stack>
            </Card>

            {/* Submit Button */}
            <Group justify="flex-end">
              <Link href={`/stashes/${id}`} style={{ textDecoration: 'none' }}>
                <Button variant="subtle" disabled={saving}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                loading={saving}
                style={{ background: 'var(--color-wine)' }}
                size="lg"
              >
                Save Changes
              </Button>
            </Group>
          </Stack>
        </form>
      </Container>
    </Box>
  )
}

