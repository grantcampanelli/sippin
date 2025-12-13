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
    // Option 1: Use JSON credentials directly (best for production)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      try {
        const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
        visionClient = new ImageAnnotatorClient({
          credentials,
        })
      } catch (parseError) {
        console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', parseError)
        throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON format')
      }
    }
    // Option 2: Use JSON file path if provided (local development)
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      visionClient = new ImageAnnotatorClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      })
    }
    // Option 3: Use individual environment variables
    else if (
      process.env.GOOGLE_CLOUD_PROJECT_ID &&
      process.env.GOOGLE_CLOUD_PRIVATE_KEY &&
      process.env.GOOGLE_CLOUD_CLIENT_EMAIL
    ) {
      // Parse the private key to handle escaped newlines
      // Handle both literal \n and actual newlines
      let privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY
      
      // Replace literal \n with actual newlines if they exist
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n')
      }
      
      // Ensure the key is properly formatted
      if (!privateKey.includes('\n')) {
        throw new Error('GOOGLE_CLOUD_PRIVATE_KEY appears to be improperly formatted. Make sure it includes newline characters.')
      }

      visionClient = new ImageAnnotatorClient({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        credentials: {
          client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
          private_key: privateKey,
        },
      })
    } else {
      throw new Error(
        'Google Cloud Vision credentials not found. Please set one of: ' +
        '1) GOOGLE_APPLICATION_CREDENTIALS_JSON (recommended for production), ' +
        '2) GOOGLE_APPLICATION_CREDENTIALS (local file path), or ' +
        '3) GOOGLE_CLOUD_PROJECT_ID + GOOGLE_CLOUD_PRIVATE_KEY + GOOGLE_CLOUD_CLIENT_EMAIL'
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

