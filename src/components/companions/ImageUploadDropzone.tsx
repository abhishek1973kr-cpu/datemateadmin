"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  X,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Star,
  RefreshCw
} from "lucide-react";

export interface UploadedPhoto {
  url: string;
  publicId?: string;
  name?: string;
  size?: number;
}

interface ImageUploadDropzoneProps {
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
  companionId: string;
  minPhotos?: number;
  maxPhotos?: number;
}

export function ImageUploadDropzone({
  photos,
  onChange,
  companionId,
  minPhotos = 2,
  maxPhotos = 5,
}: ImageUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    setUploadError(null);
    const fileList = Array.from(files);

    if (photos.length + fileList.length > maxPhotos) {
      setUploadError(`Maximum ${maxPhotos} profile photographs allowed.`);
      return;
    }

    setUploading(true);

    try {
      const newUploads: UploadedPhoto[] = [];

      for (const file of fileList) {
        // Validate size (max 8MB)
        if (file.size > 8 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds maximum 8MB size limit.`);
        }
        // Validate format
        if (!file.type.startsWith("image/")) {
          throw new Error(`File ${file.name} is not a supported image format (JPEG, PNG, WebP).`);
        }

        // Convert to Base64 data URL
        const base64Data = await readFileAsBase64(file);

        // Upload to server API -> Cloudinary
        const res = await fetch("/api/cloudinary/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64Data,
            companionId: companionId || "new_companion",
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to upload photo to Cloudinary");
        }

        newUploads.push({
          url: data.secure_url,
          publicId: data.public_id,
          name: file.name,
          size: file.size,
        });
      }

      onChange([...photos, ...newUploads]);
    } catch (err: any) {
      setUploadError(err.message || "Error uploading image to Cloudinary");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDeletePhoto = async (index: number) => {
    const photoToDelete = photos[index];
    if (photoToDelete.publicId) {
      try {
        await fetch("/api/cloudinary/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_id: photoToDelete.publicId }),
        });
      } catch (e) {
        console.warn("Cloudinary delete notice:", e);
      }
    }
    const updated = photos.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const item = photos[index];
    const rest = photos.filter((_, i) => i !== index);
    onChange([item, ...rest]);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => {
          if (!uploading && photos.length < maxPhotos) {
            fileInputRef.current?.click();
          }
        }}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-purple-600 bg-purple-50/50"
            : "border-slate-300 hover:border-purple-400 bg-slate-50/50 hover:bg-white"
        } ${photos.length >= maxPhotos ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files);
            }
          }}
          disabled={uploading || photos.length >= maxPhotos}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            ) : (
              <UploadCloud className="w-6 h-6 text-purple-600" />
            )}
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800">
              {uploading
                ? "Uploading to Cloudinary & Optimizing..."
                : photos.length >= maxPhotos
                ? `Maximum limit reached (${maxPhotos}/${maxPhotos})`
                : "Drag & drop photos or click to browse"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              High resolution JPG, PNG, or WebP (Up to 8MB each). Min {minPhotos}, Max {maxPhotos}.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-purple-700 font-semibold bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Direct Cloudinary Secure Image Storage</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Uploaded Photos Grid */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>
              Uploaded Photographs ({photos.length} of {maxPhotos}):
            </span>
            {photos.length < minPhotos && (
              <span className="text-rose-600 font-bold">
                * At least {minPhotos} photos required ({minPhotos - photos.length} more needed)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {photos.map((photo, idx) => (
              <div
                key={photo.url || idx}
                className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square shadow-sm"
              >
                <img
                  src={photo.url}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Primary Tag */}
                {idx === 0 ? (
                  <span className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                    Primary
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm"
                    title="Set as primary thumbnail"
                  >
                    <Star className="w-3 h-3 text-amber-300" />
                    <span>Make Primary</span>
                  </button>
                )}

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(idx)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110"
                  title="Delete photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Cloudinary Info Badge */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white">
                  <p className="text-[10px] truncate font-medium">
                    {photo.publicId ? "Cloudinary Synced" : "Ready"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
