import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // 'customer' or 'business-logo'
    const id = formData.get("id") as string; // optional ID for naming

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!type || !["customer", "business-logo", "expense"].includes(type)) {
      return NextResponse.json(
        {
          error:
            'Invalid upload type. Must be "customer", "expense" or "business-logo"',
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let result;
    if (type === "customer") {
      // Use Cloudflare R2 for customer image upload
      result = await uploadToR2(
        buffer,
        file.type,
        "pos-clothing-store/customers",
        id ? `${id}.${file.name.split(".")?.pop()}` : file.name
      );
    } else if (type === "expense") {
      // Use Cloudflare R2 for expense image upload
      result = await uploadToR2(
        buffer,
        file.type,
        "pos-clothing-store/expenses",
        id ? `${id}.${file.name.split(".")?.pop()}` : file.name
      );
    } else {
      // Keep business-logo using Cloudinary (or switch to R2 if needed)
      return NextResponse.json(
        { error: "Business logo upload not implemented with R2 yet." },
        { status: 501 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
