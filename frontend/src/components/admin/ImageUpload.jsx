"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { upload } from "@/lib/api";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function ImageUpload({
  value,
  onChange,
  label = "Image",
  required = false,
  accept = "image/*",
  endpoint = "/admin/upload/image",
  disabled = false,
  className = "",
}) {
  const [preview, setPreview] = useState(value);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = useCallback((file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, WebP, or GIF)");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be less than 5MB");
      return false;
    }
    setError("");
    return true;
  }, []);

  const handleFileSelect = useCallback((file) => {
    if (!file || !validateFile(file)) return;

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    setProgress(0);

    upload(endpoint, formData, setProgress)
      .then((res) => {
        const imageUrl = res.data?.url || res.data?.data?.url;
        if (imageUrl) {
          onChange(imageUrl);
          setError("");
        } else {
          throw new Error("Invalid response from server");
        }
      })
      .catch((err) => {
        console.error("Upload failed:", err);
        setError(err?.response?.data?.message || "Upload failed. Please try again.");
        setPreview(value);
      })
      .finally(() => {
        setUploading(false);
        setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
      });
  }, [value, onChange, endpoint, validateFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, [disabled, handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled) setDragActive(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled) fileInputRef.current?.click();
  }, [disabled]);

  const handleRemove = useCallback((e) => {
    e.stopPropagation();
    onChange("");
    setPreview("");
    setError("");
  }, [onChange]);

  const isExternalUrl = preview && (preview.startsWith("http") || preview.startsWith("//"));

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFileSelect(e.target.files[0])}
        className="hidden"
        disabled={disabled || uploading}
        aria-label={label}
      />

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 rounded-xl transition-all cursor-pointer
          ${dragActive ? "border-[#0F766E] bg-[#0F766E]/5" : "border-gray-200 dark:border-gray-600 hover:border-gray-300"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${preview ? "min-h-[180px]" : "min-h-[140px] flex items-center justify-center"}
          `}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleClick()}
      >
        {uploading && (
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex flex-col items-center justify-center z-10 rounded-xl">
        <Loader2 size={24} className="animate-spin text-[#0F766E]" />
        <div className="mt-2 w-48 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0F766E] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
          </div><span className="mt-2 text-sm text-gray-600 dark:text-gray-400">Uploading... {progress}%</span>
      </div>
        )}

        {!uploading && preview && (
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
            <img
              src={preview}
              alt={`${label} preview`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition"
              aria-label={`Remove ${label.toLowerCase()}`}
            >
              <X size={16} />
            </button>
            {isExternalUrl && (
              <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-1 text-xs text-white bg-black/50 rounded">
                <ImageIcon size={10} /> External URL
              </span>
            )}
          </div>
        )}

        {!uploading && !preview && (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0F766E]/10 text-[#0F766E] mb-3">
              <Upload size={24} />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              {dragActive ? "Drop image here" : "Click or drag to upload"}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              JPEG, PNG, WebP, GIF up to 5MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
          <X size={14} className="shrink-0" />
          {error}
        </p>
      )}

      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    </div>
  );
}