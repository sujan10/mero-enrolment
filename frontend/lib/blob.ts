import toast from 'react-hot-toast';

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
 * Upload a file to Vercel BLOB storage via API route
 */
export async function uploadToBlob(
  file: File,
  filename?: string
): Promise<BlobUploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (filename) {
      formData.append('filename', filename);
    }

    const response = await fetch('/api/blob', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      url: result.url,
      pathname: result.pathname,
      size: result.size,
      uploadedAt: new Date(result.uploadedAt),
    };
  } catch (error) {
    console.error('Error uploading to blob:', error);
    toast.error('Failed to upload file');
    throw error;
  }
}

/**
 * Upload multiple files to Vercel BLOB storage
 */
export async function uploadMultipleToBlob(
  files: File[]
): Promise<BlobUploadResult[]> {
  try {
    const uploadPromises = files.map((file, index) =>
      uploadToBlob(file, `${Date.now()}-${index}-${file.name}`)
    );

    const results = await Promise.all(uploadPromises);
    toast.success(`Successfully uploaded ${files.length} file(s)`);
    return results;
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    toast.error('Failed to upload some files');
    throw error;
  }
}

/**
 * Delete a file from Vercel BLOB storage via API route
 */
export async function deleteFromBlob(url: string): Promise<void> {
  try {
    const response = await fetch('/api/blob', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }

    toast.success('File deleted successfully');
  } catch (error) {
    console.error('Error deleting from blob:', error);
    toast.error('Failed to delete file');
    throw error;
  }
}

/**
 * List files in Vercel BLOB storage via API route
 */
export async function listBlobFiles(prefix?: string): Promise<BlobFile[]> {
  try {
    const url = prefix ? `/api/blob?prefix=${encodeURIComponent(prefix)}` : '/api/blob';
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`List failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.files.map((file: any) => ({
      url: file.url,
      pathname: file.pathname,
      size: file.size,
      uploadedAt: new Date(file.uploadedAt),
    }));
  } catch (error) {
    console.error('Error listing blob files:', error);
    toast.error('Failed to list files');
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
 * Validate file type and size
 */
export function validateFile(file: File, maxSize: number = 10 * 1024 * 1024): boolean {
  // Check file size (default 10MB)
  if (file.size > maxSize) {
    toast.error(`File size must be less than ${formatFileSize(maxSize)}`);
    return false;
  }

  // Check file type (PDF, JPG, PNG)
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    toast.error('Only PDF, JPG, and PNG files are allowed');
    return false;
  }

  return true;
} 