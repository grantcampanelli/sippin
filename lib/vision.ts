import { ImageAnnotatorClient } from '@google-cloud/vision'
import type { protos } from '@google-cloud/vision'

let visionClient: ImageAnnotatorClient | null = null

/**
 * Get or create the Google Vision API client
 */
export function getVisionClient(): ImageAnnotatorClient {
  if (visionClient) {
    return visionClient
  }

  // Initialize the client with credentials from environment variables
  try {
    // Option 1: Use JSON file path if provided
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      visionClient = new ImageAnnotatorClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      })
    }
    // Option 2: Use individual environment variables
    else if (
      process.env.GOOGLE_CLOUD_PROJECT_ID &&
      process.env.GOOGLE_CLOUD_PRIVATE_KEY &&
      process.env.GOOGLE_CLOUD_CLIENT_EMAIL
    ) {
      // Parse the private key to handle escaped newlines
      const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(
        /\\n/g,
        '\n'
      )

      visionClient = new ImageAnnotatorClient({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        credentials: {
          client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
          private_key: privateKey,
        },
      })
    } else {
      throw new Error(
        'Google Cloud Vision credentials not found. Please set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_PRIVATE_KEY, and GOOGLE_CLOUD_CLIENT_EMAIL environment variables.'
      )
    }

    return visionClient
  } catch (error) {
    console.error('Failed to initialize Vision API client:', error)
    throw error
  }
}

/**
 * Perform OCR text detection on an image
 * @param imageBuffer - Buffer containing the image data
 * @returns Extracted text from the image
 */
export async function detectText(imageBuffer: Buffer): Promise<string> {
  const client = getVisionClient()

  try {
    const [result] = await client.textDetection(imageBuffer)
    const detections = result.textAnnotations

    if (!detections || detections.length === 0) {
      return ''
    }

    // The first annotation contains all detected text
    return detections[0].description || ''
  } catch (error) {
    console.error('Error detecting text:', error)
    throw new Error('Failed to detect text from image')
  }
}

/**
 * Perform detailed text detection with bounding boxes
 * @param imageBuffer - Buffer containing the image data
 * @returns Array of text annotations with positions
 */
export async function detectTextDetailed(
  imageBuffer: Buffer
): Promise<protos.google.cloud.vision.v1.IEntityAnnotation[]> {
  const client = getVisionClient()

  try {
    const [result] = await client.textDetection(imageBuffer)
    return result.textAnnotations || []
  } catch (error) {
    console.error('Error detecting text:', error)
    throw new Error('Failed to detect text from image')
  }
}

