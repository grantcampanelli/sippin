# Production Environment Setup for Bottle Scanning

## Google Cloud Vision API Credentials

The error `DECODER routines::unsupported` typically means the private key isn't being parsed correctly in production.

### Setting Environment Variables in Production

You have **two options** for credentials:

---

## Option 1: Use Service Account JSON (Recommended)

### For Vercel:

1. **Encode your JSON file to base64:**
   ```bash
   cat config/google-credentials.json | base64
   ```

2. **Add to Vercel Environment Variables:**
   - Go to your project → Settings → Environment Variables
   - Add: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - Value: Paste the base64-encoded string
   - Or, paste the entire JSON content directly (Vercel handles this)

3. **Alternative - Direct JSON:**
   - Variable: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - Value: Paste the entire contents of your `google-credentials.json` file
   - Make sure to select "Production" environment

### For other platforms (Railway, Render, etc.):

Similar process - either base64 encode or paste the JSON directly as an environment variable.

---

## Option 2: Use Individual Environment Variables (Current Issue)

If using individual variables, the private key formatting is critical:

### Vercel/Netlify Setup:

When adding `GOOGLE_CLOUD_PRIVATE_KEY`, you need to handle newlines properly:

#### Method A: Copy from JSON with escaped newlines
From your JSON file, copy the `private_key` value **exactly as it appears** including the `\n` characters:

```
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...(your key)...\n-----END PRIVATE KEY-----\n"
```

**Important:** Include the surrounding quotes!

#### Method B: Use actual newlines (platform-specific)

Some platforms support multi-line environment variables. You can paste:

```
GOOGLE_CLOUD_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBg...
(your key continues)
...
-----END PRIVATE KEY-----
```

### Required Variables:

```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-key-here\n-----END PRIVATE KEY-----\n"
```

---

## Vercel Specific Instructions (Step-by-Step)

1. **Go to your Vercel project dashboard**
2. **Settings → Environment Variables**
3. **Add these three variables:**

   **Variable 1:**
   - Key: `GOOGLE_CLOUD_PROJECT_ID`
   - Value: `your-project-id` (from your JSON file)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **Variable 2:**
   - Key: `GOOGLE_CLOUD_CLIENT_EMAIL`
   - Value: `your-service-account@your-project.iam.gserviceaccount.com`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **Variable 3 (The tricky one):**
   - Key: `GOOGLE_CLOUD_PRIVATE_KEY`
   - Value: Copy the `private_key` value from your JSON file
     - Include the quotes: `"-----BEGIN PRIVATE KEY-----\n...`
     - Keep all the `\n` characters as literal `\n` (don't convert them)
     - Should look like: `"-----BEGIN PRIVATE KEY-----\nMIIEvQIB...your key...\n-----END PRIVATE KEY-----\n"`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

4. **Redeploy your application**
   - Go to Deployments
   - Click "..." on the latest deployment
   - Click "Redeploy"
   - Or push a new commit to trigger deployment

---

## Troubleshooting

### Error: "DECODER routines::unsupported"
- **Cause:** Private key format is incorrect
- **Solution:** Make sure you copied the private key WITH the `\n` characters as literal text, not actual newlines

### Error: "PERMISSION_DENIED: This API method requires billing"
- **Cause:** Billing not enabled on Google Cloud project
- **Solution:** Enable billing at https://console.cloud.google.com/billing

### Error: "credentials not configured"
- **Cause:** Environment variables not set or not loaded
- **Solution:** Check that all three variables are set in production environment
- **Vercel:** After adding variables, you MUST redeploy for them to take effect

### Testing
After deploying, check the logs:
- Vercel: Go to Deployments → Click deployment → Functions → Logs
- Look for any error messages related to Google Cloud

---

## Quick Fix Command

If you're still having issues, try this approach - convert your JSON to environment variables:

```bash
# Run this locally with your google-credentials.json file
echo "GOOGLE_CLOUD_PROJECT_ID=$(cat config/google-credentials.json | jq -r .project_id)"
echo "GOOGLE_CLOUD_CLIENT_EMAIL=$(cat config/google-credentials.json | jq -r .client_email)"
echo "GOOGLE_CLOUD_PRIVATE_KEY=$(cat config/google-credentials.json | jq -r .private_key | jq -Rs .)"
```

Copy those values into your Vercel environment variables.

---

## Alternative: Use Vercel Secret Files (Easiest)

If your platform supports it, you can upload the JSON file directly:

### Vercel:
```bash
vercel env add GOOGLE_APPLICATION_CREDENTIALS_JSON < config/google-credentials.json
```

Then update your code to use it (we can implement this if needed).

