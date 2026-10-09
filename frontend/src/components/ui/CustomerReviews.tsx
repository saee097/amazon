"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiStar } from "react-icons/fi";
import { fadeUp, containerStagger } from "@/lib/motion";

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
  const [activePage, setActivePage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const getCardsPerPage = () =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches ? 3 : 1;

  const getPageCount = useCallback(
    () => Math.max(1, Math.ceil(reviews.length / getCardsPerPage())),
    [reviews.length]
  );

  const updateActivePage = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const { scrollLeft, clientWidth } = track;
    const pageWidth = clientWidth || 1;
    setActivePage(Math.min(getPageCount() - 1, Math.round(scrollLeft / pageWidth)));
  }, [getPageCount]);

  useEffect(() => {
    updateActivePage();
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", updateActivePage, { passive: true });
    return () => track.removeEventListener("scroll", updateActivePage);
  }, [updateActivePage]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || reviews.length < 2 || isPaused || !isSmallScreen) return;
    const timer = window.setInterval(() => {
      const pageCount = getPageCount();
      const nextPage = activePage + 1 >= pageCount ? 0 : activePage + 1;
      track.scrollTo({ left: nextPage * track.clientWidth, behavior: "smooth" });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [activePage, getPageCount, isPaused, isSmallScreen, reviews.length]);

  useEffect(() => {
    const handleResize = () => updateActivePage();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateActivePage]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const updateScreenSize = () => setIsSmallScreen(mediaQuery.matches);
    updateScreenSize();
    mediaQuery.addEventListener("change", updateScreenSize);
    return () => mediaQuery.removeEventListener("change", updateScreenSize);
  }, []);

  const goToPage = (page: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: page * track.clientWidth, behavior: "smooth" });
  };

  if (!reviews.length) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-medium text-gray-800 dark:text-gray-200 tracking-wide uppercase">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        </div>
      </div>

      <motion.div
        ref={trackRef}
        variants={containerStagger}
        initial="initial"
        animate="animate"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPaused(false);
        }}
        className="relative flex items-stretch gap-0 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 lg:gap-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]"
      >
        {reviews.map((review) => {
          const customerName =
            review.customer?.name || review.customer?.first_name || "Anonymous";
          const initial = customerName.charAt(0).toUpperCase() || "U";
          return (
            <motion.div
              key={review._id}
              variants={fadeUp}
              className="review-card w-full flex-none snap-start sm:w-full lg:w-[calc((100%-3rem)/3)]"
            >
              <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
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

      </motion.div>
      {reviews.length > 1 && (
        <div className="mt-4 flex justify-center gap-2 sm:hidden" role="group" aria-label="Choose review page">
          {Array.from({ length: getPageCount() }, (_, page) => (
            <button
              key={page}
              type="button"
              aria-label={`Go to review page ${page + 1}`}
              aria-current={activePage === page ? "true" : undefined}
              onClick={() => goToPage(page)}
              className={`h-2.5 rounded-full transition-all ${activePage === page ? "w-6 bg-[#0F766E]" : "w-2.5 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
