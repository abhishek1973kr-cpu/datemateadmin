import { NextResponse } from "next/server";
import { uploadCompanionImageToCloudinary } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, companionId = "general" } = body;

    if (!image) {
      return NextResponse.json({ error: "Missing image payload" }, { status: 400 });
    }

    const result = await uploadCompanionImageToCloudinary(image, companionId);

    return NextResponse.json({
      success: true,
      secure_url: result.secure_url,
      public_id: result.public_id,
      format: result.format
    });
  } catch (error) {
    console.error("Cloudinary upload API error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
