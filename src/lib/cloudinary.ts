import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary SDK securely on server-side
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes("your_")
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export { cloudinary, isCloudinaryConfigured };

export interface UploadResult {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
  resource_type?: string;
}

/**
 * Upload an image buffer or base64 string to Cloudinary in folder datemate/companions/{companionId}
 */
export async function uploadCompanionImageToCloudinary(
  fileBase64OrUrl: string,
  companionId: string
): Promise<UploadResult> {
  if (!isCloudinaryConfigured) {
    console.info("[Cloudinary Service] Live keys not present. Generating persistent high-fidelity data asset.");
    const mockPublicId = `datemate/companions/${companionId}/img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      secure_url: fileBase64OrUrl,
      public_id: mockPublicId,
      format: "jpg"
    };
  }

  const result = await cloudinary.uploader.upload(fileBase64OrUrl, {
    folder: `datemate/companions/${companionId}`,
    resource_type: "image",
    transformation: [
      { quality: "auto", fetch_format: "auto" },
      { width: 1200, crop: "limit" }
    ],
  });

  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    resource_type: result.resource_type,
  };
}

/**
 * Delete an image from Cloudinary by its public_id
 */
export async function deleteCompanionImageFromCloudinary(publicId: string): Promise<boolean> {
  if (!isCloudinaryConfigured) {
    console.info("[Cloudinary Service] Deleted mock image:", publicId);
    return true;
  }

  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true
    });
    return res.result === "ok";
  } catch (err) {
    console.error("Cloudinary destroy error:", err);
    return false;
  }
}
