import { put, del, list } from '@vercel/blob';

export interface BlobUploadResult {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
}

export interface BlobFile {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
}

/**
 * Upload a file to Vercel BLOB storage (server-side)
 */
export async function uploadToBlobServer(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<BlobUploadResult> {
  try {
    const response = await put(filename, file, {
      access: 'public',
      contentType,
    });

    return {
      url: response.url,
      pathname: response.pathname,
      size: response.size,
      uploadedAt: response.uploadedAt,
    };
  } catch (error) {
    console.error('Error uploading to blob (server):', error);
    throw error;
  }
}

/**
 * Delete a file from Vercel BLOB storage (server-side)
 */
export async function deleteFromBlobServer(url: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    console.error('Error deleting from blob (server):', error);
    throw error;
  }
}

/**
 * List files in Vercel BLOB storage (server-side)
 */
export async function listBlobFilesServer(prefix?: string): Promise<BlobFile[]> {
  try {
    const { blobs } = await list({ prefix });
    return blobs.map((blob) => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    }));
  } catch (error) {
    console.error('Error listing blob files (server):', error);
    throw error;
  }
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate file type and size (server-side)
 */
export function validateFileServer(
  file: Buffer,
  contentType: string,
  maxSize: number = 10 * 1024 * 1024
): boolean {
  // Check file size (default 10MB)
  if (file.length > maxSize) {
    return false;
  }

  // Check file type (PDF only for this project)
  const allowedTypes = ['application/pdf'];
  if (!allowedTypes.includes(contentType)) {
    return false;
  }

  return true;
} 