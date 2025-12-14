import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadImage } from '@/lib/cloudinary'
import sharp from 'sharp'

/**
 * Server-side image upload endpoint
 * This is a fallback for when client-side uploads aren't available
 * Also handles image optimization before uploading
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { image, folder = 'bottles' } = body

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      )
    }

    // Convert base64 to buffer for optimization
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const inputBuffer = Buffer.from(base64Data, 'base64')

    // Optimize image using sharp
    // Resize to max 1200px width, compress with 85% quality
    const imageBuffer = await sharp(inputBuffer)
      .resize(1200, 1200, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .jpeg({ quality: 85 })
      .toBuffer()

    // Convert optimized buffer back to base64 for Cloudinary upload
    const optimizedBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`

    // Upload to Cloudinary
    const result = await uploadImage(optimizedBase64, {
      folder,
      transformation: {
        quality: 'auto:good',
        fetch_format: 'auto'
      }
    })

    return NextResponse.json({
      url: result.secureUrl,
      publicId: result.publicId
    })
  } catch (error: any) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    )
  }
}
