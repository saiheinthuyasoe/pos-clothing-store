"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  folder?: string;
  className?: string;
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  folder = "pos-clothing-store",
  className = "",
  placeholder = "Click to upload image",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      // Upload to Cloudflare via API route
      const response = await fetch("/api/cloudflare/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      if (data.success) {
        onChange(data.url);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to upload image. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      // If it's an R2 URL, delete from R2
      if (
        value.includes(".r2.") ||
        value.includes("r2.cloudflarestorage.com")
      ) {
        await fetch("/api/cloudflare/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: value }),
        });
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      // Continue with removal even if deletion fails
    }

    if (onRemove) {
      onRemove();
    } else {
      onChange("");
    }
  };

  return (
    <div className={`relative ${className}`}>
      {value ? (
        <div className="flex flex-col items-center">
          <div className="relative w-full">
            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300 flex items-center justify-center">
              <img
                src={value}
                alt="Uploaded image"
                className="h-full w-auto object-contain"
              />

              {!disabled && (
                <>
                  <input
                    aria-label="Change image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={disabled || isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                  />
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm z-0">
                    <Upload className="h-4 w-4" />
                    Select File
                  </div>
                </>
              )}
            </div>
            {!disabled && (
              <button
                title="Remove image"
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors z-20"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="relative">
          <input
            aria-label="Upload image"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={disabled || isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-400 transition-colors">
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                <p className="text-sm text-gray-500">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-md text-sm font-medium transition-colors mb-4 flex items-center gap-2 shadow-sm">
                  <Upload className="h-4 w-4" />
                  Select File
                </div>
                <p className="text-xs text-gray-400">
                  PNG, JPG, JPEG, GIF up to 5MB
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
