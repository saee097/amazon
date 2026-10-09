"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { isLoggedIn, getUserRole } from "@/lib/auth";
import { ROLES, getRedirectPath } from "@/lib/rbac";
import { motion } from "framer-motion";
import ProductSection from "@/components/ui/ProductSection";
import CustomerReviews, { Review } from "@/components/ui/CustomerReviews";
import { StorefrontSkeleton } from "@/components/ui/skeleton";
import { fadeUp, containerStagger, scaleIn } from "@/lib/motion";

type Product = {
  _id: string;
  title: string;
  price?: number;
  compare_price?: number;
  slug: string;
  category?: { _id: string; category_name: string; slug?: string };
  brand?: { _id: string; brand_name: string };
  variants?: {
    _id: string;
    size: string;
    color: string;
    price: number;
    compare_price?: number;
    inventory_quantity: number;
  }[];
  image?: { image_url: string; alt_text?: string };
  created_at?: string;
  reviews?: Array<{
    _id: string;
    rating: number;
    comment: string;
    customer?: { name?: string; first_name?: string; last_name?: string };
    created_at?: string;
  }>;
};

type Category = {
  _id: string;
  category_name: string;
  slug?: string;
};

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<{ _id: string; heading?: string; subheading?: string; image?: string; link_url?: string }[]>([]);
  const [menuItems, setMenuItems] = useState<{ _id: string; title: string; url?: string; sort_order?: number }[]>([]);
  const [reviews, setReviews] = useState<Array<Review>>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [redirecting, setRedirecting] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (isLoggedIn()) {
        const role = getUserRole();
        if (role === ROLES.ADMIN || role === ROLES.SUPERADMIN) {
          router.replace(getRedirectPath(role));
          return;
        }
      }
      if (!cancelled) {
        setRedirecting(false);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (redirecting) return;
    const loadData = async () => {
      try {
        const results = await Promise.allSettled([
          api.get("/store/products"),
          api.get("/store/categories"),
          api.get("/banners"),
          api.get("/menu-items"),
          api.get("/store/products?limit=10&sort=-created_at"),
          api.get("/store/reviews"),
        ]);

        const [productsRes, categoriesRes, bannersRes, menuItemsRes, recentProductsRes, reviewsRes] = results.map((r, i) => {
          if (r.status === "rejected") {
            console.error(`Failed to load endpoint ${i}:`, r.reason);
            return { data: { data: [] } };
          }
          return r.value;
        });

        setProducts(productsRes.data.data || []);
        setCategories(categoriesRes.data.data || []);
        setBanners((bannersRes.data.data || []).filter((b: { status?: string }) => b.status === "active" || !b.status));
        setMenuItems((menuItemsRes.data.data || []).sort(
          (a: { sort_order?: number }, b: { sort_order?: number }) => (a.sort_order || 0) - (b.sort_order || 0)
        ));

        const recentProducts: Product[] = recentProductsRes.data.data || [];
        setNewArrivals(recentProducts);

        // Only display reviews that have been approved by an admin
        const fetchedReviews: Review[] = reviewsRes.data.data || [];
        setReviews(
          fetchedReviews.filter((r) => r.status === "approved" || r.status === "active")
        );
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [redirecting]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.category_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        !activeCategory ||
        p.category?.slug?.toLowerCase() === activeCategory.toLowerCase() ||
        p.category?.category_name.toLowerCase().includes(activeCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  if (redirecting) {
    return <StorefrontSkeleton variant="default" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <motion.div
          className="text-center mb-10"
          initial="initial"
          animate="animate"
          variants={containerStagger}
        >
          <motion.h1
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-medium text-gray-800 dark:text-gray-200 tracking-wide uppercase"
          >
            STORE
          </motion.h1>
          <motion.p variants={fadeUp} className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Discover the latest trends in fashion and curated picks powered by real backend data.
          </motion.p>
        </motion.div>

        {menuItems.length > 0 && (
          <motion.div
            className="-mx-4 mb-8 flex flex-nowrap justify-start gap-3 overflow-x-auto overscroll-x-contain touch-pan-x px-4 pb-2 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:flex-wrap lg:justify-center lg:overflow-visible lg:px-0 lg:pb-0"
            variants={containerStagger}
            initial="initial"
            animate="animate"
          >
            {menuItems.map((item) => (
              <motion.a
                key={item._id}
                href={item.url || "/"}
                variants={scaleIn}
                whileHover={{ scale: 1.05 }}
                className="shrink-0 snap-start rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-700 transition hover:border-[#0F766E] hover:text-[#0F766E] dark:bg-gray-800 dark:text-gray-300"
              >
                {item.title}
              </motion.a>
            ))}
          </motion.div>
        )}

        {banners.length > 0 && (
          <motion.section
            className="mb-10"
            initial="initial"
            animate="animate"
            variants={containerStagger}
          >
            <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pb-2 touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 lg:pb-0">
              {banners.slice(0, 3).map((banner) => (
                <motion.div
                  key={banner._id}
                  variants={fadeUp}
                  whileHover={{ scale: 1.02 }}
                  className="w-[85vw] min-w-[85vw] snap-start sm:w-[min(70vw,32rem)] sm:min-w-[min(70vw,32rem)] lg:w-auto lg:min-w-0"
                >
                  <Link
                    href={banner.link_url || "/products"}
                    className="group relative block overflow-hidden rounded-3xl border border-gray-200 bg-white transition dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={banner.image}
                        alt={banner.heading || "Banner"}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <p className="text-sm uppercase tracking-[0.3em] text-[#0F766E]">
                        {banner.subheading}
                      </p>
                      <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {banner.heading}
                      </h2>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {categories.length > 0 && (
          <motion.section
            className="mb-10"
            initial="initial"
            animate="animate"
            variants={containerStagger}
          >
            <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <motion.h2
                  variants={fadeUp}
                  className="text-xl font-medium tracking-wide text-gray-800 dark:text-gray-200 sm:text-2xl uppercase"
                >
                  Shop by Category
                </motion.h2>
                <motion.p variants={fadeUp} className="mt-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                  Browse real categories loaded from the backend.
                </motion.p>
              </div>
              <Link
                href="/products"
                className="w-fit text-xs font-medium text-[#0F766E] underline underline-offset-4 hover:text-[#0F766E]/80 sm:text-sm"
              >
                View all categories
              </Link>
            </div>

            <motion.div
              className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-4 sm:mx-0 sm:gap-4 sm:px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              role="list"
              aria-label="Product categories"
              variants={containerStagger}
            >
              {categories.map((category) => (
                <motion.div
                  key={category._id}
                  variants={scaleIn}
                  className="w-[min(72vw,12rem)] min-w-[min(72vw,12rem)] snap-start rounded-2xl border border-gray-200 bg-white p-3 text-center transition-colors hover:border-[#0F766E]/50 dark:border-gray-700 dark:bg-gray-800 sm:w-48 sm:min-w-48 sm:rounded-3xl sm:p-4"
                  role="listitem"
                >
                  <Link
                    href={`/products?category=${category.slug}`}
                    className="group block"
                  >
                    <p className="break-words text-xs font-semibold uppercase tracking-wide text-gray-700 transition-colors group-hover:text-[#0F766E] dark:text-gray-300 sm:text-sm">
                      {category.category_name}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}

        {newArrivals.length > 0 && (
          <ProductSection
            title="New Arrivals"
            subtitle="Freshly added products you need to see."
            products={newArrivals}
            limit={4}
            showNewBadge
            showSaleBadge
            showOverlayActions
            viewAllHref="/products"
          />
        )}

        {filteredProducts.length > 0 && (
          <ProductSection
            title="Recommended For You"
            subtitle="Personalized picks based on real product data."
            products={filteredProducts}
            limit={4}
            showSaleBadge
            viewAllHref="/products"
            viewAllLabel="Browse all products"
          />
        )}

        {filteredProducts.length > 0 && (
          <ProductSection
            title="Featured Products"
            subtitle={`${filteredProducts.length} Products`}
            products={filteredProducts}
            limit={8}
            showNewBadge
            showSaleBadge
            showOverlayActions
            viewAllHref="/products"
          />
        )}

        <CustomerReviews reviews={reviews.slice(0, 3)} />
      </div>
    </div>
  );
}
