# Bottle Scanning Feature

This feature uses Google Cloud Vision API to automatically identify bottles from photos.

## Setup Instructions

### 1. Install Dependencies

Dependencies are already installed:
- `@google-cloud/vision` - Google Vision API client
- `sharp` - Image processing

### 2. Configure Google Cloud Credentials

You have two options for providing credentials:

#### Option A: JSON Credentials File (Recommended for Local Development)

1. Place your Google Cloud service account JSON file in the project:
   ```bash
   mkdir -p config
   cp ~/Downloads/your-service-account.json config/google-credentials.json
   ```

2. Add to `.env.local`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./config/google-credentials.json
   ```

3. The `config/google-credentials.json` file is already in `.gitignore` for security.

#### Option B: Environment Variables (Recommended for Production)

Add to `.env.local`:
```
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-key-here\n-----END PRIVATE KEY-----\n"
```

**Note:** Keep the `\n` characters in the private key - they're intentional!

### 3. Restart Development Server

After adding credentials, restart your Next.js server:
```bash
npm run dev
```

## How It Works

### User Flow

1. **Navigate to Scan Page**: Click "Scan" in the navigation or "Scan Bottle" on the bottles page
2. **Take Photo**: Use your device camera to capture the bottle label
3. **Processing**: The image is sent to Google Vision API for text extraction
4. **Results**: Based on confidence level:
   - **High Confidence**: Automatically selects the best matching product
   - **Medium/Low Confidence**: Shows a list of possible matches
   - **No Match**: Pre-fills a form to create a new product
5. **Add Bottle**: Confirm the product and add optional details (price, date, notes)

### Architecture

```
User Photo → Vision API → Text Extraction → Parsing → Product Matching → Bottle Creation
```

### Text Parsing

The system intelligently extracts:
- **Brand name**: Usually the most prominent text
- **Product name**: Secondary label text
- **Vintage**: 4-digit year (for wine)
- **Type**: Wine, Spirit, or Beer (detected from keywords)
- **Varietal/Style**: Grape variety or spirit type
- **Region**: Geographic origin
- **ABV**: Alcohol percentage
- **Age Statement**: For spirits (e.g., "12 Year")

### Product Matching

Matching algorithm scores products based on:
- Brand name similarity (50% weight)
- Product name similarity (30% weight)
- Type match (10% weight)
- Vintage exact match (10% weight)

Confidence levels:
- **High**: 85%+ match score
- **Medium**: 60-85% match score
- **Low**: <60% match score

## Files Created

### Backend
- `lib/vision.ts` - Google Vision API client initialization
- `app/api/scan-bottle/route.ts` - API endpoint for scanning bottles

### Frontend
- `app/bottles/scan/page.tsx` - Scan page UI with camera capture and results

### Modified Files
- `components/Navigation.tsx` - Added "Scan" button
- `app/bottles/page.tsx` - Added "Scan Bottle" button
- `.gitignore` - Added Google credentials to ignore list

## API Limits

Google Vision API:
- **Free Tier**: 1,000 requests/month
- **Paid**: ~$1.50 per 1,000 requests
- Requires billing account to be enabled

## Troubleshooting

### "Google Cloud credentials not configured"
- Check that your `.env.local` has the correct credential variables
- Restart your Next.js dev server after adding credentials
- Verify the JSON file path is correct if using Option A

### "No text detected in image"
- Try taking another photo with better lighting
- Ensure the label is centered and in focus
- Make sure text is clearly visible

### "Failed to scan bottle"
- Check your internet connection
- Verify Google Cloud Vision API is enabled in your project
- Check the browser console for detailed error messages
- Ensure billing is enabled on your Google Cloud project

## Testing

Test the feature with:
1. Various bottle types (wine, whiskey, vodka, etc.)
2. Different lighting conditions
3. Partially visible labels
4. Known products vs. new products

## Future Enhancements

Potential improvements:
- Barcode scanning as a fallback
- Image preprocessing for better OCR accuracy
- Machine learning model to improve parsing
- Batch scanning (multiple bottles at once)
- Scan history and analytics
- Support for non-English labels

