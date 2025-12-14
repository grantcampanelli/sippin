'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import {
  Container,
  Title,
  Text,
  Card,
  Group,
  Badge,
  Stack,
  Button,
  Divider,
  Paper,
  Grid,
  Box,
  Loader,
  Modal,
  NumberInput,
  Alert
} from '@mantine/core'
import Link from 'next/link'
import { IconArrowLeft, IconBottle, IconCalendar, IconCurrencyDollar, IconEdit, IconTrash, IconCheck, IconAlertCircle, IconCamera } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { ImageUpload } from '@/components/bottles/ImageUpload'
import { QuickAddToShelf } from '@/components/bottles/QuickAddToShelf'

interface Bottle {
  id: string
  size: number | null
  amountRemaining: number | null
  purchasePrice: number | null
  purchaseDate: string | null
  openDate: string | null
  finished: boolean
  finishDate: string | null
  rating: number | null
  notes: string | null
  imageUrl: string | null
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
  shelfItem: {
    id: string
    shelfId: string
    shelf: {
      name: string
      stash: {
        id: string
        name: string
      } | null
    }
  } | null
}

export default function BottleDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [bottle, setBottle] = useState<Bottle | null>(null)
  const [loading, setLoading] = useState(true)
  const [removeFromShelfModalOpen, setRemoveFromShelfModalOpen] = useState(false)
  const [markCompleteModalOpen, setMarkCompleteModalOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [rating, setRating] = useState<number | ''>('')
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [updatingImage, setUpdatingImage] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && id) {
      fetchBottle()
    }
  }, [status, router, id])

  const fetchBottle = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/bottles/${id}`)
      if (response.ok) {
        const data = await response.json()
        setBottle(data)
        setRating(data.rating ?? '')
      } else if (response.status === 404) {
        router.push('/bottles')
      }
    } catch (error) {
      console.error('Error fetching bottle:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromShelf = async () => {
    if (!bottle?.shelfItem) return

    setProcessing(true)
    try {
      const response = await fetch(`/api/shelf-items?bottleId=${bottle.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        notifications.show({
          title: 'Removed from shelf',
          message: 'Bottle has been removed from the shelf',
          color: 'green',
          icon: <IconCheck size={16} />,
        })
        setRemoveFromShelfModalOpen(false)
        fetchBottle() // Refresh to update UI
      } else {
        const error = await response.json()
        notifications.show({
          title: 'Error',
          message: error.error || 'Failed to remove bottle from shelf',
          color: 'red',
        })
      }
    } catch (error) {
      console.error('Error removing from shelf:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to remove bottle from shelf',
        color: 'red',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleMarkComplete = async () => {
    if (!bottle) return

    setProcessing(true)
    try {
      const finishDate = new Date().toISOString().split('T')[0]
      
      // Update bottle to finished
      const updateResponse = await fetch(`/api/bottles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finished: true,
          finishDate: finishDate,
          amountRemaining: 0,
          rating: rating === '' ? null : rating,
        }),
      })

      if (!updateResponse.ok) {
        const error = await updateResponse.json()
        throw new Error(error.error || 'Failed to mark bottle as complete')
      }

      // Remove from shelf if it's on one
      if (bottle.shelfItem) {
        await fetch(`/api/shelf-items?bottleId=${bottle.id}`, {
          method: 'DELETE',
        })
      }

      notifications.show({
        title: 'Bottle marked as complete!',
        message: `${bottle.product.name} has been marked as finished`,
        color: 'green',
        icon: <IconCheck size={16} />,
      })
      
      setMarkCompleteModalOpen(false)
      setRating('')
      fetchBottle() // Refresh to update UI
    } catch (error) {
      console.error('Error marking complete:', error)
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to mark bottle as complete',
        color: 'red',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleImageUploaded = async (url: string) => {
    if (!bottle) return
    
    setUpdatingImage(true)
    try {
      const response = await fetch(`/api/bottles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: url
        })
      })

      if (response.ok) {
        notifications.show({
          title: 'Photo updated!',
          message: 'Your bottle photo has been updated',
          color: 'green',
          icon: <IconCheck size={16} />
        })
        setImageModalOpen(false)
        fetchBottle() // Refresh to show new image
      } else {
        throw new Error('Failed to update image')
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update bottle photo',
        color: 'red'
      })
    } finally {
      setUpdatingImage(false)
    }
  }

  const handleImageRemoved = async () => {
    if (!bottle) return
    
    setUpdatingImage(true)
    try {
      const response = await fetch(`/api/bottles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: null
        })
      })

      if (response.ok) {
        notifications.show({
          title: 'Photo removed',
          message: 'Bottle photo has been removed',
          color: 'green',
          icon: <IconCheck size={16} />
        })
        setImageModalOpen(false)
        fetchBottle() // Refresh to remove image
      } else {
        throw new Error('Failed to remove image')
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to remove bottle photo',
        color: 'red'
      })
    } finally {
      setUpdatingImage(false)
    }
  }

  if (status === 'loading' || loading || !bottle) {
    return (
      <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size="lg" color="wine" />
      </Box>
    )
  }

  const product = bottle.product
  const brand = product.brand

  const getProductDisplayName = () => {
    if (brand.type === 'WINE' && product.wineData) {
      const vintage = product.wineData.vintage ? `${product.wineData.vintage} ` : ''
      return `${vintage}${product.name}`
    }
    return product.name
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)' }}>
      <Container size="md" py="xl">
        <Group mb="xl" justify="space-between">
          <Group>
            {bottle.shelfItem ? (
              <Link href={`/shelves/${bottle.shelfItem.shelfId}`} style={{ textDecoration: 'none' }}>
                <Button
                  variant="subtle"
                  leftSection={<IconArrowLeft size={16} />}
                  style={{ color: 'var(--color-wine)' }}
                >
                  Back to {bottle.shelfItem.shelf.name}
                </Button>
              </Link>
            ) : (
              <Link href="/bottles" style={{ textDecoration: 'none' }}>
                <Button
                  variant="subtle"
                  leftSection={<IconArrowLeft size={16} />}
                  style={{ color: 'var(--color-wine)' }}
                >
                  Back to Bottles
                </Button>
              </Link>
            )}
          </Group>
          <Group gap="sm">
            {!bottle.finished && (
              <>
                {bottle.shelfItem && (
                  <Button
                    variant="light"
                    color="orange"
                    leftSection={<IconTrash size={16} />}
                    onClick={() => setRemoveFromShelfModalOpen(true)}
                  >
                    Remove from Shelf
                  </Button>
                )}
                <Button
                  leftSection={<IconCheck size={16} />}
                  onClick={() => setMarkCompleteModalOpen(true)}
                  style={{ background: 'var(--color-wine)' }}
                >
                  Mark as Complete
                </Button>
              </>
            )}
            <Link href={`/bottles/${id}/edit`} style={{ textDecoration: 'none' }}>
              <Button
                leftSection={<IconEdit size={16} />}
                variant="light"
              >
                Edit
              </Button>
            </Link>
          </Group>
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
              <div>
                <Title order={1} style={{ color: 'var(--color-burgundy)' }}>
                  {getProductDisplayName()}
                </Title>
                <Text c="dimmed" mt="xs" size="lg">
                  {brand.name}
                </Text>
              </div>
              <Group gap="xs">
                {bottle.finished && (
                  <Badge color="gray" size="lg" variant="light">
                    Finished
                  </Badge>
                )}
                <Badge
                  size="lg"
                  color={brand.type === 'WINE' ? 'wine' : brand.type === 'SPIRIT' ? 'amber' : 'blue'}
                  style={{ fontWeight: 600 }}
                >
                  {brand.type}
                </Badge>
              </Group>
            </Group>
          </Card>

          {/* Product Details */}
          <Card 
            withBorder 
            p="lg"
            style={{ 
              borderColor: 'var(--color-beige)',
              background: 'white'
            }}
          >
            <Title order={3} mb="md" style={{ color: 'var(--color-burgundy)' }}>
              Product Details
            </Title>
          <Stack gap="sm">
            {product.wineData && (
              <>
                {product.wineData.varietal && (
                  <Group justify="space-between">
                    <Text c="dimmed">Varietal</Text>
                    <Text fw={500}>{product.wineData.varietal}</Text>
                  </Group>
                )}
                {product.wineData.region && (
                  <Group justify="space-between">
                    <Text c="dimmed">Region</Text>
                    <Text fw={500}>{product.wineData.region}</Text>
                  </Group>
                )}
                {product.wineData.vintage && (
                  <Group justify="space-between">
                    <Text c="dimmed">Vintage</Text>
                    <Text fw={500}>{product.wineData.vintage}</Text>
                  </Group>
                )}
              </>
            )}
            {product.spiritData && (
              <>
                {product.spiritData.style && (
                  <Group justify="space-between">
                    <Text c="dimmed">Style</Text>
                    <Text fw={500}>{product.spiritData.style}</Text>
                  </Group>
                )}
              </>
            )}
          </Stack>
        </Card>

        {/* Bottle Details */}
        <Card 
          withBorder 
          p="lg"
          style={{ 
            borderColor: 'var(--color-beige)',
            background: 'white'
          }}
        >
          <Title order={3} mb="md" style={{ color: 'var(--color-burgundy)' }}>
            Bottle Details
          </Title>
          <Stack gap="sm">
            {bottle.size && (
              <Group justify="space-between">
                <Text c="dimmed">Size</Text>
                <Text fw={500}>{bottle.size}ml</Text>
              </Group>
            )}
            {bottle.amountRemaining !== null && (
              <Group justify="space-between">
                <Text c="dimmed">Amount Remaining</Text>
                <Text fw={500}>{bottle.amountRemaining}%</Text>
              </Group>
            )}
            {bottle.purchasePrice !== null && (
              <Group justify="space-between">
                <Text c="dimmed">Purchase Price</Text>
                <Text fw={500}>${bottle.purchasePrice.toFixed(2)}</Text>
              </Group>
            )}
            {bottle.purchaseDate && (
              <Group justify="space-between">
                <Text c="dimmed">Purchase Date</Text>
                <Text fw={500}>{formatDate(bottle.purchaseDate)}</Text>
              </Group>
            )}
            {bottle.openDate && (
              <Group justify="space-between">
                <Text c="dimmed">Open Date</Text>
                <Text fw={500}>{formatDate(bottle.openDate)}</Text>
              </Group>
            )}
            {bottle.finished && (
              <Group justify="space-between">
                <Text c="dimmed">Status</Text>
                <Badge color="gray">Finished</Badge>
              </Group>
            )}
            {bottle.finishDate && (
              <Group justify="space-between">
                <Text c="dimmed">Finish Date</Text>
                <Text fw={500}>{formatDate(bottle.finishDate)}</Text>
              </Group>
            )}
            {bottle.rating && (
              <Group justify="space-between">
                <Text c="dimmed">Rating</Text>
                <Text fw={500}>{bottle.rating}/10</Text>
              </Group>
            )}
          </Stack>
        </Card>

        {/* Location */}
        {bottle.shelfItem ? (
          <Card 
            withBorder 
            p="lg"
            style={{ 
              borderColor: 'var(--color-beige)',
              background: 'white'
            }}
          >
            <Group justify="space-between" mb="md">
              <Title order={3} style={{ color: 'var(--color-burgundy)' }}>
                Location
              </Title>
              {bottle.shelfItem.shelf.stash && (
                <Link href={`/stashes/${bottle.shelfItem.shelf.stash.id}`} style={{ textDecoration: 'none' }}>
                  <Button variant="light" size="xs" style={{ color: 'var(--color-wine)' }}>
                    View Stash
                  </Button>
                </Link>
              )}
            </Group>
            <Stack gap="sm">
              {bottle.shelfItem.shelf.stash && (
                <Group justify="space-between">
                  <Text c="dimmed">Stash</Text>
                  <Text fw={500}>{bottle.shelfItem.shelf.stash.name}</Text>
                </Group>
              )}
              <Group justify="space-between">
                <Text c="dimmed">Shelf</Text>
                <Link href={`/shelves/${bottle.shelfItem.shelfId}`} style={{ textDecoration: 'none' }}>
                  <Text fw={500} style={{ color: 'var(--color-wine)', cursor: 'pointer' }}>
                    {bottle.shelfItem.shelf.name}
                  </Text>
                </Link>
              </Group>
            </Stack>
          </Card>
        ) : !bottle.finished && (
          <QuickAddToShelf
            bottleId={bottle.id}
            bottleName={getProductDisplayName()}
            onSuccess={fetchBottle}
          />
        )}

        {/* Bottle Photo */}
        <Card 
          withBorder 
          p="lg"
          style={{ 
            borderColor: 'var(--color-beige)',
            background: 'white'
          }}
        >
          <Title order={3} mb="md" style={{ color: 'var(--color-burgundy)' }}>
            Bottle Photo
          </Title>
          {bottle.imageUrl ? (
            <Box>
              <Box
                style={{
                  width: '100%',
                  maxWidth: '500px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '2px solid var(--color-beige)',
                  marginBottom: '1rem'
                }}
              >
                <img
                  src={bottle.imageUrl}
                  alt={getProductDisplayName()}
                  style={{ width: '100%', display: 'block' }}
                />
              </Box>
              <Group gap="sm">
                <Button
                  variant="light"
                  leftSection={<IconCamera size={16} />}
                  onClick={() => setImageModalOpen(true)}
                >
                  Replace Photo
                </Button>
              </Group>
            </Box>
          ) : (
            <Box>
              <Stack gap="md" align="center" py="xl">
                <IconCamera size={48} style={{ color: 'var(--color-wine)', opacity: 0.5 }} />
                <Text c="dimmed" ta="center">
                  No photo for this bottle yet
                </Text>
                <Button
                  leftSection={<IconCamera size={16} />}
                  onClick={() => setImageModalOpen(true)}
                  style={{ background: 'var(--gradient-wine)', color: 'white' }}
                >
                  Add Photo
                </Button>
              </Stack>
            </Box>
          )}
        </Card>

        {/* Notes */}
        {bottle.notes && (
          <Card 
            withBorder 
            p="lg"
            style={{ 
              borderColor: 'var(--color-beige)',
              background: 'white'
            }}
          >
            <Title order={3} mb="md" style={{ color: 'var(--color-burgundy)' }}>
              Notes
            </Title>
            <Text style={{ color: 'var(--color-brown)' }}>{bottle.notes}</Text>
          </Card>
        )}
      </Stack>
    </Container>

    {/* Remove from Shelf Modal */}
    <Modal
      opened={removeFromShelfModalOpen}
      onClose={() => setRemoveFromShelfModalOpen(false)}
      title="Remove from Shelf"
      centered
    >
      <Stack gap="md">
        <Text>
          Are you sure you want to remove <strong>{getProductDisplayName()}</strong> from the shelf?
        </Text>
        <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
          The bottle will remain in your collection but will no longer be on any shelf.
        </Alert>
        <Group justify="flex-end" mt="md">
          <Button
            variant="subtle"
            onClick={() => setRemoveFromShelfModalOpen(false)}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            color="orange"
            onClick={handleRemoveFromShelf}
            loading={processing}
          >
            Remove from Shelf
          </Button>
        </Group>
      </Stack>
    </Modal>

    {/* Mark as Complete Modal */}
    <Modal
      opened={markCompleteModalOpen}
      onClose={() => {
        setMarkCompleteModalOpen(false)
        setRating(bottle.rating ?? '')
      }}
      title="Mark as Complete"
      centered
    >
      <Stack gap="md">
        <Text>
          Mark <strong>{getProductDisplayName()}</strong> as finished?
        </Text>
        <Alert icon={<IconCheck size={16} />} color="green" variant="light">
          This will:
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
            <li>Set the finish date to today</li>
            <li>Set amount remaining to 0%</li>
            <li>Remove the bottle from its shelf</li>
          </ul>
        </Alert>
        <NumberInput
          label="Rating (Optional)"
          placeholder="Rate 1-10"
          value={rating}
          onChange={(value) => setRating(typeof value === 'number' ? value : '')}
          min={1}
          max={10}
          allowDecimal={false}
        />
        <Group justify="flex-end" mt="md">
          <Button
            variant="subtle"
            onClick={() => {
              setMarkCompleteModalOpen(false)
              setRating(bottle.rating ?? '')
            }}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMarkComplete}
            loading={processing}
            style={{ background: 'var(--color-wine)' }}
          >
            Mark as Complete
          </Button>
        </Group>
      </Stack>
    </Modal>

    {/* Image Upload/Replace Modal */}
    <Modal
      opened={imageModalOpen}
      onClose={() => setImageModalOpen(false)}
      title={bottle?.imageUrl ? 'Replace Bottle Photo' : 'Add Bottle Photo'}
      size="lg"
      centered
    >
      <Stack gap="md">
        {!updatingImage && (
          <ImageUpload
            currentImageUrl={bottle?.imageUrl}
            onImageUploaded={handleImageUploaded}
            onImageRemoved={handleImageRemoved}
            label=""
            description=""
          />
        )}
        {updatingImage && (
          <Box py="xl" style={{ textAlign: 'center' }}>
            <Text c="dimmed">Updating photo...</Text>
          </Box>
        )}
      </Stack>
    </Modal>
    </Box>
  )
}
