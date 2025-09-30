import { NextRequest, NextResponse } from 'next/server';
import { deleteFromCloudinary, extractPublicId } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicId, url } = body;

    if (!publicId && !url) {
      return NextResponse.json(
        { error: 'Either publicId or url must be provided' },
        { status: 400 }
      );
    }

    // Extract public ID from URL if not provided directly
    const imagePublicId = publicId || extractPublicId(url);

    if (!imagePublicId) {
      return NextResponse.json(
        { error: 'Could not determine public ID for deletion' },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    const result = await deleteFromCloudinary(imagePublicId);

    return NextResponse.json({
      success: true,
      result: result.result,
      publicId: imagePublicId,
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