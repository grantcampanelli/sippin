import { v2 as cloudinary } from 'cloudinary'

let isConfigured = false

/**
 * Initialize Cloudinary with credentials (lazy initialization)
 */
function ensureConfigured() {
  if (isConfigured) return
  
  if (!process.env.CLOUDINARY_URL) {
    throw new Error('CLOUDINARY_URL environment variable is not set')
  }
  
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
  })
  
  isConfigured = true
}

/**
 * Get Cloudinary instance (configures on first use)
 */
export function getCloudinary() {
  ensureConfigured()
  return cloudinary
}

/**
 * Generate a signature for client-side uploads
 * This allows secure uploads directly from the browser
 */
export function generateUploadSignature(folder: string = 'bottles') {
  ensureConfigured()
  
  const timestamp = Math.round(Date.now() / 1000)
  const uploadPreset = 'bottle_images' // You can create this in Cloudinary dashboard
  
  // Get API credentials
  const apiSecret = cloudinary.config().api_secret
  
  if (!apiSecret) {
    throw new Error('Cloudinary API secret not found')
  }
  
  // Parameters to sign
  const paramsToSign = {
    timestamp,
    folder,
    upload_preset: uploadPreset
  }
  
  // Generate signature
  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret)
  
  return {
    signature,
    timestamp,
    folder,
    upload_preset: uploadPreset,
    cloud_name: cloudinary.config().cloud_name,
    api_key: cloudinary.config().api_key
  }
}

/**
 * Upload an image to Cloudinary from server-side
 * Accepts base64 data or file buffer
 */
export async function uploadImage(
  imageData: string,
  options: {
    folder?: string
    publicId?: string
    transformation?: any
  } = {}
): Promise<{ url: string; publicId: string; secureUrl: string }> {
  ensureConfigured()
  
  try {
    const result = await cloudinary.uploader.upload(imageData, {
      folder: options.folder || 'bottles',
      public_id: options.publicId,
      transformation: options.transformation || [
        { width: 1200, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      resource_type: 'image'
    })
    
    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error)
    throw new Error('Failed to upload image')
  }
}

/**
 * Delete an image from Cloudinary
 * @param publicIdOrUrl - Public ID or full Cloudinary URL
 */
export async function deleteImage(publicIdOrUrl: string): Promise<boolean> {
  ensureConfigured()
  
  try {
    // Extract public ID from URL if needed
    let publicId = publicIdOrUrl
    
    if (publicIdOrUrl.includes('cloudinary.com')) {
      // Extract public_id from URL
      // URL format: https://res.cloudinary.com/[cloud]/image/upload/v[version]/[folder]/[public_id].[ext]
      const urlParts = publicIdOrUrl.split('/')
      const uploadIndex = urlParts.indexOf('upload')
      
      if (uploadIndex !== -1 && urlParts.length > uploadIndex + 1) {
        // Get everything after 'upload/v[version]/' or 'upload/'
        const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/')
        // Remove file extension
        publicId = pathAfterUpload.replace(/\.[^.]+$/, '')
      }
    }
    
    const result = await cloudinary.uploader.destroy(publicId)
    return result.result === 'ok'
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    return false
  }
}

/**
 * Generate optimized image URL with transformations
 */
export function getOptimizedUrl(
  publicIdOrUrl: string,
  options: {
    width?: number
    height?: number
    crop?: string
    quality?: string
    format?: string
  } = {}
): string {
  ensureConfigured()
  
  try {
    // If it's already a full URL, extract public ID
    let publicId = publicIdOrUrl
    
    if (publicIdOrUrl.includes('cloudinary.com')) {
      const urlParts = publicIdOrUrl.split('/')
      const uploadIndex = urlParts.indexOf('upload')
      
      if (uploadIndex !== -1 && urlParts.length > uploadIndex + 1) {
        const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/')
        publicId = pathAfterUpload.replace(/\.[^.]+$/, '')
      }
    }
    
    return cloudinary.url(publicId, {
      transformation: [
        {
          width: options.width,
          height: options.height,
          crop: options.crop || 'limit',
          quality: options.quality || 'auto:good',
          fetch_format: options.format || 'auto'
        }
      ],
      secure: true
    })
  } catch (error) {
    console.error('Error generating optimized URL:', error)
    return publicIdOrUrl
  }
}

/**
 * Get thumbnail URL (small preview image)
 */
export function getThumbnailUrl(publicIdOrUrl: string): string {
  return getOptimizedUrl(publicIdOrUrl, {
    width: 300,
    height: 300,
    crop: 'fill',
    quality: 'auto'
  })
}

/**
 * Get full-size optimized URL
 */
export function getFullSizeUrl(publicIdOrUrl: string): string {
  return getOptimizedUrl(publicIdOrUrl, {
    width: 1200,
    quality: 'auto:good'
  })
}

/**
 * Validate if a URL is a valid Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary')
}

export default cloudinary
