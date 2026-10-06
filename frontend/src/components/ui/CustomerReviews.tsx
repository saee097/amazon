"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiStar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { fadeUp, containerStagger, tapScale } from "@/lib/motion";

export type Review = {
  _id: string;
  rating: number;
  comment: string;
  status?: string;
  customer?: { name?: string; first_name?: string; last_name?: string };
  created_at?: string;
  product?: {
    _id: string;
    title: string;
    slug: string;
    images?: Array<{ image_url: string; alt_text?: string }>;
  };
};

export type CustomerReviewsProps = {
  title?: string;
  subtitle?: string;
  reviews: Review[];
};

export default function CustomerReviews({
  title = "Customer Reviews",
  subtitle = "What our customers are saying",
  reviews,
}: CustomerReviewsProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const { scrollLeft, scrollWidth, clientWidth } = track;
    setCanPrev(scrollLeft > 8);
    setCanNext(scrollLeft + clientWidth < scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateArrows();
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", updateArrows, { passive: true });
    return () => track.removeEventListener("scroll", updateArrows);
  }, [updateArrows]);

  const scrollByCard = (dir: number) => {
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>(".review-card");
    if (!track || !card) return;
    const amount = card.offsetWidth + 24; // gap-6
    track.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  if (!reviews.length) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-medium text-gray-800 dark:text-gray-200 tracking-wide uppercase">
            {title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {reviews.length} review{reviews.length === 1 ? "" : "s"}
        </span>
      </div>

      <motion.div
        ref={trackRef}
        variants={containerStagger}
        initial="initial"
        animate="animate"
        className="relative flex items-stretch gap-6 overflow-x-auto scroll-smooth snap-mandatory px-12 md:px-14 pb-2
          [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]"
      >
        {reviews.length > 1 && (
          <motion.button
            type="button"
            aria-label="Previous review"
            onClick={() => scrollByCard(-1)}
            disabled={!canPrev}
            whileHover={canPrev ? { scale: 1.08 } : undefined}
            {...tapScale}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:border-[#0F766E] hover:text-[#0F766E] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <FiChevronLeft size={18} />
          </motion.button>
        )}

        {reviews.map((review) => {
          const customerName =
            review.customer?.name || review.customer?.first_name || "Anonymous";
          const initial = customerName.charAt(0).toUpperCase() || "U";
          return (
            <motion.div
              key={review._id}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              {...tapScale}
              className="review-card flex-none snap-start w-full sm:w-1/2 lg:w-1/3"
            >
              <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 transition-colors hover:border-[#0F766E]">
                <div className="flex items-center gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                      key={star}
                      size={16}
                      className={
                        star <= (review.rating || 0)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300 dark:text-gray-500"
                      }
                    />
                  ))}
                </div>
                <blockquote className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4 line-clamp-4">
                  “{review.comment}”
                </blockquote>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {customerName}
                    </p>
                    {review.created_at && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {review.product && review.product.images?.[0]?.image_url && (
                    <img
                      src={review.product.images[0].image_url}
                      alt={review.product.images[0].alt_text || review.product.title}
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                    />
                  )}
                </div>
                {review.product && (
                  <Link
                    href={`/products/${review.product.slug}`}
                    className="mt-3 text-xs text-[#0F766E] hover:underline"
                  >
                    View on {review.product.title}
                  </Link>
                )}
              </div>
            </motion.div>
          );
        })}

        {reviews.length > 1 && (
          <motion.button
            type="button"
            aria-label="Next review"
            onClick={() => scrollByCard(1)}
            disabled={!canNext}
            whileHover={canNext ? { scale: 1.08 } : undefined}
            {...tapScale}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:border-[#0F766E] hover:text-[#0F766E] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <FiChevronRight size={18} />
          </motion.button>
        )}
      </motion.div>
    </section>
  );
}
