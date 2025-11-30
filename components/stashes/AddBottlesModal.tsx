'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  Stack,
  TextInput,
  Select,
  Button,
  Group,
  Checkbox,
  Text,
  ScrollArea,
  Paper,
  Badge,
  Alert,
  Loader,
  Divider,
  Box
} from '@mantine/core'
import { IconSearch, IconBottle, IconAlertCircle, IconCheck } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'

interface Bottle {
  id: string
  finished: boolean
  amountRemaining: number | null
  purchasePrice: number | null
  product: {
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
    } | null
  }
}

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

interface AddBottlesModalProps {
  opened: boolean
  onClose: () => void
  onSuccess?: () => void
  preselectedStashId?: string
  preselectedShelfId?: string
}

export function AddBottlesModal({
  opened,
  onClose,
  onSuccess,
  preselectedStashId,
  preselectedShelfId
}: AddBottlesModalProps) {
  const [bottles, setBottles] = useState<Bottle[]>([])
  const [stashes, setStashes] = useState<Stash[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStashId, setSelectedStashId] = useState<string | null>(preselectedStashId || null)
  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(preselectedShelfId || null)
  const [selectedBottleIds, setSelectedBottleIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (opened) {
      fetchAvailableBottles()
      fetchStashes()
      if (preselectedStashId) {
        setSelectedStashId(preselectedStashId)
      }
      if (preselectedShelfId) {
        setSelectedShelfId(preselectedShelfId)
      }
    } else {
      // Reset state when modal closes
      setSearchQuery('')
      setSelectedBottleIds(new Set())
      setSelectedStashId(preselectedStashId || null)
      setSelectedShelfId(preselectedShelfId || null)
    }
  }, [opened, preselectedStashId, preselectedShelfId])

  useEffect(() => {
    if (selectedStashId && stashes.length > 0) {
      const stash = stashes.find(s => s.id === selectedStashId)
      if (stash && stash.shelves.length > 0 && !selectedShelfId) {
        // Auto-select first shelf if none selected
        setSelectedShelfId(stash.shelves[0].id)
      }
    }
  }, [selectedStashId, stashes, selectedShelfId])

  const fetchAvailableBottles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/bottles?availableOnly=true&finished=false')
      if (response.ok) {
        const data = await response.json()
        setBottles(data)
      }
    } catch (error) {
      console.error('Error fetching bottles:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStashes = async () => {
    try {
      const response = await fetch('/api/stashes')
      if (response.ok) {
        const data = await response.json()
        setStashes(data.filter((s: Stash) => !s.archived))
      }
    } catch (error) {
      console.error('Error fetching stashes:', error)
    }
  }

  const getProductDisplayName = (product: Bottle['product']) => {
    if (product.brand.type === 'WINE' && product.wineData?.vintage) {
      return `${product.wineData.vintage} ${product.name}`
    }
    return product.name
  }

  const getProductSubtitle = (product: Bottle['product']) => {
    const parts = []
    if (product.brand.name) parts.push(product.brand.name)
    if (product.wineData?.varietal) parts.push(product.wineData.varietal)
    if (product.wineData?.region) parts.push(product.wineData.region)
    if (product.spiritData?.style) parts.push(product.spiritData.style)
    return parts.join(' • ')
  }

  const filteredBottles = bottles.filter(bottle => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const productName = bottle.product.name.toLowerCase()
    const brandName = bottle.product.brand.name.toLowerCase()
    const vintage = bottle.product.wineData?.vintage?.toLowerCase() || ''
    return productName.includes(query) || brandName.includes(query) || vintage.includes(query)
  })

  const selectedStash = stashes.find(s => s.id === selectedStashId)
  const selectedShelf = selectedStash?.shelves.find(s => s.id === selectedShelfId)
  const availableCapacity = selectedShelf?.capacity 
    ? selectedShelf.capacity - selectedShelf._count.shelfItems 
    : null

  const handleToggleBottle = (bottleId: string) => {
    const newSelected = new Set(selectedBottleIds)
    if (newSelected.has(bottleId)) {
      newSelected.delete(bottleId)
    } else {
      newSelected.add(bottleId)
    }
    setSelectedBottleIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedBottleIds.size === filteredBottles.length) {
      setSelectedBottleIds(new Set())
    } else {
      setSelectedBottleIds(new Set(filteredBottles.map(b => b.id)))
    }
  }

  const handleSubmit = async () => {
    if (!selectedShelfId) {
      notifications.show({
        title: 'Select a shelf',
        message: 'Please select a shelf to add bottles to',
        color: 'red',
      })
      return
    }

    if (selectedBottleIds.size === 0) {
      notifications.show({
        title: 'Select bottles',
        message: 'Please select at least one bottle to add',
        color: 'red',
      })
      return
    }

    // Check capacity
    if (availableCapacity !== null && selectedBottleIds.size > availableCapacity) {
      notifications.show({
        title: 'Capacity exceeded',
        message: `This shelf can only hold ${availableCapacity} more bottle(s). You selected ${selectedBottleIds.size}.`,
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
          bottleIds: Array.from(selectedBottleIds),
          shelfId: selectedShelfId
        }),
      })

      if (response.ok) {
        const result = await response.json()
        notifications.show({
          title: 'Bottles added!',
          message: `Successfully added ${result.count} ${result.count === 1 ? 'bottle' : 'bottles'} to shelf`,
          color: 'green',
          icon: <IconCheck size={16} />,
        })
        onSuccess?.()
        onClose()
      } else {
        const error = await response.json()
        notifications.show({
          title: 'Error',
          message: error.error || 'Failed to add bottles',
          color: 'red',
        })
      }
    } catch (error) {
      console.error('Error adding bottles:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to add bottles',
        color: 'red',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add Bottles to Shelf"
      size="xl"
      centered
    >
      <Stack gap="md">
        {/* Stash and Shelf Selection */}
        <Group grow>
          <Select
            label="Stash"
            placeholder="Select a stash"
            data={stashes.map(s => ({ value: s.id, label: `${s.name} (${s.location})` }))}
            value={selectedStashId}
            onChange={setSelectedStashId}
            required
            searchable
            disabled={!!preselectedStashId}
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
            required
            disabled={!!preselectedShelfId || !selectedStashId}
          />
        </Group>

        {/* Capacity Warning */}
        {selectedShelf && availableCapacity !== null && (
          <Alert icon={<IconAlertCircle size={16} />} color={availableCapacity === 0 ? 'red' : 'blue'} variant="light">
            {availableCapacity === 0 
              ? 'This shelf is at full capacity'
              : `This shelf can hold ${availableCapacity} more ${availableCapacity === 1 ? 'bottle' : 'bottles'}`}
          </Alert>
        )}

        {selectedShelfId && (
          <>
            <Divider />
            
            {/* Search */}
            <TextInput
              placeholder="Search bottles..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Select All */}
            {filteredBottles.length > 0 && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {filteredBottles.length} {filteredBottles.length === 1 ? 'bottle' : 'bottles'} available
                </Text>
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={handleSelectAll}
                >
                  {selectedBottleIds.size === filteredBottles.length ? 'Deselect All' : 'Select All'}
                </Button>
              </Group>
            )}

            {/* Bottle List */}
            <ScrollArea h={400}>
              {loading ? (
                <Box style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <Loader size="md" />
                </Box>
              ) : filteredBottles.length === 0 ? (
                <Paper p="xl" style={{ textAlign: 'center' }}>
                  <IconBottle size={48} style={{ color: 'var(--color-beige)', margin: '0 auto 1rem' }} />
                  <Text c="dimmed">
                    {searchQuery ? 'No bottles match your search' : 'No available bottles. All your bottles are already on shelves.'}
                  </Text>
                </Paper>
              ) : (
                <Stack gap="xs">
                  {filteredBottles.map((bottle) => {
                    const isSelected = selectedBottleIds.has(bottle.id)
                    const isDisabled = availableCapacity !== null && availableCapacity === 0 && !isSelected

                    return (
                      <Paper
                        key={bottle.id}
                        p="sm"
                        withBorder
                        style={{
                          borderColor: isSelected ? 'var(--color-wine)' : 'var(--color-beige)',
                          background: isSelected ? 'var(--color-cream)' : 'white',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          opacity: isDisabled ? 0.5 : 1
                        }}
                        onClick={() => !isDisabled && handleToggleBottle(bottle.id)}
                      >
                        <Group gap="sm" wrap="nowrap">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => !isDisabled && handleToggleBottle(bottle.id)}
                            disabled={isDisabled}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text fw={600} size="sm" lineClamp={1} style={{ color: 'var(--color-burgundy)' }}>
                              {getProductDisplayName(bottle.product)}
                            </Text>
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {getProductSubtitle(bottle.product)}
                            </Text>
                            {bottle.amountRemaining !== null && (
                              <Text size="xs" c="dimmed" mt={4}>
                                {bottle.amountRemaining}% remaining
                              </Text>
                            )}
                          </div>
                          <Badge
                            color={bottle.product.brand.type === 'WINE' ? 'wine' : bottle.product.brand.type === 'SPIRIT' ? 'amber' : 'blue'}
                            variant="light"
                            size="sm"
                          >
                            {bottle.product.brand.type}
                          </Badge>
                        </Group>
                      </Paper>
                    )
                  })}
                </Stack>
              )}
            </ScrollArea>

            {/* Selection Summary */}
            {selectedBottleIds.size > 0 && (
              <Alert color="blue" variant="light">
                <Text size="sm">
                  {selectedBottleIds.size} {selectedBottleIds.size === 1 ? 'bottle' : 'bottles'} selected
                  {availableCapacity !== null && (
                    <> • {availableCapacity - selectedBottleIds.size} {availableCapacity - selectedBottleIds.size === 1 ? 'slot' : 'slots'} remaining</>
                  )}
                </Text>
              </Alert>
            )}

            {/* Actions */}
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                loading={saving}
                disabled={selectedBottleIds.size === 0 || (availableCapacity !== null && selectedBottleIds.size > availableCapacity)}
                style={{ background: 'var(--color-wine)' }}
              >
                Add {selectedBottleIds.size > 0 ? `${selectedBottleIds.size} ` : ''}Bottle{selectedBottleIds.size !== 1 ? 's' : ''}
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  )
}

