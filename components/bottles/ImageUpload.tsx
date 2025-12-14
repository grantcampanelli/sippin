'use client'

import { useState, useRef } from 'react'
import {
  Box,
  Button,
  Group,
  Stack,
  Text,
  Progress,
  Image,
  ActionIcon,
  Paper
} from '@mantine/core'
import { IconCamera, IconUpload, IconX, IconCheck } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'

interface ImageUploadProps {
  currentImageUrl?: string | null
  onImageUploaded: (url: string) => void
  onImageRemoved?: () => void
  label?: string
  description?: string
}

export function ImageUpload({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  label = 'Bottle Photo',
  description = 'Upload a photo of your bottle'
}: ImageUploadProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(currentImageUrl || null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Optimize image on client-side before uploading
   * Resize to max 1200px width and compress to reduce file size
   */
  const optimizeImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const img = document.createElement('img')
        img.src = e.target?.result as string
        
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          
          // Resize if width is greater than 1200px
          const maxWidth = 1200
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
          
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }
          
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to JPEG with 85% quality
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85)
          resolve(optimizedDataUrl)
        }
        
        img.onerror = () => {
          reject(new Error('Failed to load image'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsDataURL(file)
    })
  }

  /**
   * Upload image to Cloudinary via our API
   */
  const uploadToCloudinary = async (imageData: string): Promise<string> => {
    try {
      const response = await fetch('/api/upload/bottle-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          folder: 'bottles'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      return result.url
    } catch (error: any) {
      console.error('Upload error:', error)
      throw error
    }
  }

  /**
   * Handle file selection from input
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      notifications.show({
        title: 'Invalid file',
        message: 'Please select an image file',
        color: 'red'
      })
      return
    }

    // Validate file size (max 10MB before optimization)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      notifications.show({
        title: 'File too large',
        message: 'Please select an image smaller than 10MB',
        color: 'red'
      })
      return
    }

    try {
      setUploading(true)
      setUploadProgress(10)

      // Optimize image
      const optimizedImage = await optimizeImage(file)
      setUploadProgress(30)
      
      // Show preview
      setPreviewImage(optimizedImage)
      setUploadProgress(50)

      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(optimizedImage)
      setUploadProgress(90)

      // Success
      onImageUploaded(cloudinaryUrl)
      setUploadProgress(100)
      
      notifications.show({
        title: 'Image uploaded!',
        message: 'Your bottle photo has been uploaded',
        color: 'green',
        icon: <IconCheck size={16} />
      })
    } catch (error: any) {
      console.error('Error handling file:', error)
      notifications.show({
        title: 'Upload failed',
        message: error.message || 'Failed to upload image',
        color: 'red'
      })
      setPreviewImage(currentImageUrl || null)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  /**
   * Handle remove image
   */
  const handleRemove = () => {
    setPreviewImage(null)
    if (onImageRemoved) {
      onImageRemoved()
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Stack gap="sm">
      {label && (
        <Text size="sm" fw={500} style={{ color: 'var(--color-burgundy)' }}>
          {label}
        </Text>
      )}
      
      {description && (
        <Text size="xs" c="dimmed">
          {description}
        </Text>
      )}

      {/* Preview or Upload Area */}
      {previewImage ? (
        <Paper
          p="md"
          withBorder
          style={{
            borderColor: 'var(--color-beige)',
            background: 'white',
            position: 'relative'
          }}
        >
          <Box style={{ position: 'relative' }}>
            <Image
              src={previewImage}
              alt="Bottle preview"
              fit="contain"
              h={300}
              style={{ borderRadius: '8px' }}
            />
            
            {!uploading && (
              <ActionIcon
                variant="filled"
                color="red"
                size="lg"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8
                }}
                onClick={handleRemove}
              >
                <IconX size={20} />
              </ActionIcon>
            )}
          </Box>

          {uploading && (
            <Box mt="md">
              <Text size="sm" c="dimmed" mb="xs">
                Uploading... {uploadProgress}%
              </Text>
              <Progress value={uploadProgress} color="wine" />
            </Box>
          )}

          {!uploading && (
            <Group mt="md" gap="sm">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <Button
                variant="outline"
                size="sm"
                leftSection={<IconUpload size={16} />}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  borderColor: 'var(--color-wine)',
                  color: 'var(--color-wine)'
                }}
              >
                Replace Photo
              </Button>
            </Group>
          )}
        </Paper>
      ) : (
        <Paper
          p="xl"
          withBorder
          style={{
            borderColor: 'var(--color-beige)',
            background: 'white',
            textAlign: 'center',
            borderStyle: 'dashed'
          }}
        >
          <Stack gap="md" align="center">
            <IconCamera size={48} style={{ color: 'var(--color-wine)', opacity: 0.5 }} />
            <Text size="sm" c="dimmed">
              No photo uploaded yet
            </Text>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            <Group gap="sm">
              <Button
                leftSection={<IconCamera size={16} />}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'var(--gradient-wine)',
                  color: 'white'
                }}
              >
                Take Photo
              </Button>
              <Button
                variant="outline"
                leftSection={<IconUpload size={16} />}
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute('capture')
                    fileInputRef.current.click()
                  }
                }}
                style={{
                  borderColor: 'var(--color-wine)',
                  color: 'var(--color-wine)'
                }}
              >
                Upload File
              </Button>
            </Group>
          </Stack>
        </Paper>
      )}

      {uploading && !previewImage && (
        <Box>
          <Text size="sm" c="dimmed" mb="xs">
            Processing... {uploadProgress}%
          </Text>
          <Progress value={uploadProgress} color="wine" />
        </Box>
      )}
    </Stack>
  )
}
