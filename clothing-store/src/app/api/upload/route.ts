import { NextRequest, NextResponse } from 'next/server';
import { uploadCustomerImage, uploadBusinessLogo } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'customer' or 'business-logo'
    const id = formData.get('id') as string; // optional ID for naming

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!type || !['customer', 'business-logo'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid upload type. Must be "customer" or "business-logo"' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let result;
    if (type === 'customer') {
      result = await uploadCustomerImage(buffer, id);
    } else {
      result = await uploadBusinessLogo(buffer, id);
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}