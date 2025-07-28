import { NextRequest, NextResponse } from 'next/server';

// Check if blob storage is properly configured
const isBlobConfigured = () => {
  return process.env.BLOB_READ_WRITE_TOKEN && process.env.BLOB_READ_WRITE_TOKEN !== 'your_vercel_blob_token_here';
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // In a real app, you would validate the user's ownership of this file
    // For now, we'll just check if the ID exists and return the blob
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Get the blob URL from the database or construct it
    // This is a simplified version - in production you'd look up the actual blob URL
    const blobUrl = `https://your-blob-store.com/${id}`;
    
    // Fetch the blob content using fetch instead of @vercel/blob
    const response = await fetch(blobUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const blob = await response.blob();
    
    // Return the file with appropriate headers
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${id}.pdf"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving blob:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // In a real app, you would:
    // 1. Validate user ownership
    // 2. Delete from blob storage
    // 3. Update database record
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blob:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
} 