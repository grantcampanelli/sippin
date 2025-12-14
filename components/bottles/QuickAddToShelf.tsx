'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Title,
  Stack,
  Select,
  Button,
  Group,
  Text,
  Alert,
  Loader
} from '@mantine/core'
import { IconAlertCircle, IconCheck, IconPlus } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'

interface Stash {
  id: string
  name: string
  location: string
  archived: boolean
  shelves: Array<{
    id: string
    name: string
    order: number | null
    capacity: number | null
    _count: {
      shelfItems: number
    }
  }>
}

interface QuickAddToShelfProps {
  bottleId: string
  bottleName: string
  onSuccess: () => void
}

export function QuickAddToShelf({ bottleId, bottleName, onSuccess }: QuickAddToShelfProps) {
  const [stashes, setStashes] = useState<Stash[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedStashId, setSelectedStashId] = useState<string | null>(null)
  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null)

  useEffect(() => {
    fetchStashes()
  }, [])

  useEffect(() => {
    if (selectedStashId && stashes.length > 0) {
      const stash = stashes.find(s => s.id === selectedStashId)
      if (stash && stash.shelves.length > 0) {
        // Auto-select first shelf when stash changes
        setSelectedShelfId(stash.shelves[0].id)
      } else {
        setSelectedShelfId(null)
      }
    }
  }, [selectedStashId, stashes])

  const fetchStashes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stashes')
      if (response.ok) {
        const data = await response.json()
        const activeStashes = data.filter((s: Stash) => !s.archived)
        setStashes(activeStashes)
        
        // Auto-select first stash if available
        if (activeStashes.length > 0) {
          setSelectedStashId(activeStashes[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching stashes:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load stashes',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedStash = stashes.find(s => s.id === selectedStashId)
  const selectedShelf = selectedStash?.shelves.find(s => s.id === selectedShelfId)
  const availableCapacity = selectedShelf?.capacity 
    ? selectedShelf.capacity - selectedShelf._count.shelfItems 
    : null

  const handleAddToShelf = async () => {
    if (!selectedShelfId) {
      notifications.show({
        title: 'Select a shelf',
        message: 'Please select a shelf to add the bottle to',
        color: 'red',
      })
      return
    }

    if (availableCapacity !== null && availableCapacity === 0) {
      notifications.show({
        title: 'Shelf is full',
        message: 'This shelf is at full capacity',
        color: 'red',
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/shelf-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bottleIds: [bottleId],
          shelfId: selectedShelfId
        }),
      })

      if (response.ok) {
        notifications.show({
          title: 'Added to shelf!',
          message: `${bottleName} has been added to ${selectedShelf?.name}`,
          color: 'green',
          icon: <IconCheck size={16} />,
        })
        onSuccess()
      } else {
        const error = await response.json()
        notifications.show({
          title: 'Error',
          message: error.error || 'Failed to add bottle to shelf',
          color: 'red',
        })
      }
    } catch (error) {
      console.error('Error adding bottle to shelf:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to add bottle to shelf',
        color: 'red',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card 
        withBorder 
        p="lg"
        style={{ 
          borderColor: 'var(--color-beige)',
          background: 'white'
        }}
      >
        <Group justify="center" py="xl">
          <Loader size="md" color="wine" />
        </Group>
      </Card>
    )
  }

  if (stashes.length === 0) {
    return (
      <Card 
        withBorder 
        p="lg"
        style={{ 
          borderColor: 'var(--color-beige)',
          background: 'white'
        }}
      >
        <Title order={3} mb="md" style={{ color: 'var(--color-burgundy)' }}>
          Add to Shelf
        </Title>
        <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
          <Text size="sm">
            You don't have any stashes yet. Create a stash to organize your bottles!
          </Text>
        </Alert>
      </Card>
    )
  }

  return (
    <Card 
      withBorder 
      p="lg"
      style={{ 
        borderColor: 'var(--color-beige)',
        background: 'white'
      }}
    >
      <Title order={3} mb="md" style={{ color: 'var(--color-burgundy)' }}>
        Add to Shelf
      </Title>
      
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          This bottle isn't stored on a shelf yet. Select a location to add it:
        </Text>

        <Group grow align="flex-start">
          <Select
            label="Stash"
            placeholder="Select a stash"
            data={stashes.map(s => ({ 
              value: s.id, 
              label: `${s.name} (${s.location})` 
            }))}
            value={selectedStashId}
            onChange={setSelectedStashId}
            searchable
          />
          
          <Select
            label="Shelf"
            placeholder="Select a shelf"
            data={selectedStash?.shelves.map(s => ({
              value: s.id,
              label: `${s.name}${s.capacity ? ` (${s._count.shelfItems}/${s.capacity})` : ''}`
            })) || []}
            value={selectedShelfId}
            onChange={setSelectedShelfId}
            disabled={!selectedStashId || !selectedStash?.shelves.length}
          />
        </Group>

        {selectedShelf && availableCapacity !== null && availableCapacity === 0 && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            This shelf is at full capacity. Please select a different shelf.
          </Alert>
        )}

        {selectedShelf && availableCapacity !== null && availableCapacity > 0 && (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
            This shelf can hold {availableCapacity} more {availableCapacity === 1 ? 'bottle' : 'bottles'}
          </Alert>
        )}

        <Button
          onClick={handleAddToShelf}
          loading={saving}
          disabled={!selectedShelfId || (availableCapacity !== null && availableCapacity === 0)}
          leftSection={<IconPlus size={16} />}
          style={{ background: 'var(--color-wine)' }}
        >
          Add to {selectedShelf?.name || 'Shelf'}
        </Button>
      </Stack>
    </Card>
  )
}
