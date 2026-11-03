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
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Plus
} from "lucide-react";
import { CompanionImage } from "@/lib/types";

export interface UploadedPhotoItem {
  url: string;
  secure_url: string;
  public_id: string;
  position: number;
  uploadedAt: string;
  name?: string;
  size?: number;
  width?: number;
  height?: number;
  format?: string;
}

interface ImageUploadDropzoneProps {
  photos: UploadedPhotoItem[];
  onChange: (photos: UploadedPhotoItem[]) => void;
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
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[], replaceIdx?: number) => {
    setUploadError(null);
    setUploadSuccess(null);
    const fileList = Array.from(files);

    if (replaceIdx === undefined && photos.length + fileList.length > maxPhotos) {
      setUploadError(`Maximum ${maxPhotos} profile photographs allowed.`);
      return;
    }

    setUploading(true);

    try {
      const targetFolder = `datemate/companions/${companionId || "temp_" + Date.now()}`;
      const newUploads: UploadedPhotoItem[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadProgress(`Processing & uploading ${i + 1} of ${fileList.length}: ${file.name}...`);

        // 1. Format Validation: JPG, JPEG, PNG, WEBP
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type.toLowerCase()) && !/\.(jpg|jpeg|png|webp)$/i.test(file.name)) {
          throw new Error(`File "${file.name}" is not a supported format. Please select JPG, JPEG, PNG, or WEBP.`);
        }

        // 2. Size Validation (Max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File "${file.name}" exceeds the maximum 10MB size limit.`);
        }

        // Convert to Base64 data URL
        const base64Data = await readFileAsBase64(file);

        // Upload to Cloudinary API
        const targetPos = replaceIdx !== undefined ? replaceIdx : photos.length + i;
        const res = await fetch("/api/cloudinary/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64Data,
            companionId: companionId || "new_companion",
            position: targetPos,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || `Upload failed for ${file.name}`);
        }

        const uploadedItem: UploadedPhotoItem = {
          url: data.secure_url,
          secure_url: data.secure_url,
          public_id: data.public_id,
          position: targetPos,
          uploadedAt: data.uploadedAt || new Date().toISOString(),
          name: file.name,
          size: file.size,
          width: data.width,
          height: data.height,
          format: data.format,
        };

        newUploads.push(uploadedItem);
      }

      if (replaceIdx !== undefined && newUploads.length > 0) {
        // Replacement mode
        const updated = [...photos];
        updated[replaceIdx] = newUploads[0];
        // Re-index positions
        const reindexed = updated.map((item, idx) => ({ ...item, position: idx }));
        onChange(reindexed);
        setUploadSuccess(`Photo #${replaceIdx + 1} replaced successfully with Cloudinary asset!`);
      } else {
        // Addition mode
        const combined = [...photos, ...newUploads];
        const reindexed = combined.map((item, idx) => ({ ...item, position: idx }));
        onChange(reindexed);
        setUploadSuccess(`Successfully uploaded ${newUploads.length} photo(s) to Cloudinary!`);
      }

      setTimeout(() => setUploadSuccess(null), 5000);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload to Cloudinary");
    } finally {
      setUploading(false);
      setUploadProgress(null);
      setReplacingIndex(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (replaceInputRef.current) replaceInputRef.current.value = "";
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
    if (confirm(`Remove photo #${index + 1}? This will de-index the Cloudinary asset.`)) {
      if (photoToDelete.public_id) {
        try {
          await fetch("/api/cloudinary/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ public_id: photoToDelete.public_id }),
          });
        } catch (e) {
          console.warn("Cloudinary delete notice:", e);
        }
      }
      const updated = photos.filter((_, i) => i !== index).map((item, idx) => ({ ...item, position: idx }));
      onChange(updated);
    }
  };

  const handleStartReplace = (index: number) => {
    setReplacingIndex(index);
    replaceInputRef.current?.click();
  };

  const handleMove = (index: number, direction: "left" | "right") => {
    const targetIdx = direction === "left" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= photos.length) return;

    const updated = [...photos];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    const reindexed = updated.map((item, idx) => ({ ...item, position: idx }));
    onChange(reindexed);
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const item = photos[index];
    const rest = photos.filter((_, i) => i !== index);
    const updated = [item, ...rest].map((it, idx) => ({ ...it, position: idx }));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input for Replace */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && replacingIndex !== null) {
            handleFiles(e.target.files, replacingIndex);
          }
        }}
      />

      {/* Main Upload Dropzone */}
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
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
          isDragging
            ? "border-purple-600 bg-purple-50/60"
            : "border-slate-300 hover:border-purple-400 bg-slate-50/50 hover:bg-white"
        } ${photos.length >= maxPhotos ? "opacity-60" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files);
            }
          }}
          disabled={uploading || photos.length >= maxPhotos}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-sm">
            {uploading ? (
              <Loader2 className="w-7 h-7 animate-spin text-purple-600" />
            ) : (
              <UploadCloud className="w-7 h-7 text-purple-600" />
            )}
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-800">
              {uploading
                ? uploadProgress || "Uploading & Optimizing with Cloudinary..."
                : photos.length >= maxPhotos
                ? `Maximum Photos Reached (${maxPhotos}/${maxPhotos})`
                : "Drag & drop photos here or use button below"}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Supports <strong>JPG, JPEG, PNG, WEBP</strong> (Up to 10MB per file). Requires minimum {minPhotos} photos, maximum {maxPhotos}.
            </p>
          </div>

          {/* Cloudinary Preset Badge */}
          <div className="flex items-center gap-2 text-[11px] font-semibold text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Preset: <strong>datemate</strong> (Cloud: nyo286ls)</span>
            <span className="text-purple-400">•</span>
            <span>Folder: <code>datemate/companions/{companionId}/</code></span>
          </div>

          {/* Action Upload Button */}
          {photos.length < maxPhotos && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary text-xs py-2 px-5 mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Select Photos from Computer</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {uploadSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Error Notification */}
      {uploadError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-800 font-semibold animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Gallery & Management Controls */}
      {photos.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>
              Companion Photographs ({photos.length} of {maxPhotos}):
            </span>
            {photos.length < minPhotos ? (
              <span className="text-rose-600 font-bold">
                ⚠️ {minPhotos - photos.length} more photo{minPhotos - photos.length > 1 ? "s" : ""} required before publishing
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready for User Panel publication</span>
              </span>
            )}
          </div>

          {/* Photo Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {photos.map((photo, idx) => (
              <div
                key={photo.public_id || photo.url || idx}
                className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex flex-col shadow-sm hover:shadow-md transition-all"
              >
                {/* Image Container */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900">
                  <img
                    src={photo.secure_url || photo.url}
                    alt={`Photo #${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Primary Badge */}
                  {idx === 0 ? (
                    <span className="absolute top-2.5 left-2.5 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white text-white" />
                      <span>Primary Cover</span>
                    </span>
                  ) : (
                    <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      #{idx + 1}
                    </span>
                  )}

                  {/* Top Right Quick Delete */}
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(idx)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity shadow-md hover:scale-105"
                    title="Delete photo from Cloudinary"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Bottom Metadata Overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 text-white">
                    <p className="text-[10px] font-mono truncate text-zinc-300">
                      {photo.public_id ? photo.public_id.split("/").pop() : "uploaded"}
                    </p>
                    <div className="flex items-center justify-between text-[9px] text-zinc-400 mt-0.5">
                      <span>{photo.format?.toUpperCase() || "IMG"}</span>
                      {photo.width && photo.height && (
                        <span>{photo.width}×{photo.height}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Management Bar below photo */}
                <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, "left")}
                      className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30"
                      title="Move left (higher priority)"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === photos.length - 1}
                      onClick={() => handleMove(idx, "right")}
                      className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30"
                      title="Move right (lower priority)"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Make Primary / Replace Buttons */}
                  <div className="flex items-center gap-1">
                    {idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        className="p-1 rounded hover:bg-purple-50 text-purple-600 font-semibold"
                        title="Set as primary cover photo"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleStartReplace(idx)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1 text-[10px]"
                      title="Replace with another image"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Replace</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
