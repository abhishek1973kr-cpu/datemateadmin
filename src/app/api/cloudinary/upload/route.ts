import { NextResponse } from "next/server";
import { uploadCompanionImageToCloudinary } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, companionId = "general", position = 0 } = body;

    if (!image) {
      return NextResponse.json({ error: "Missing image payload (file or base64)" }, { status: 400 });
    }

    const result = await uploadCompanionImageToCloudinary(image, companionId, position);

    return NextResponse.json({
      success: true,
      secure_url: result.secure_url,
      public_id: result.public_id,
      position: result.position,
      uploadedAt: result.uploadedAt,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    });
  } catch (error) {
    console.error("Cloudinary upload API error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to upload image to Cloudinary" },
      { status: 500 }
    );
  }
}
