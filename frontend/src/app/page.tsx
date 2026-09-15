"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { FiHeart, FiSearch } from "react-icons/fi";
import { isLoggedIn, getUserRole } from "@/lib/auth";
import { ROLES, getRedirectPath } from "@/lib/rbac";
import ProductImage from "@/components/ui/ProductImage";

const NEW_PRODUCT_MS = 7 * 24 * 60 * 60 * 1000;
const NEW_PRODUCT_CUTOFF = Date.now() - NEW_PRODUCT_MS;

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
        const [productsRes, categoriesRes, bannersRes, menuItemsRes] = await Promise.all([
          api.get("/store/products"),
          api.get("/store/categories"),
          api.get("/banners"),
          api.get("/menu-items"),
        ]);

        setProducts(productsRes.data.data || []);
        setCategories(categoriesRes.data.data || []);
        setBanners((bannersRes.data.data || []).filter((b) => b.status === "active" || !b.status));
        setMenuItems((menuItemsRes.data.data || []).sort(
          (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
        ));
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

  const isProductNew = (createdAt?: string) => {
    if (!createdAt) return false;
    return new Date(createdAt).getTime() > NEW_PRODUCT_CUTOFF;
  };

  const formatPrice = (price: number | undefined) => {
    if (!price) return "$0";
    return `$${price.toLocaleString()}`;
  };

  if (redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-medium text-gray-800 dark:text-gray-200 tracking-wide uppercase">
            STORE
          </h1>
<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Discover the latest trends in fashion and curated picks powered by real backend data.
          </p>
        </div>

        {menuItems.length > 0 && (
          <div className="mb-8 flex flex-wrap justify-center gap-3">
            {menuItems.map((item) => (
              <a
                key={item._id}
                href={item.url || "/"}
                className="rounded-full border border-gray-200 bg-white dark:bg-gray-800 px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-700 dark:text-gray-300 hover:border-[#0F766E] hover:text-[#0F766E] transition"
              >
                {item.title}
              </a>
            ))}
          </div>
        )}

        {banners.length > 0 && (
          <section className="mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {banners.slice(0, 3).map((banner) => (
                <Link
                  key={banner._id}
                  href={banner.link_url || "/products"}
                  className="group relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800  transition hover:shadow-lg"
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
              ))}
            </div>
          </section>
        )}

        {categories.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-medium text-gray-800 dark:text-gray-200 tracking-wide uppercase">
                  Shop by Category
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Browse real categories loaded from the backend.
                </p>
              </div>
              <Link
                href="/products"
                className="text-sm font-medium text-[#0F766E] underline underline-offset-4 hover:text-[#0F766E]/80"
              >
                View all categories
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link
                  key={category._id}
                  href={`/products?category=${category.slug}`}
                  className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-center transition hover:border-[#0F766E] dark:hover:border-[#0F766E] hover:bg-[#ECFDF5]"
                >
                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    {category.category_name}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {products.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-medium text-gray-800 dark:text-gray-200 tracking-wide uppercase">
                  Recommended For You
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Personalized picks based on real product data.
                </p>
              </div>
              <Link
                href="/products"
                className="text-sm font-medium text-[#0F766E] underline underline-offset-4 hover:text-[#0F766E]/80"
              >
                Browse all products
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.slice(0, 4).map((product) => {
                const currentPrice = product.variants?.[0]?.price || product.price || 0;
                const comparePrice = product.variants?.[0]?.compare_price || product.compare_price || 0;
                const hasDiscount = comparePrice > currentPrice;

                return (
                  <Link
                    key={product._id}
                    href={`/products/${product.slug}`}
                    className="group block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="relative h-72 bg-gray-50 dark:bg-gray-800">
                      <ProductImage product={product} aspectRatio="aspect-[3/4]" />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                        {product.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {product.brand?.brand_name || product.category?.category_name}
                      </p>
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
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-medium text-gray-800 dark:text-gray-200 tracking-wide uppercase">
                Featured Products
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {filteredProducts.length} Products
              </p>
            </div>
            <Link
              href="/products"
              className="text-sm font-medium text-[#0F766E] underline underline-offset-4 hover:text-[#0F766E]/80"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.slice(0, 8).map((product) => {
              const currentPrice = product.variants?.[0]?.price || product.price || 0;
              const comparePrice = product.variants?.[0]?.compare_price || product.compare_price || 0;
              const hasDiscount = comparePrice > currentPrice;
              const isNew = isProductNew(product.created_at);

              return (
                <div
                  key={product._id}
                  className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                   <Link href={`/products/${product.slug}`} className="block relative">
                    <ProductImage
                      product={product}
                      aspectRatio="aspect-[3/4]"
                      badge={
                        <>
                          {isNew && (
                            <span className="bg-gray-900 text-white text-[10px] font-medium px-2 py-1 uppercase tracking-wider">
                              New
                            </span>
                          )}
                          {hasDiscount && (
                            <span className="bg-red-500 text-white text-[10px] font-medium px-2 py-1 uppercase tracking-wider">
                              Sale
                            </span>
                          )}
                        </>
                      }
                      overlayActions={
                        <>
                          <button className="w-8 h-8 bg-white dark:bg-gray-800 flex items-center justify-center  hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full">
                            <FiHeart size={14} className="text-gray-700 dark:text-gray-300" />
                          </button>
                          <button className="w-8 h-8 bg-white dark:bg-gray-800 flex items-center justify-center  hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full">
                            <FiSearch size={14} className="text-gray-700 dark:text-gray-300" />
                          </button>
                        </>
                      }
                    />
                  </Link>
                  <div className="p-4">
                     <Link href={`/products/${product.slug}`}>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 group-hover:text-[#0F766E] transition-colors line-clamp-2">
                        {product.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {product.brand?.brand_name || product.category?.category_name}
                    </p>
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
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
