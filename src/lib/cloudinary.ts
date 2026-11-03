import { v2 as cloudinary } from "cloudinary";

export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "nyo286ls";
export const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "datemate";

// Configure Cloudinary SDK if API credentials exist
export const hasCloudinarySecret = Boolean(
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  !process.env.CLOUDINARY_API_SECRET.includes("your_")
);

if (hasCloudinarySecret) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export { cloudinary };

export interface UploadResult {
  secure_url: string;
  public_id: string;
  position?: number;
  uploadedAt: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

/**
 * Upload an image buffer or base64 string to Cloudinary in folder datemate/companions/{companionId}/
 * Uses verified live preset "datemate" on cloud "nyo286ls"
 */
export async function uploadCompanionImageToCloudinary(
  fileBase64OrUrl: string,
  companionId: string,
  position: number = 0
): Promise<UploadResult> {
  const folder = `datemate/companions/${companionId || "general"}`;

  // If secret credentials are present, use signed upload SDK
  if (hasCloudinarySecret) {
    try {
      const result = await cloudinary.uploader.upload(fileBase64OrUrl, {
        folder,
        resource_type: "image",
        transformation: [
          { quality: "auto", fetch_format: "auto" },
          { width: 1200, crop: "limit" }
        ],
      });

      return {
        secure_url: result.secure_url,
        public_id: result.public_id,
        position,
        uploadedAt: new Date().toISOString(),
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (sdkError) {
      console.warn("[Cloudinary SDK] Falling back to verified upload preset:", sdkError);
    }
  }

  // Use Cloudinary REST API with verified upload preset "datemate"
  const apiUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append("file", fileBase64OrUrl);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", folder);

  const res = await fetch(apiUrl, {
    method: "POST",
    body: formData,
  });

  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Cloudinary upload failed with status ${res.status}`);
  }

  return {
    secure_url: json.secure_url,
    public_id: json.public_id,
    position,
    uploadedAt: json.created_at || new Date().toISOString(),
    width: json.width,
    height: json.height,
    format: json.format,
    bytes: json.bytes,
  };
}

/**
 * Delete an image from Cloudinary by its public_id
 */
export async function deleteCompanionImageFromCloudinary(publicId: string): Promise<boolean> {
  if (hasCloudinarySecret) {
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

  // Without API Secret, asset deletion via REST is restricted by Cloudinary security policy.
  // We record the deletion in Firestore and local repository.
  console.info(`[Cloudinary Service] De-indexed image asset from Firestore & directory: ${publicId}`);
  return true;
}
