'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Card,
  Group,
  Badge,
  Loader,
  Alert,
  Box,
  Divider,
  TextInput,
  Select,
  NumberInput,
  Textarea,
  Modal,
  ActionIcon,
  Collapse,
} from '@mantine/core'
import {
  IconCamera,
  IconUpload,
  IconRefresh,
  IconCheck,
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp,
  IconX,
  IconPlus,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useForm } from '@mantine/form'
import Link from 'next/link'

interface ParsedData {
  brandName?: string
  productName?: string
  vintage?: string
  type?: 'WINE' | 'SPIRIT' | 'BEER'
  varietal?: string
  region?: string
  abv?: number
  ageStatement?: string
  style?: string
}

interface Product {
  id: string
  name: string
  brand: {
    id: string
    name: string
    type: string
  }
  wineData?: {
    vintage?: string
    varietal?: string
    region?: string
  } | null
  spiritData?: {
    style?: string
    ageStatement?: string
  } | null
  matchScore?: number
}

interface Brand {
  id: string
  name: string
  type: string
}

type ScanState = 'initial' | 'capturing' | 'processing' | 'results' | 'creating' | 'bottle-details'

export default function ScanBottlePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [scanState, setScanState] = useState<ScanState>('initial')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<string>('')
  const [parsedData, setParsedData] = useState<ParsedData>({})
  const [matches, setMatches] = useState<Product[]>([])
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('low')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showExtractedText, setShowExtractedText] = useState(false)
  const [showAllMatches, setShowAllMatches] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [creatingBrand, setCreatingBrand] = useState(false)
  const [creatingProduct, setCreatingProduct] = useState(false)
  const [showBrandForm, setShowBrandForm] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // Form for creating new brand
  const brandForm = useForm({
    initialValues: {
      name: '',
      type: 'WINE' as 'WINE' | 'SPIRIT' | 'BEER',
    },
    validate: {
      name: (value) => (!value ? 'Brand name is required' : null),
    },
  })

  // Form for creating new product
  const productForm = useForm({
    initialValues: {
      name: '',
      brandId: '',
      vintage: '',
      varietal: '',
      region: '',
    },
    validate: {
      name: (value) => (!value ? 'Product name is required' : null),
      brandId: (value) => (!value ? 'Brand is required' : null),
    },
  })

  // Form for bottle details
  const bottleForm = useForm({
    initialValues: {
      purchasePrice: '',
      purchaseDate: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (scanState === 'creating') {
      fetchBrands('')
    }
  }, [scanState])

  const fetchBrands = async (search: string) => {
    try {
      const response = await fetch(`/api/brands?search=${encodeURIComponent(search)}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setBrands(data)
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setCapturedImage(dataUrl)
      setScanState('capturing')
    }
    reader.readAsDataURL(file)
  }

  const handleRetake = () => {
    setCapturedImage(null)
    setExtractedText('')
    setParsedData({})
    setMatches([])
    setSelectedProduct(null)
    setError(null)
    setScanState('initial')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleScan = async () => {
    if (!capturedImage) return

    setScanState('processing')
    setError(null)

    try {
      const response = await fetch('/api/scan-bottle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: capturedImage }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan bottle')
      }

      setExtractedText(data.extractedText || '')
      setParsedData(data.parsedData || {})
      setMatches(data.matches || [])
      setConfidence(data.confidence || 'low')

      // Auto-select if high confidence
      if (data.confidence === 'high' && data.matches?.length > 0) {
        setSelectedProduct(data.matches[0])
        setShowAllMatches(false)
      } else if (data.matches?.length > 0) {
        setShowAllMatches(true)
      }

      setScanState('results')

      if (!data.extractedText) {
        notifications.show({
          title: 'No text detected',
          message: 'Try taking another photo with better lighting',
          color: 'yellow',
        })
      }
    } catch (error: any) {
      console.error('Scan error:', error)
      setError(error.message || 'Failed to scan bottle')
      setScanState('capturing')
      notifications.show({
        title: 'Scan failed',
        message: error.message || 'Please try again',
        color: 'red',
      })
    }
  }

  const handleCreateNew = () => {
    // Pre-fill forms with parsed data
    if (parsedData.brandName) {
      brandForm.setFieldValue('name', parsedData.brandName)
    }
    if (parsedData.type) {
      brandForm.setFieldValue('type', parsedData.type)
    }
    if (parsedData.productName) {
      productForm.setFieldValue('name', parsedData.productName)
    }
    if (parsedData.vintage) {
      productForm.setFieldValue('vintage', parsedData.vintage)
    }
    if (parsedData.varietal) {
      productForm.setFieldValue('varietal', parsedData.varietal)
    }
    if (parsedData.region) {
      productForm.setFieldValue('region', parsedData.region)
    }

    setScanState('creating')
  }

  const handleCreateBrand = async () => {
    if (!brandForm.validate().hasErrors) {
      setCreatingBrand(true)
      try {
        const response = await fetch('/api/brands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(brandForm.values),
        })
        
        if (response.ok) {
          const newBrand = await response.json()
          setBrands([...brands, newBrand])
          productForm.setFieldValue('brandId', newBrand.id)
          setShowBrandForm(false)
          brandForm.reset()
          notifications.show({
            title: 'Brand created',
            message: `${newBrand.name} has been created`,
            color: 'green',
          })
        } else {
          const error = await response.json()
          notifications.show({
            title: 'Error',
            message: error.error || 'Failed to create brand',
            color: 'red',
          })
        }
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to create brand',
          color: 'red',
        })
      } finally {
        setCreatingBrand(false)
      }
    }
  }

  const handleCreateProduct = async () => {
    if (!productForm.validate().hasErrors) {
      setCreatingProduct(true)
      try {
        const brand = brands.find((b) => b.id === productForm.values.brandId)
        const isWine = brand?.type === 'WINE'

        const wineData = isWine
          ? {
              vintage: productForm.values.vintage || null,
              varietal: productForm.values.varietal || null,
              region: productForm.values.region || null,
            }
          : undefined

        const spiritData = !isWine
          ? {
              style: productForm.values.varietal || parsedData.style || null,
              ageStatement: productForm.values.vintage || parsedData.ageStatement || null,
            }
          : undefined

        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: productForm.values.name,
            brandId: productForm.values.brandId,
            wineData,
            spiritData,
          }),
        })

        if (response.ok) {
          const newProduct = await response.json()
          setSelectedProduct(newProduct)
          setScanState('bottle-details')
          notifications.show({
            title: 'Product created',
            message: `${newProduct.name} has been added`,
            color: 'green',
          })
        } else {
          const error = await response.json()
          notifications.show({
            title: 'Error',
            message: error.error || 'Failed to create product',
            color: 'red',
          })
        }
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to create product',
          color: 'red',
        })
      } finally {
        setCreatingProduct(false)
      }
    }
  }

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product)
    setScanState('bottle-details')
  }

  const handleCreateBottle = async () => {
    if (!selectedProduct) return

    try {
      const bottleData = {
        productId: selectedProduct.id,
        purchasePrice: bottleForm.values.purchasePrice
          ? parseFloat(bottleForm.values.purchasePrice)
          : null,
        purchaseDate: bottleForm.values.purchaseDate
          ? new Date(bottleForm.values.purchaseDate).toISOString()
          : null,
        notes: bottleForm.values.notes || null,
        amountRemaining: 100,
      }

      const response = await fetch('/api/bottles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bottleData),
      })

      if (response.ok) {
        notifications.show({
          title: 'Bottle added',
          message: 'Bottle has been added to your inventory',
          color: 'green',
        })
        router.push('/bottles')
      } else {
        const error = await response.json()
        notifications.show({
          title: 'Error',
          message: error.error || 'Failed to add bottle',
          color: 'red',
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to add bottle',
        color: 'red',
      })
    }
  }

  if (status === 'loading') {
    return (
      <Box
        style={{
          minHeight: 'calc(100vh - 80px)',
          background: 'var(--color-cream)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loader size="lg" color="wine" />
      </Box>
    )
  }

  return (
    <Box style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--color-cream)' }}>
      <Container size="md" py="xl">
        <Stack gap="xl">
          {/* Header */}
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={1} mb="xs" style={{ color: 'var(--color-burgundy)' }}>
                Scan Bottle
              </Title>
              <Text size="lg" style={{ color: 'var(--color-brown)' }}>
                Take a photo to automatically identify your bottle
              </Text>
            </div>
            <Link href="/bottles" style={{ textDecoration: 'none' }}>
              <Button variant="subtle" color="wine">
                Back to Bottles
              </Button>
            </Link>
          </Group>

          {/* Initial / Capture State */}
          {(scanState === 'initial' || scanState === 'capturing') && (
            <Card
              padding="xl"
              radius="md"
              withBorder
              style={{
                borderColor: 'var(--color-beige)',
                background: 'white',
              }}
            >
              <Stack gap="lg" align="center">
                {!capturedImage ? (
                  <>
                    <IconCamera size={64} style={{ color: 'var(--color-wine)' }} />
                    <Text size="lg" fw={500} ta="center" style={{ color: 'var(--color-burgundy)' }}>
                      Capture Bottle Label
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      • Hold camera steady and ensure good lighting
                      <br />
                      • Center the label in frame
                      <br />
                      • Make sure text is clearly visible
                    </Text>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    <Button
                      size="lg"
                      leftSection={<IconCamera size={20} />}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: 'var(--gradient-wine)',
                        color: 'white',
                      }}
                    >
                      Take Photo
                    </Button>
                  </>
                ) : (
                  <>
                    <Box
                      style={{
                        width: '100%',
                        maxWidth: '500px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '2px solid var(--color-beige)',
                      }}
                    >
                      <img
                        src={capturedImage}
                        alt="Captured bottle"
                        style={{ width: '100%', display: 'block' }}
                      />
                    </Box>
                    <Group gap="md">
                      <Button
                        variant="outline"
                        leftSection={<IconRefresh size={18} />}
                        onClick={handleRetake}
                        style={{
                          borderColor: 'var(--color-wine)',
                          color: 'var(--color-wine)',
                        }}
                      >
                        Retake
                      </Button>
                      <Button
                        size="lg"
                        leftSection={<IconCheck size={20} />}
                        onClick={handleScan}
                        style={{
                          background: 'var(--gradient-wine)',
                          color: 'white',
                        }}
                      >
                        Scan Label
                      </Button>
                    </Group>
                  </>
                )}
              </Stack>
            </Card>
          )}

          {/* Processing State */}
          {scanState === 'processing' && (
            <Card
              padding="xl"
              radius="md"
              withBorder
              style={{
                borderColor: 'var(--color-beige)',
                background: 'white',
              }}
            >
              <Stack gap="lg" align="center">
                <Loader size="xl" color="wine" />
                <Text size="lg" fw={500} style={{ color: 'var(--color-burgundy)' }}>
                  Analyzing bottle label...
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  Extracting text and searching for matches
                </Text>
              </Stack>
            </Card>
          )}

          {/* Results State */}
          {scanState === 'results' && (
            <Stack gap="lg">
              {/* Confidence Badge */}
              <Group justify="center">
                <Badge
                  size="lg"
                  variant="light"
                  color={confidence === 'high' ? 'green' : confidence === 'medium' ? 'yellow' : 'gray'}
                >
                  {confidence === 'high' ? 'High Confidence Match' : 
                   confidence === 'medium' ? 'Medium Confidence' : 
                   'Low Confidence - Manual Review Needed'}
                </Badge>
              </Group>

              {/* Auto-selected product (high confidence) */}
              {confidence === 'high' && selectedProduct && !showAllMatches && (
                <Card
                  padding="lg"
                  radius="md"
                  withBorder
                  style={{
                    borderColor: 'var(--color-wine)',
                    borderWidth: 2,
                    background: 'white',
                  }}
                >
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Badge color="green" variant="light">
                        Best Match
                      </Badge>
                      {selectedProduct.matchScore && (
                        <Text size="sm" c="dimmed">
                          {selectedProduct.matchScore}% match
                        </Text>
                      )}
                    </Group>
                    <div>
                      <Text size="xl" fw={600} style={{ color: 'var(--color-burgundy)' }}>
                        {selectedProduct.brand.name} {selectedProduct.name}
                      </Text>
                      <Group gap="xs" mt="xs">
                        <Badge color={selectedProduct.brand.type === 'WINE' ? 'wine' : 'amber'}>
                          {selectedProduct.brand.type}
                        </Badge>
                        {selectedProduct.wineData?.vintage && (
                          <Badge variant="light">{selectedProduct.wineData.vintage}</Badge>
                        )}
                        {selectedProduct.wineData?.varietal && (
                          <Badge variant="light">{selectedProduct.wineData.varietal}</Badge>
                        )}
                        {selectedProduct.spiritData?.style && (
                          <Badge variant="light">{selectedProduct.spiritData.style}</Badge>
                        )}
                      </Group>
                    </div>
                    <Group gap="sm">
                      <Button
                        flex={1}
                        onClick={() => handleSelectProduct(selectedProduct)}
                        style={{
                          background: 'var(--gradient-wine)',
                          color: 'white',
                        }}
                      >
                        Confirm & Continue
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowAllMatches(true)}
                        style={{
                          borderColor: 'var(--color-wine)',
                          color: 'var(--color-wine)',
                        }}
                      >
                        See Other Options
                      </Button>
                    </Group>
                  </Stack>
                </Card>
              )}

              {/* Product matches list */}
              {(showAllMatches || confidence !== 'high') && matches.length > 0 && (
                <Card
                  padding="lg"
                  radius="md"
                  withBorder
                  style={{
                    borderColor: 'var(--color-beige)',
                    background: 'white',
                  }}
                >
                  <Stack gap="md">
                    <Text size="lg" fw={600} style={{ color: 'var(--color-burgundy)' }}>
                      Matching Products
                    </Text>
                    {matches.map((product) => (
                      <Card
                        key={product.id}
                        padding="md"
                        withBorder
                        style={{
                          borderColor: 'var(--color-beige)',
                          background: 'var(--color-cream)',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleSelectProduct(product)}
                      >
                        <Group justify="space-between" align="flex-start">
                          <div style={{ flex: 1 }}>
                            <Text fw={600} style={{ color: 'var(--color-burgundy)' }}>
                              {product.brand.name} {product.name}
                            </Text>
                            <Group gap="xs" mt="xs">
                              <Badge
                                size="sm"
                                color={product.brand.type === 'WINE' ? 'wine' : 'amber'}
                              >
                                {product.brand.type}
                              </Badge>
                              {product.wineData?.vintage && (
                                <Badge size="sm" variant="light">
                                  {product.wineData.vintage}
                                </Badge>
                              )}
                              {product.wineData?.varietal && (
                                <Badge size="sm" variant="light">
                                  {product.wineData.varietal}
                                </Badge>
                              )}
                            </Group>
                          </div>
                          {product.matchScore && (
                            <Badge color="gray" variant="light">
                              {product.matchScore}%
                            </Badge>
                          )}
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </Card>
              )}

              {/* Extracted text toggle */}
              {extractedText && (
                <Card
                  padding="md"
                  radius="md"
                  withBorder
                  style={{
                    borderColor: 'var(--color-beige)',
                    background: 'white',
                  }}
                >
                  <Group
                    justify="space-between"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowExtractedText(!showExtractedText)}
                  >
                    <Text size="sm" fw={500} style={{ color: 'var(--color-burgundy)' }}>
                      View Extracted Text
                    </Text>
                    <ActionIcon variant="subtle" color="wine">
                      {showExtractedText ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                    </ActionIcon>
                  </Group>
                  <Collapse in={showExtractedText}>
                    <Box
                      mt="md"
                      p="sm"
                      style={{
                        background: 'var(--color-cream)',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {extractedText}
                    </Box>
                  </Collapse>
                </Card>
              )}

              {/* Action buttons */}
              <Group gap="md" justify="center">
                <Button variant="outline" onClick={handleRetake} leftSection={<IconRefresh size={18} />}>
                  Scan Another
                </Button>
                <Button
                  variant="filled"
                  onClick={handleCreateNew}
                  leftSection={<IconPlus size={18} />}
                  style={{
                    background: 'var(--gradient-wine)',
                    color: 'white',
                  }}
                >
                  Create New Product
                </Button>
              </Group>
            </Stack>
          )}

          {/* Creating New Product State */}
          {scanState === 'creating' && (
            <Stack gap="lg">
              <Card
                padding="lg"
                radius="md"
                withBorder
                style={{
                  borderColor: 'var(--color-beige)',
                  background: 'white',
                }}
              >
                <Stack gap="lg">
                  <div>
                    <Text size="lg" fw={600} mb="xs" style={{ color: 'var(--color-burgundy)' }}>
                      Create New Product
                    </Text>
                    <Text size="sm" c="dimmed">
                      Fill in the details below. We've pre-filled what we detected from the label.
                    </Text>
                  </div>

                  <Divider label="Brand" labelPosition="center" />

                  {!showBrandForm ? (
                    <Group gap="xs">
                      <Select
                        label="Select Brand"
                        placeholder="Search or select brand"
                        data={brands.map((b) => ({ value: b.id, label: b.name }))}
                        searchable
                        style={{ flex: 1 }}
                        onSearchChange={(value) => {
                          if (value) fetchBrands(value)
                        }}
                        value={productForm.values.brandId || null}
                        onChange={(value) => productForm.setFieldValue('brandId', value || '')}
                      />
                      <Button
                        variant="outline"
                        onClick={() => setShowBrandForm(true)}
                        style={{
                          borderColor: 'var(--color-wine)',
                          color: 'var(--color-wine)',
                          marginTop: '24px',
                        }}
                      >
                        + New Brand
                      </Button>
                    </Group>
                  ) : (
                    <Card
                      padding="md"
                      withBorder
                      style={{ borderColor: 'var(--color-beige)', background: 'var(--color-cream)' }}
                    >
                      <Stack gap="sm">
                        <Group justify="space-between">
                          <Text size="sm" fw={500} style={{ color: 'var(--color-burgundy)' }}>
                            Create New Brand
                          </Text>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            onClick={() => setShowBrandForm(false)}
                          >
                            <IconX size={16} />
                          </ActionIcon>
                        </Group>
                        <TextInput
                          placeholder="Brand name"
                          {...brandForm.getInputProps('name')}
                        />
                        <Select
                          placeholder="Type"
                          data={[
                            { value: 'WINE', label: 'Wine' },
                            { value: 'SPIRIT', label: 'Spirit' },
                            { value: 'BEER', label: 'Beer' },
                          ]}
                          {...brandForm.getInputProps('type')}
                        />
                        <Button
                          size="sm"
                          onClick={handleCreateBrand}
                          loading={creatingBrand}
                          style={{
                            background: 'var(--gradient-wine)',
                            color: 'white',
                          }}
                        >
                          Create Brand
                        </Button>
                      </Stack>
                    </Card>
                  )}

                  {productForm.values.brandId && (
                    <>
                      <Divider label="Product Details" labelPosition="center" />

                      <TextInput
                        label="Product Name"
                        placeholder="e.g., Cabernet Sauvignon, Reserve Blend"
                        required
                        {...productForm.getInputProps('name')}
                      />

                      {(() => {
                        const selectedBrand = brands.find((b) => b.id === productForm.values.brandId)
                        const isWine = selectedBrand?.type === 'WINE'

                        return isWine ? (
                          <>
                            <Select
                              label="Vintage"
                              placeholder="Select year"
                              data={Array.from({ length: 50 }, (_, i) => {
                                const year = new Date().getFullYear() - i
                                return { value: year.toString(), label: year.toString() }
                              })}
                              searchable
                              {...productForm.getInputProps('vintage')}
                            />
                            <TextInput
                              label="Varietal"
                              placeholder="e.g., Cabernet Sauvignon"
                              {...productForm.getInputProps('varietal')}
                            />
                            <TextInput
                              label="Region"
                              placeholder="e.g., Napa Valley"
                              {...productForm.getInputProps('region')}
                            />
                          </>
                        ) : (
                          <>
                            <TextInput
                              label="Style"
                              placeholder="e.g., Single Malt, Bourbon"
                              {...productForm.getInputProps('varietal')}
                            />
                            <TextInput
                              label="Age Statement (optional)"
                              placeholder="e.g., 12 Year"
                              {...productForm.getInputProps('vintage')}
                            />
                          </>
                        )
                      })()}

                      <Group gap="md">
                        <Button variant="outline" onClick={() => setScanState('results')}>
                          Back
                        </Button>
                        <Button
                          flex={1}
                          onClick={handleCreateProduct}
                          loading={creatingProduct}
                          style={{
                            background: 'var(--gradient-wine)',
                            color: 'white',
                          }}
                        >
                          Create Product & Continue
                        </Button>
                      </Group>
                    </>
                  )}
                </Stack>
              </Card>
            </Stack>
          )}

          {/* Bottle Details State */}
          {scanState === 'bottle-details' && selectedProduct && (
            <Stack gap="lg">
              <Card
                padding="lg"
                radius="md"
                withBorder
                style={{
                  borderColor: 'var(--color-wine)',
                  borderWidth: 2,
                  background: 'white',
                }}
              >
                <Stack gap="md">
                  <Group justify="space-between">
                    <Badge color="green" variant="light">
                      Selected Product
                    </Badge>
                  </Group>
                  <Text size="xl" fw={600} style={{ color: 'var(--color-burgundy)' }}>
                    {selectedProduct.brand.name} {selectedProduct.name}
                  </Text>
                  <Group gap="xs">
                    <Badge color={selectedProduct.brand.type === 'WINE' ? 'wine' : 'amber'}>
                      {selectedProduct.brand.type}
                    </Badge>
                    {selectedProduct.wineData?.vintage && (
                      <Badge variant="light">{selectedProduct.wineData.vintage}</Badge>
                    )}
                    {selectedProduct.wineData?.varietal && (
                      <Badge variant="light">{selectedProduct.wineData.varietal}</Badge>
                    )}
                  </Group>
                </Stack>
              </Card>

              <Card
                padding="lg"
                radius="md"
                withBorder
                style={{
                  borderColor: 'var(--color-beige)',
                  background: 'white',
                }}
              >
                <Stack gap="lg">
                  <div>
                    <Text size="lg" fw={600} mb="xs" style={{ color: 'var(--color-burgundy)' }}>
                      Bottle Details (Optional)
                    </Text>
                    <Text size="sm" c="dimmed">
                      Add purchase information and notes
                    </Text>
                  </div>

                  <Group grow>
                    <NumberInput
                      label="Purchase Price"
                      placeholder="0.00"
                      prefix="$"
                      decimalScale={2}
                      fixedDecimalScale
                      {...bottleForm.getInputProps('purchasePrice')}
                    />
                    <TextInput
                      label="Purchase Date"
                      type="date"
                      {...bottleForm.getInputProps('purchaseDate')}
                    />
                  </Group>

                  <Textarea
                    label="Notes"
                    placeholder="Add any notes about this bottle..."
                    rows={3}
                    {...bottleForm.getInputProps('notes')}
                  />

                  <Group gap="md">
                    <Button variant="outline" onClick={() => setScanState('results')}>
                      Back
                    </Button>
                    <Button
                      flex={1}
                      onClick={handleCreateBottle}
                      style={{
                        background: 'var(--gradient-wine)',
                        color: 'white',
                      }}
                    >
                      Add to Inventory
                    </Button>
                  </Group>
                </Stack>
              </Card>
            </Stack>
          )}

          {/* Error Display */}
          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Error"
              color="red"
              withCloseButton
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
        </Stack>
      </Container>
    </Box>
  )
}

