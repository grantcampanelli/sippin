import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateUploadSignature } from '@/lib/cloudinary'

/**
 * Generate a signature for secure client-side uploads to Cloudinary
 * This allows the browser to upload directly to Cloudinary without
 * sending the image through our server
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { folder = 'bottles' } = body

    // Generate signature
    const signatureData = generateUploadSignature(folder)

    return NextResponse.json(signatureData)
  } catch (error: any) {
    console.error('Error generating upload signature:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate upload signature' },
      { status: 500 }
    )
  }
}
