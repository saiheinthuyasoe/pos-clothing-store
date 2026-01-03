import { NextRequest, NextResponse } from 'next/server';
import { deleteFromR2 } from '@/lib/r2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, url } = body;

    if (!key && !url) {
      return NextResponse.json(
        { error: 'Either key or url must be provided' },
        { status: 400 }
      );
    }

    // Extract key from URL if not provided directly
    let fileKey = key;
    if (!fileKey && url) {
      // Extract key from R2 URL (everything after the domain)
      try {
        const urlObj = new URL(url);
        fileKey = urlObj.pathname.substring(1); // Remove leading slash
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    if (!fileKey) {
      return NextResponse.json(
        { error: 'Could not determine file key for deletion' },
        { status: 400 }
      );
    }

    // Delete from R2
    await deleteFromR2(fileKey);

    return NextResponse.json({
      success: true,
      key: fileKey,
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to delete image',
        success: false 
      },
      { status: 500 }
    );
  }
}