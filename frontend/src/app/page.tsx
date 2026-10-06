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
            className="mb-8 flex flex-wrap justify-center gap-3"
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
                className="rounded-full border border-gray-200 bg-white dark:bg-gray-800 px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-700 dark:text-gray-300 hover:border-[#0F766E] hover:text-[#0F766E] transition"
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {banners.slice(0, 3).map((banner) => (
                <motion.div
                  key={banner._id}
                  variants={fadeUp}
                  whileHover={{ scale: 1.02 }}
                >
                  <Link
                    href={banner.link_url || "/products"}
                    className="group relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition"
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <motion.h2
                  variants={fadeUp}
                  className="text-2xl font-medium text-gray-800 dark:text-gray-200 tracking-wide uppercase"
                >
                  Shop by Category
                </motion.h2>
                <motion.p variants={fadeUp} className="text-sm text-gray-500 mt-1">
                  Browse real categories loaded from the backend.
                </motion.p>
              </div>
              <Link
                href="/products"
                className="text-sm font-medium text-[#0F766E] underline underline-offset-4 hover:text-[#0F766E]/80"
              >
                View all categories
              </Link>
            </div>

            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
              variants={containerStagger}
            >
              {categories.map((category) => (
                <motion.div
                  key={category._id}
                  variants={scaleIn}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-4 text-center"
                >
                  <Link
                    href={`/products?category=${category.slug}`}
                    className="group block"
                  >
                    <p className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300 group-hover:text-[#0F766E] transition-colors">
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

        <CustomerReviews reviews={reviews} />
      </div>
    </div>
  );
}
