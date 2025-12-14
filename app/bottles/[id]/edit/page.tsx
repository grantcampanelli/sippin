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
  NumberInput,
  Button,
  Group,
  Box,
  Divider,
  Switch,
  Select,
  Loader,
  Alert
} from '@mantine/core'
import { IconArrowLeft, IconAlertCircle, IconCheck } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import Link from 'next/link'
import { ImageUpload } from '@/components/bottles/ImageUpload'

interface Bottle {
  id: string
  size: number | null
  servingSize: number | null
  purchasePrice: number | null
  purchaseCurrency: string | null
  purchaseDate: string | null
  purchaseLocation: string | null
  openDate: string | null
  finished: boolean
  finishDate: string | null
  amountRemaining: number | null
  notes: string | null
  rating: number | null
  imageUrl: string | null
  barcode: string | null
  giftFrom: string | null
  giftOccasion: string | null
  giftDate: string | null
  estimatedValue: number | null
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
    shelf: {
      name: string
      stash: {
        name: string
      } | null
    }
  } | null
}

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
]

export default function EditBottlePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bottle, setBottle] = useState<Bottle | null>(null)

  // Form state
  const [size, setSize] = useState<number | ''>('')
  const [servingSize, setServingSize] = useState<number | ''>('')
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('')
  const [purchaseCurrency, setPurchaseCurrency] = useState<string | null>(null)
  const [purchaseDate, setPurchaseDate] = useState('')
  const [purchaseLocation, setPurchaseLocation] = useState('')
  const [openDate, setOpenDate] = useState('')
  const [finished, setFinished] = useState(false)
  const [finishDate, setFinishDate] = useState('')
  const [amountRemaining, setAmountRemaining] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState<number | ''>('')
  const [imageUrl, setImageUrl] = useState('')
  const [barcode, setBarcode] = useState('')
  const [giftFrom, setGiftFrom] = useState('')
  const [giftOccasion, setGiftOccasion] = useState('')
  const [giftDate, setGiftDate] = useState('')
  const [estimatedValue, setEstimatedValue] = useState<number | ''>('')

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
        const data: Bottle = await response.json()
        setBottle(data)
        
        // Populate form fields
        setSize(data.size ?? '')
        setServingSize(data.servingSize ?? '')
        setPurchasePrice(data.purchasePrice ?? '')
        setPurchaseCurrency(data.purchaseCurrency || 'USD')
        setPurchaseDate(data.purchaseDate ? new Date(data.purchaseDate).toISOString().split('T')[0] : '')
        setPurchaseLocation(data.purchaseLocation || '')
        setOpenDate(data.openDate ? new Date(data.openDate).toISOString().split('T')[0] : '')
        setFinished(data.finished)
        setFinishDate(data.finishDate ? new Date(data.finishDate).toISOString().split('T')[0] : '')
        setAmountRemaining(data.amountRemaining ?? '')
        setNotes(data.notes || '')
        setRating(data.rating ?? '')
        setImageUrl(data.imageUrl || '')
        setBarcode(data.barcode || '')
        setGiftFrom(data.giftFrom || '')
        setGiftOccasion(data.giftOccasion || '')
        setGiftDate(data.giftDate ? new Date(data.giftDate).toISOString().split('T')[0] : '')
        setEstimatedValue(data.estimatedValue ?? '')
      } else if (response.status === 404) {
        router.push('/bottles')
      }
    } catch (error) {
      console.error('Error fetching bottle:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load bottle',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setSaving(true)
    try {
      const response = await fetch(`/api/bottles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          size: size === '' ? null : size,
          servingSize: servingSize === '' ? null : servingSize,
          purchasePrice: purchasePrice === '' ? null : purchasePrice,
          purchaseCurrency: purchaseCurrency || null,
          purchaseDate: purchaseDate || null,
          purchaseLocation: purchaseLocation || null,
          openDate: openDate || null,
          finished,
          finishDate: finishDate || null,
          amountRemaining: amountRemaining === '' ? null : amountRemaining,
          notes: notes || null,
          rating: rating === '' ? null : rating,
          imageUrl: imageUrl || null,
          barcode: barcode || null,
          giftFrom: giftFrom || null,
          giftOccasion: giftOccasion || null,
          giftDate: giftDate || null,
          estimatedValue: estimatedValue === '' ? null : estimatedValue,
        }),
      })

      if (response.ok) {
        const updatedBottle = await response.json()
        notifications.show({
          title: 'Bottle updated!',
          message: 'Your bottle has been updated successfully',
          color: 'green',
          icon: <IconCheck size={16} />,
        })
        router.push(`/bottles/${id}`)
      } else {
        const error = await response.json()
        notifications.show({
          title: 'Error updating bottle',
          message: error.error || 'Failed to update bottle',
          color: 'red',
        })
      }
    } catch (error) {
      console.error('Error updating bottle:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to update bottle',
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

  if (!bottle) {
    return (
      <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Bottle not found">
          The bottle you're looking for doesn't exist or you don't have permission to access it.
        </Alert>
      </Box>
    )
  }

  const getProductDisplayName = () => {
    if (bottle.product.brand.type === 'WINE' && bottle.product.wineData?.vintage) {
      return `${bottle.product.wineData.vintage} ${bottle.product.name}`
    }
    return bottle.product.name
  }

  return (
    <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)' }}>
      <Container size="md" py="xl">
        <Group mb="xl">
          <Link href={`/bottles/${id}`} style={{ textDecoration: 'none' }}>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              style={{ color: 'var(--color-wine)' }}
            >
              Back to Bottle
            </Button>
          </Link>
        </Group>

        <form onSubmit={handleSubmit}>
          <Stack gap="xl">
            {/* Product Info (Read-only) */}
            <Card 
              padding="xl" 
              radius="md" 
              withBorder
              style={{ 
                borderColor: 'var(--color-beige)',
                background: 'white'
              }}
            >
              <Title order={2} mb="xs" style={{ color: 'var(--color-burgundy)' }}>
                {getProductDisplayName()}
              </Title>
              <Text c="dimmed" size="sm">
                {bottle.product.brand.name} • {bottle.product.brand.type}
              </Text>
            </Card>

            {/* Physical Properties */}
            <Card 
              padding="xl" 
              radius="md" 
              withBorder
              style={{ 
                borderColor: 'var(--color-beige)',
                background: 'white'
              }}
            >
              <Title order={3} mb="md" style={{ color: 'var(--color-burgundy)' }}>
                Physical Properties
              </Title>
              
              <Stack gap="md">
                <Group grow>
                  <NumberInput
                    label="Size (ml)"
                    placeholder="e.g., 750"
                    value={size}
                    onChange={(value) => setSize(typeof value === 'number' ? value : '')}
                    min={0}
                    allowDecimal={true}
                  />
                  <NumberInput
                    label="Serving Size (ml)"
                    placeholder="e.g., 150"
                    value={servingSize}
                    onChange={(value) => setServingSize(typeof value === 'number' ? value : '')}
                    min={0}
                    allowDecimal={true}
                  />
                </Group>
                <TextInput
                  label="Barcode"
                  placeholder="Optional barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
              </Stack>
            </Card>

            {/* Purchase Information */}
            <Card 
              padding="xl" 
              radius="md" 
              withBorder
              style={{ 
                borderColor: 'var(--color-beige)',
                background: 'white'
              }}
            >
              <Title order={3} mb="md" style={{ color: 'var(--color-burgundy)' }}>
                Purchase Information
              </Title>
              
              <Stack gap="md">
                <Group grow>
                  <NumberInput
                    label="Purchase Price"
                    placeholder="0.00"
                    value={purchasePrice}
                    onChange={(value) => setPurchasePrice(typeof value === 'number' ? value : '')}
                    min={0}
                    allowDecimal={true}
                    leftSection="$"
                  />
                  <Select
                    label="Currency"
                    data={CURRENCIES}
                    value={purchaseCurrency}
                    onChange={setPurchaseCurrency}
                  />
                </Group>
                <Group grow>
                  <TextInput
                    label="Purchase Date"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                  />
                  <TextInput
                    label="Purchase Location"
                    placeholder="Store, online, etc."
                    value={purchaseLocation}
                    onChange={(e) => setPurchaseLocation(e.target.value)}
                  />
                </Group>
              </Stack>
            </Card>

            {/* Consumption Tracking */}
            <Card 
              padding="xl" 
              radius="md" 
              withBorder
              style={{ 
                borderColor: 'var(--color-beige)',
                background: 'white'
              }}
            >
              <Title order={3} mb="md" style={{ color: 'var(--color-burgundy)' }}>
                Consumption Tracking
              </Title>
              
              <Stack gap="md">
                <Group grow>
                  <TextInput
                    label="Open Date"
                    type="date"
                    value={openDate}
                    onChange={(e) => setOpenDate(e.target.value)}
                  />
                  <NumberInput
                    label="Amount Remaining (%)"
                    placeholder="0-100"
                    value={amountRemaining}
                    onChange={(value) => setAmountRemaining(typeof value === 'number' ? value : '')}
                    min={0}
                    max={100}
                    allowDecimal={true}
                  />
                </Group>
                <Switch
                  label="Finished"
                  checked={finished}
                  onChange={(e) => setFinished(e.currentTarget.checked)}
                  styles={{
                    label: { color: 'var(--color-brown)', fontWeight: 500 }
                  }}
                />
                {finished && (
                  <TextInput
                    label="Finish Date"
                    type="date"
                    value={finishDate}
                    onChange={(e) => setFinishDate(e.target.value)}
                  />
                )}
              </Stack>
            </Card>

            {/* Personal Notes & Rating */}
            <Card 
              padding="xl" 
              radius="md" 
              withBorder
              style={{ 
                borderColor: 'var(--color-beige)',
                background: 'white'
              }}
            >
              <Title order={3} mb="md" style={{ color: 'var(--color-burgundy)' }}>
                Personal Notes & Rating
              </Title>
              
              <Stack gap="md">
                <NumberInput
                  label="Rating (1-10)"
                  placeholder="Your rating"
                  value={rating}
                  onChange={(value) => setRating(typeof value === 'number' ? value : '')}
                  min={1}
                  max={10}
                  allowDecimal={false}
                />
                <Textarea
                  label="Notes"
                  placeholder="Your personal notes about this bottle..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  minRows={4}
                />
                <ImageUpload
                  currentImageUrl={imageUrl || null}
                  onImageUploaded={(url) => setImageUrl(url)}
                  onImageRemoved={() => setImageUrl('')}
                  label="Bottle Photo"
                  description="Upload or replace the bottle photo"
                />
              </Stack>
            </Card>

            {/* Gift Information */}
            <Card 
              padding="xl" 
              radius="md" 
              withBorder
              style={{ 
                borderColor: 'var(--color-beige)',
                background: 'white'
              }}
            >
              <Title order={3} mb="md" style={{ color: 'var(--color-burgundy)' }}>
                Gift Information
              </Title>
              
              <Stack gap="md">
                <TextInput
                  label="Gift From"
                  placeholder="Who gave you this bottle"
                  value={giftFrom}
                  onChange={(e) => setGiftFrom(e.target.value)}
                />
                <Group grow>
                  <TextInput
                    label="Gift Occasion"
                    placeholder="Birthday, holiday, etc."
                    value={giftOccasion}
                    onChange={(e) => setGiftOccasion(e.target.value)}
                  />
                  <TextInput
                    label="Gift Date"
                    type="date"
                    value={giftDate}
                    onChange={(e) => setGiftDate(e.target.value)}
                  />
                </Group>
              </Stack>
            </Card>

            {/* Valuation */}
            <Card 
              padding="xl" 
              radius="md" 
              withBorder
              style={{ 
                borderColor: 'var(--color-beige)',
                background: 'white'
              }}
            >
              <Title order={3} mb="md" style={{ color: 'var(--color-burgundy)' }}>
                Valuation
              </Title>
              
              <NumberInput
                label="Estimated Value"
                placeholder="Current estimated market value"
                value={estimatedValue}
                onChange={(value) => setEstimatedValue(typeof value === 'number' ? value : '')}
                min={0}
                allowDecimal={true}
                leftSection="$"
              />
            </Card>

            {/* Actions */}
            <Group justify="flex-end">
              <Link href={`/bottles/${id}`} style={{ textDecoration: 'none' }}>
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

