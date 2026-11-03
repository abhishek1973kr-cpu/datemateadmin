import { NextResponse } from "next/server";
import { deleteCompanionImageFromCloudinary } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const { public_id } = await req.json();

    if (!public_id) {
      return NextResponse.json({ error: "Missing public_id parameter" }, { status: 400 });
    }

    const success = await deleteCompanionImageFromCloudinary(public_id);

    return NextResponse.json({
      success,
      message: success ? "Image successfully removed" : "Failed to remove image"
    });
  } catch (error) {
    console.error("Cloudinary delete API error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to delete image" },
      { status: 500 }
    );
  }
}
