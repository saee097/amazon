"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiHeart } from "react-icons/fi";
import ProductImage from "@/components/ui/ProductImage";
import { containerStagger, cardHover, tapScale } from "@/lib/motion";

type Variant = {
  _id: string;
  size: string;
  color: string;
  price: number;
  compare_price?: number;
  inventory_quantity: number;
};

export type Product = {
  _id: string;
  title: string;
  price?: number;
  compare_price?: number;
  slug: string;
  category?: { _id: string; category_name: string; slug?: string };
  brand?: { _id: string; brand_name: string };
  image?: { image_url: string; alt_text?: string };
  variants?: Variant[];
  created_at?: string;
};

export type ProductSectionProps = {
  title: string;
  subtitle?: string;
  products: Product[];
  limit?: number;
  showNewBadge?: boolean;
  showSaleBadge?: boolean;
  showOverlayActions?: boolean;
  showBrand?: boolean;
  viewAllHref?: string;
  viewAllLabel?: string;
};

const NEW_PRODUCT_MS = 7 * 24 * 60 * 60 * 1000;

const isProductNew = (createdAt?: string) => {
  if (!createdAt) return false;
  return new Date(createdAt).getTime() > Date.now() - NEW_PRODUCT_MS;
};

const formatPrice = (price: number | undefined) => {
  if (!price) return "$0";
  return `$${price.toLocaleString()}`;
};

export default function ProductSection({
  title,
  subtitle,
  products,
  limit,
  showNewBadge = false,
  showSaleBadge = false,
  showOverlayActions = false,
  showBrand = true,
  viewAllHref = "/products",
  viewAllLabel = "View All",
}: ProductSectionProps) {
  const displayProducts = limit ? products.slice(0, limit) : products;

  if (!displayProducts.length) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-medium text-gray-800 dark:text-gray-200 tracking-wide uppercase">
            {title}
          </h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <Link
          href={viewAllHref}
          className="text-sm font-medium text-[#0F766E] underline underline-offset-4 hover:text-[#0F766E]/80"
        >
          {viewAllLabel}
        </Link>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerStagger}
        initial="initial"
        animate="animate"
      >
        {displayProducts.map((product) => {
          const currentPrice = product.variants?.[0]?.price || product.price || 0;
          const comparePrice = product.variants?.[0]?.compare_price || product.compare_price || 0;
          const hasDiscount = comparePrice > currentPrice;
          const isNew = showNewBadge && isProductNew(product.created_at);
          const showSale = showSaleBadge && hasDiscount;
          const hasBadge = isNew || showSale;

          const badge =
            hasBadge ? (
              <>
                {isNew && (
                  <span className="bg-gray-900 text-white text-[10px] font-medium px-2 py-1 uppercase tracking-wider">
                    New
                  </span>
                )}
                {showSale && (
                  <span className="bg-red-500 text-white text-[10px] font-medium px-2 py-1 uppercase tracking-wider">
                    Sale
                  </span>
                )}
              </>
            ) : undefined;

          return (
            <motion.div
              key={product._id}
              variants={cardHover}
              {...tapScale}
              className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <Link
                href={`/products/${product.slug}`}
                className="block relative"
                title={product.title}
              >
                <ProductImage
                  product={product}
                  aspectRatio="aspect-[3/4]"
                  badge={badge}
                  overlayActions={
                    showOverlayActions ? (
                      <>
                        <motion.button
                          type="button"
                          aria-label="Add to wishlist"
                          className="w-8 h-8 bg-white dark:bg-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full"
                          whileHover={{ scale: 1.15 }}
                          {...tapScale}
                        >
                          <FiHeart size={14} className="text-gray-700 dark:text-gray-300" />
                        </motion.button>
                      </>
                    ) : undefined
                  }
                />
              </Link>
              <div className="p-4">
                <Link href={`/products/${product.slug}`}>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 group-hover:text-[#0F766E] transition-colors line-clamp-2">
                    {product.title}
                  </h3>
                </Link>
                {showBrand && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {product.brand?.brand_name || product.category?.category_name}
                  </p>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatPrice(currentPrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                      {formatPrice(comparePrice)}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
