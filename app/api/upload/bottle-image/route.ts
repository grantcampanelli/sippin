import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadImage } from '@/lib/cloudinary'
import sharp from 'sharp'

// Limit payload before sharp decodes — a 25 MB base64 string is ~18 MB binary,
// which is plenty of headroom for phone photos and blocks obvious OOM bombs.
const MAX_BASE64_BYTES = 25 * 1024 * 1024

// Accept only single-word, filesystem-safe subfolder names under bottles/{userId}.
const SAFE_SUBFOLDER_RE = /^[a-z0-9_-]{1,32}$/i

function scopedFolder(userId: string, rawSubfolder: unknown): string {
  const sub = typeof rawSubfolder === 'string' && SAFE_SUBFOLDER_RE.test(rawSubfolder)
    ? rawSubfolder
    : 'bottles'
  return `bottles/${userId}/${sub}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { image, folder: rawFolder } = body

    if (typeof image !== 'string' || image.length === 0) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 })
    }

    if (image.length > MAX_BASE64_BYTES) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 })
    }

    // Strip data URI prefix; reject anything not claiming an image MIME.
    const match = image.match(/^data:(image\/[a-z+.-]+);base64,(.+)$/i)
    if (!match) {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 })
    }
    const base64Data = match[2]
    const inputBuffer = Buffer.from(base64Data, 'base64')

    // Verify with sharp that it's actually an image and fits our size bounds.
    // Re-encoding to JPEG neutralises embedded scripts/metadata payloads.
    const imageBuffer = await sharp(inputBuffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()

    const optimizedBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`

    const result = await uploadImage(optimizedBase64, {
      folder: scopedFolder(session.user.id, rawFolder),
      transformation: {
        quality: 'auto:good',
        fetch_format: 'auto',
      },
    })

    return NextResponse.json({
      url: result.secureUrl,
      publicId: result.publicId,
    })
  } catch (error: unknown) {
    console.error('Error uploading image:', error)
    const message = error instanceof Error ? error.message : 'Failed to upload image'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
