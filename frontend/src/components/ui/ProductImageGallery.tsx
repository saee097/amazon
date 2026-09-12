"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

type ImageItem = {
  _id?: string;
  image_url: string;
  alt_text?: string;
  sort_order?: number;
};

type ProductImageGalleryProps = {
  images: ImageItem[];
  title: string;
  enableZoom?: boolean;
  className?: string;
};

export default function ProductImageGallery({
  images,
  title,
  enableZoom = true,
  className = "",
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const safeImages = images?.length ? images : [];

  const handleSelect = useCallback(
    (idx: number) => {
      if (idx !== selectedIndex) {
        setSelectedIndex(idx);
        setLoading(true);
        setHasError(false);
      }
    },
    [selectedIndex]
  );

  const handleImageLoad = () => setLoading(false);
  const handleImageError = () => {
    setLoading(false);
    setHasError(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableZoom) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    setZoom(true);
  };

  const handleMouseLeave = () => {
    setZoom(false);
  };

  const prevIndex =
    selectedIndex === 0 ? safeImages.length - 1 : selectedIndex - 1;
  const nextIndex =
    selectedIndex === safeImages.length - 1 ? 0 : selectedIndex + 1;

  if (safeImages.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg aspect-square flex items-center justify-center ${className}`}>
        <div className="text-center">
          <svg
            className="w-12 h-12 text-gray-300 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-400">No Image Available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Main Image */}
      <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden aspect-square">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedIndex}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {enableZoom ? (
              <div
                className="relative w-full h-full cursor-zoom-in"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                tabIndex={0}
              >
                {loading && (
                  <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-lg z-[1]" />
                )}
                {hasError ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      <p className="text-sm text-gray-400">Failed to load image</p>
                    </div>
                  </div>
                ) : (
                  <Image
                    src={safeImages[selectedIndex].image_url}
                    alt={safeImages[selectedIndex].alt_text || title}
                    fill
                    className={`object-cover select-none pointer-events-none transition-opacity duration-300 ${
                      loading ? "opacity-0" : "opacity-100"
                    }`}
                    style={{
                      transform: zoom ? "scale(2)" : "scale(1)",
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      transition: zoom ? "none" : "transform 0.3s ease, opacity 0.3s ease",
                    }}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    unoptimized={safeImages[selectedIndex].image_url.startsWith("data:") || safeImages[selectedIndex].image_url.startsWith("http")}
                  />
                )}
              </div>
            ) : (
              <>
                {loading && (
                  <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-lg z-[1]" />
                )}
                {hasError ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      <p className="text-sm text-gray-400">Failed to load image</p>
                    </div>
                  </div>
                ) : (
                  <Image
                    src={safeImages[selectedIndex].image_url}
                    alt={safeImages[selectedIndex].alt_text || title}
                    fill
                    className={`object-cover select-none pointer-events-none transition-opacity duration-300 ${
                      loading ? "opacity-0" : "opacity-100"
                    }`}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    unoptimized={safeImages[selectedIndex].image_url.startsWith("data:")}
                  />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Image counter badge */}
        {safeImages.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-md font-medium backdrop-blur-sm z-10">
            {selectedIndex + 1} / {safeImages.length}
          </div>
        )}

        {/* Navigation arrows */}
        {safeImages.length > 1 && (
          <>
            <button
              onClick={() => handleSelect(prevIndex)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-md border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button
              onClick={() => handleSelect(nextIndex)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-md border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {safeImages.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {safeImages.slice(0, 5).map((img, idx) => (
            <button
              key={img._id || idx}
              onClick={() => handleSelect(idx)}
              aria-label={`View image ${idx + 1}`}
              className={`relative w-16 h-16 flex-shrink-0 rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                selectedIndex === idx
                  ? "border-orange-500 shadow-md ring-1 ring-orange-500 scale-105"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <Image
                src={img.image_url}
                alt={img.alt_text || `${title} ${idx + 1}`}
                fill
                className="object-cover"
                sizes="64px"
                draggable={false}
                unoptimized={img.image_url.startsWith("data:") || img.image_url.startsWith("http")}
              />
              {selectedIndex === idx && (
                <div className="absolute inset-0 border-2 border-orange-500 rounded-lg pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}