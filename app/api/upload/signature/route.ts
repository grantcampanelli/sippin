import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateUploadSignature } from '@/lib/cloudinary'

const SAFE_SUBFOLDER_RE = /^[a-z0-9_-]{1,32}$/i

/**
 * Generate a Cloudinary signature for direct-from-browser uploads.
 * Folder is always scoped to bottles/{userId}/<subfolder> so a signature
 * can't be used to write into another user's namespace.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const rawSubfolder = body?.folder
    const subfolder =
      typeof rawSubfolder === 'string' && SAFE_SUBFOLDER_RE.test(rawSubfolder)
        ? rawSubfolder
        : 'bottles'

    const folder = `bottles/${session.user.id}/${subfolder}`
    const signatureData = generateUploadSignature(folder)
    return NextResponse.json(signatureData)
  } catch (error: unknown) {
    console.error('Error generating upload signature:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate upload signature'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
