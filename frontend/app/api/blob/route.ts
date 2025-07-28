import { NextRequest, NextResponse } from 'next/server';
import { put, del, list } from '@vercel/blob';

// Check if blob storage is properly configured
const isBlobConfigured = () => {
  return process.env.BLOB_READ_WRITE_TOKEN && process.env.BLOB_READ_WRITE_TOKEN !== 'your_vercel_blob_token_here';
};

export async function POST(request: NextRequest) {
  try {
    // Check if blob storage is configured
    if (!isBlobConfigured()) {
      return NextResponse.json(
        { 
          error: 'Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN environment variable.',
          development: true 
        },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const filename = formData.get('filename') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const response = await put(filename || file.name, file, {
      access: 'public',
    });

    return NextResponse.json({
      url: response.url,
      pathname: response.pathname,
    });
  } catch (error) {
    console.error('Error uploading to blob:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if blob storage is configured
    if (!isBlobConfigured()) {
      return NextResponse.json(
        { 
          error: 'Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN environment variable.',
          development: true 
        },
        { status: 503 }
      );
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      );
    }

    await del(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting from blob:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if blob storage is configured
    if (!isBlobConfigured()) {
      return NextResponse.json(
        { 
          error: 'Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN environment variable.',
          development: true,
          files: [] 
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || undefined;

    const { blobs } = await list({ prefix });

    return NextResponse.json({
      files: blobs.map((blob) => ({
        url: blob.url,
        pathname: blob.pathname,
      })),
    });
  } catch (error) {
    console.error('Error listing blob files:', error);
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
} 