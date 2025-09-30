import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';

// Configure Cloudinary (server-side only)
if (typeof window === 'undefined') {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
}

/**
 * Upload an image to Cloudinary
 * @param file - The file buffer or base64 string
 * @param folder - The folder to upload to (optional)
 * @returns Promise with upload result
 */
export async function uploadToCloudinary(
  file: Buffer | string,
  folder?: string
): Promise<CloudinaryUploadResult> {
  try {
    const uploadOptions: UploadApiOptions = {
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
    };

    if (folder) {
      uploadOptions.folder = folder;
    }

    // Convert buffer to base64 data URL if needed
    const fileToUpload = (file instanceof Buffer 
      ? `data:image/jpeg;base64,${file.toString('base64')}` 
      : file) as string;

    const result = await cloudinary.uploader.upload(
      fileToUpload,
      uploadOptions
    );

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
      created_at: result.created_at,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Promise with deletion result
 */
export async function deleteFromCloudinary(publicId: string): Promise<{ result: string }> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
}

/**
 * Extract public ID from Cloudinary URL
 * @param url - The Cloudinary URL
 * @returns The public ID
 */
export function extractPublicId(url: string): string {
  try {
    // Extract public ID from Cloudinary URL
    // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/image.jpg
    const parts = url.split('/');
    const uploadIndex = parts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) return '';
    
    // Get everything after 'upload' and version (if present)
    let publicIdParts = parts.slice(uploadIndex + 1);
    
    // Remove version if present (starts with 'v' followed by numbers)
    if (publicIdParts[0] && /^v\d+$/.test(publicIdParts[0])) {
      publicIdParts = publicIdParts.slice(1);
    }
    
    // Join the remaining parts and remove file extension
    const publicId = publicIdParts.join('/');
    return publicId.replace(/\.[^/.]+$/, ''); // Remove file extension
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return '';
  }
}

export default cloudinary;