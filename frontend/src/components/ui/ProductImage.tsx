"use client";

import Image from "next/image";
import { useState } from "react";
import { getProductImage, CLOTHING_IMAGES, Product } from "@/lib/images";

type ProductImageProps = {
  product?: Partial<Product>;
  src?: string;
  alt?: string;
  aspectRatio?: string;
  className?: string;
  badge?: React.ReactNode;
  overlayActions?: React.ReactNode;
  onClick?: () => void;
};

export default function ProductImage({
  product,
  src,
  alt,
  aspectRatio = "aspect-[3/4]",
  className = "",
  badge,
  overlayActions,
  onClick,
}: ProductImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const imageSrc = src || getProductImage(product);
  const imageAlt =
    alt || product?.image?.alt_text || product?.images?.[0]?.alt_text || product?.title || "Product";

  const fallbackSrc = product
    ? CLOTHING_IMAGES[
        product.category?.slug?.toLowerCase() ||
        product.category?.category_name?.toLowerCase() ||
        "default"
      ] || CLOTHING_IMAGES["default"]
    : CLOTHING_IMAGES["default"];

  const handleError = () => {
    setHasError(true);
  };

  return (
    <div
      className={`group relative ${aspectRatio} bg-gray-50 overflow-hidden ${className}`}
      onClick={onClick}
    >
      {/* Shimmer skeleton */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 shimmer-bg z-[1]">
          <div className="absolute inset-0 shimmer-shine"></div>
        </div>
      )}

      {/* Error fallback */}
      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-[1]">
          <div className="text-center p-4">
            <svg
              className="w-10 h-10 text-gray-300 mx-auto mb-2"
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
            <p className="text-xs text-gray-400">Image unavailable</p>
          </div>
        </div>
      ) : (
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className={`object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
            isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          onLoad={() => setIsLoading(false)}
          onError={handleError}
          unoptimized={imageSrc.startsWith("data:")}
        />
      )}

      {/* Badges */}
      {badge && (
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {badge}
        </div>
      )}

      {/* Hover overlay actions */}
      {overlayActions && (
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          {overlayActions}
        </div>
      )}

      {/* Gradient overlay for better badge/action readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none z-0" />
    </div>
  );
}
