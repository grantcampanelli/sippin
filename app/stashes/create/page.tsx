'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
  Loader
} from '@mantine/core'
import { IconPlus, IconTrash, IconArrowLeft, IconInfoCircle, IconTemperature, IconDroplet, IconBox } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import Link from 'next/link'

interface ShelfFormData {
  name: string
  order: number
  capacity: number | null
  temp: number | null
  humidity: number | null
  description: string | null
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

export default function CreateStashPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Stash form data
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [type, setType] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  
  // Shelf configuration
  const [hasMultipleShelves, setHasMultipleShelves] = useState(false)
  const [shelves, setShelves] = useState<ShelfFormData[]>([
    { name: 'Default Shelf', order: 1, capacity: null, temp: null, humidity: null, description: null }
  ])
  
  // Bulk settings
  const [bulkSettings, setBulkSettings] = useState({
    capacity: null as number | null,
    temp: null as number | null,
    humidity: null as number | null,
  })
  const [applyBulkSettings, setApplyBulkSettings] = useState(false)

  if (status === 'loading') {
    return (
      <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size="lg" color="wine" />
      </Box>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

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

    setLoading(true)
    try {
      const shelvesToSend = hasMultipleShelves ? shelves : []
      
      const response = await fetch('/api/stashes', {
        method: 'POST',
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
        const stash = await response.json()
        notifications.show({
          title: 'Stash created!',
          message: `${stash.name} has been created successfully`,
          color: 'green',
        })
        router.push(`/stashes/${stash.id}`)
      } else {
        const error = await response.json()
        notifications.show({
          title: 'Error creating stash',
          message: error.error || 'Failed to create stash',
          color: 'red',
        })
      }
    } catch (error) {
      console.error('Error creating stash:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to create stash',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)' }}>
      <Container size="md" py="xl">
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
                    {hasMultipleShelves 
                      ? 'Configure multiple shelves for your stash'
                      : 'Your stash will have one default shelf. Enable multiple shelves to customize each one.'}
                  </Text>
                </div>

                <Switch
                  label="Configure multiple shelves"
                  checked={hasMultipleShelves}
                  onChange={(e) => {
                    const checked = e.currentTarget.checked
                    setHasMultipleShelves(checked)
                    if (!checked) {
                      // Reset to single default shelf
                      setShelves([
                        { name: 'Default Shelf', order: 1, capacity: null, temp: null, humidity: null, description: null }
                      ])
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
                            key={index}
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
                                <Badge variant="light" color="wine" size="lg">
                                  #{shelf.order}
                                </Badge>
                                {shelves.length > 1 && (
                                  <ActionIcon
                                    color="red"
                                    variant="subtle"
                                    onClick={() => handleRemoveShelf(index)}
                                  >
                                    <IconTrash size={18} />
                                  </ActionIcon>
                                )}
                              </Group>

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

                {!hasMultipleShelves && (
                  <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                    Your stash will be created with a single default shelf. You can add more shelves later from the stash detail page.
                  </Alert>
                )}
              </Stack>
            </Card>

            {/* Submit Button */}
            <Group justify="flex-end">
              <Link href="/stashes" style={{ textDecoration: 'none' }}>
                <Button variant="subtle" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                loading={loading}
                style={{ background: 'var(--color-wine)' }}
                size="lg"
              >
                Create Stash
              </Button>
            </Group>
          </Stack>
        </form>
      </Container>
    </Box>
  )
}

