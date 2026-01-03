import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

// Configure R2 Client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!; // Your custom domain or R2.dev URL

export interface R2UploadResult {
  key: string;
  url: string;
  hash: string;
  size: number;
  contentType: string;
  width?: number;
  height?: number;
}

/**
 * Calculate MD5 hash of a buffer
 */
function calculateHash(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

/**
 * Get image dimensions from buffer
 */
async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number } | null> {
  try {
    // Using a simple approach - you might want to use a library like 'sharp' for production
    // For now, we'll return null and handle dimensions on the client side if needed
    return null;
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    return null;
  }
}

/**
 * Check if a file with the same hash already exists
 */
async function checkDuplicateByHash(hash: string, folder?: string): Promise<string | null> {
  try {
    const key = folder ? `${folder}/${hash}` : hash;
    
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    // File exists, return the URL
    return `${PUBLIC_URL}/${key}`;
  } catch (error: any) {
    // File doesn't exist (404 error)
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Upload a file to Cloudflare R2
 * @param file - The file buffer
 * @param contentType - The MIME type of the file
 * @param folder - Optional folder path
 * @param originalFilename - Original filename for reference
 * @returns Promise with upload result
 */
export async function uploadToR2(
  file: Buffer,
  contentType: string,
  folder?: string,
  originalFilename?: string
): Promise<R2UploadResult> {
  try {
    // Calculate hash of the file
    const hash = calculateHash(file);
    
    // Check if file with same hash already exists
    const existingUrl = await checkDuplicateByHash(hash, folder);
    if (existingUrl) {
      console.log(`Duplicate file detected. Returning existing URL: ${existingUrl}`);
      return {
        key: folder ? `${folder}/${hash}` : hash,
        url: existingUrl,
        hash,
        size: file.length,
        contentType,
      };
    }

    // Generate unique key using hash
    const extension = originalFilename?.split('.').pop() || 'jpg';
    const key = folder ? `${folder}/${hash}.${extension}` : `${hash}.${extension}`;

    // Get image dimensions if it's an image
    const dimensions = contentType.startsWith('image/') 
      ? await getImageDimensions(file)
      : null;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: {
        hash,
        originalFilename: originalFilename || '',
        uploadedAt: new Date().toISOString(),
      },
    });

    await r2Client.send(command);

    const url = `${PUBLIC_URL}/${key}`;

    return {
      key,
      url,
      hash,
      size: file.length,
      contentType,
      width: dimensions?.width,
      height: dimensions?.height,
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    throw new Error(`Failed to upload to R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a file from R2
 * @param key - The file key/path in R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
  } catch (error) {
    console.error('R2 delete error:', error);
    throw new Error(`Failed to delete from R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
