import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/blob';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    
    // Fetch the blob content
    const response = await get(blobUrl);
    
    if (!response) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Return the file with appropriate headers
    return new NextResponse(response, {
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