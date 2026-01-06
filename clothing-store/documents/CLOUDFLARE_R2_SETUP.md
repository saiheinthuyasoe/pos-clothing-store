# Cloudflare R2 Setup Guide

This project now uses Cloudflare R2 for image storage instead of Cloudinary. R2 provides S3-compatible object storage with zero egress fees.

## Features

✅ **Duplicate Detection**: Automatically detects duplicate images using MD5 hashing
✅ **Cost Efficient**: No egress fees, pay only for storage and operations
✅ **S3 Compatible**: Uses standard S3 SDK
✅ **Fast Performance**: Cloudflare's global network

## Setup Instructions

### 1. Create a Cloudflare R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2 Object Storage**
3. Click **Create Bucket**
4. Enter a bucket name (e.g., `clothing-store-images`)
5. Click **Create Bucket**

### 2. Create API Token

1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API Token**
3. Configure token:
   - **Token Name**: `clothing-store-upload`
   - **Permissions**:
     - ✅ Object Read & Write
   - **TTL**: Never expire (or set your preference)
4. Click **Create API Token**
5. **IMPORTANT**: Copy the following immediately (you won't see them again):
   - Access Key ID
   - Secret Access Key
   - Endpoint URL (format: `https://<account_id>.r2.cloudflarestorage.com`)

### 3. Configure Public Access (Optional but Recommended)

To make your images publicly accessible:

#### Option A: Use R2.dev subdomain (Free)

1. Go to your bucket settings
2. Click **Settings** tab
3. Find **Public Access** section
4. Click **Allow Access**
5. Click **Connect a Custom Domain** or use R2.dev URL
6. Your public URL will be: `https://your-bucket.<account_id>.r2.dev`

#### Option B: Use Custom Domain (Recommended for Production)

1. Go to bucket **Settings**
2. Click **Connect Domain**
3. Enter your custom domain (e.g., `cdn.yourdomain.com`)
4. Follow DNS setup instructions
5. Your public URL will be: `https://cdn.yourdomain.com`

### 4. Configure Environment Variables

Create/update your `.env.local` file:

```env
# Cloudflare R2 Configuration
R2_ENDPOINT=https://<your-account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=clothing-store-images
R2_PUBLIC_URL=https://your-bucket.<account_id>.r2.dev
# Or if using custom domain:
# R2_PUBLIC_URL=https://cdn.yourdomain.com
```

### 5. Install Dependencies

```bash
npm install
```

This will install `@aws-sdk/client-s3` which is required for R2 integration.

### 6. Test the Upload

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Go to the stock management page
3. Try uploading an image
4. Upload the same image again - it should detect the duplicate and return the existing URL
5. Check your R2 bucket to verify the upload

## How Duplicate Detection Works

1. When an image is uploaded, the system calculates its MD5 hash
2. It checks if a file with the same hash already exists in R2
3. If found, it returns the existing URL without uploading
4. If not found, it uploads the file with the hash as part of the filename
5. This prevents storage waste and ensures consistency

## File Naming Convention

Files are stored with this pattern:

```
folder/[MD5_HASH].[extension]
```

Example:

```
stocks/a3c5d9e8f2b1c4a7e9d8f5b2c1a6e8d9.jpg
```

## Migration from Cloudinary

If you have existing images in Cloudinary, you have two options:

### Option 1: Keep Existing URLs

- Leave old Cloudinary URLs in your database
- New uploads will use R2
- Gradually migrate as needed

### Option 2: Bulk Migration

1. Download all images from Cloudinary
2. Re-upload through your application
3. Update database URLs
4. Delete from Cloudinary

## Troubleshooting

### Error: "Failed to upload to R2"

- Check if all environment variables are correctly set
- Verify your API token has write permissions
- Ensure bucket name is correct

### Images Not Loading

- Verify public access is enabled on your bucket
- Check if `R2_PUBLIC_URL` is correct
- Ensure Next.js `next.config.ts` includes your R2 domain in `remotePatterns`

### Duplicate Detection Not Working

- Check if the `HeadObjectCommand` has proper permissions
- Verify the folder structure matches between uploads
- Look at server logs for detailed error messages

## Cost Estimation

Cloudflare R2 Pricing (as of 2026):

- **Storage**: $0.015 per GB/month
- **Class A operations** (write/list): $4.50 per million
- **Class B operations** (read): $0.36 per million
- **Egress**: **FREE** ⭐

Example for 10,000 images (~50 GB):

- Storage: $0.75/month
- Operations: ~$0.05/month
- **Total: ~$0.80/month** (vs Cloudinary's $99/month for similar usage)

## Support

For issues or questions:

1. Check [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
2. Review application logs in terminal
3. Check browser console for client-side errors
