"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { FiHeart, FiFilter, FiSliders, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ProductImage from "@/components/ui/ProductImage";
import FilterSidebar from "@/components/ui/FilterSidebar";
import { StorefrontSkeleton } from "@/components/ui/skeleton";
import { getToken } from "@/lib/auth";
import { notifyStoreUpdate, subscribeStoreUpdate } from "@/lib/storeEvents";

const NEW_PRODUCT_CUTOFF = Date.now() - 7 * 24 * 60 * 60 * 1000;
const ITEMS_PER_PAGE = 12;

type Product = {
  _id: string;
  title: string;
  price?: number;
  compare_price?: number;
  slug: string;
  category?: { _id: string; category_name: string; slug?: string };
  gender?: string;
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
  slug: string;
};

type Filters = {
  category?: string;
  inStock?: boolean;
  outOfStock?: boolean;
  sizes?: string[];
  colors?: string[];
  genders?: string[];
  priceMin?: string;
  priceMax?: string;
};

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const categoryFromUrl = searchParams.get("category") || "";
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadedCategory, setLoadedCategory] = useState<string | null>(null);
  const loading = loadedCategory !== categoryFromUrl;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageSelection, setPageSelection] = useState({ category: categoryFromUrl, page: 1 });
  const currentPage = pageSelection.category === categoryFromUrl ? pageSelection.page : 1;
  const setCurrentPage = (page: number) => setPageSelection({ category: categoryFromUrl, page });
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Filters>({
    category: categoryFromUrl,
    inStock: searchParams.get("inStock") === "true",
    outOfStock: searchParams.get("outOfStock") === "true",
    sizes: searchParams.get("sizes")?.split(",").filter(Boolean) || [],
    colors: searchParams.get("colors")?.split(",").filter(Boolean) || [],
    genders: searchParams.get("gender")?.split(",").filter(Boolean) || [],
    priceMin: searchParams.get("minPrice") || "",
    priceMax: searchParams.get("maxPrice") || "",
  });
  const activeFilters = useMemo(
    () => ({ ...filters, category: categoryFromUrl }),
    [filters, categoryFromUrl]
  );

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: "100" });
    if (categoryFromUrl) params.set("category", categoryFromUrl);

    api.get(`/store/products?${params.toString()}`, { signal: controller.signal })
      .then(({ data }) => setProducts(data.data || []))
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("Failed to load products:", error);
          setProducts([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadedCategory(categoryFromUrl);
      });

    return () => controller.abort();
  }, [categoryFromUrl]);

  useEffect(() => {
    const controller = new AbortController();
    api.get("/store/categories", { signal: controller.signal })
      .then(({ data }) => setCategories(data.data || []))
      .catch((error) => {
        if (!controller.signal.aborted) console.error("Failed to load categories:", error);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!getToken()) return;
      try {
        const { data } = await api.get("/store/wishlist");
        const ids = new Set<string>((data.data || []).map((p: { _id: string }) => p._id));
        setWishlistItems(ids);
      } catch {
        setWishlistItems(new Set());
      }
    };
    fetchWishlist();
    return subscribeStoreUpdate(fetchWishlist);
  }, []);

  const toggleWishlist = async (productId: string) => {
    if (!getToken()) {
      router.push("/auth/login");
      return;
    }
    try {
      await api.post("/store/wishlist", { productId });
      setWishlistItems((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        return next;
      });
      notifyStoreUpdate();
    } catch (err) {
      console.error("Failed to update wishlist:", err);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        !activeFilters.category ||
        p.category?.slug?.toLowerCase() === activeFilters.category.toLowerCase() ||
        p.category?.category_name.toLowerCase() === activeFilters.category.toLowerCase() ||
        p.category?.category_name.toLowerCase().includes(activeFilters.category.toLowerCase());

      const hasInStock = p.variants?.some((v) => (v.inventory_quantity ?? 0) > 0) ?? false;
      const matchesStock =
        !(activeFilters.inStock || activeFilters.outOfStock) ||
        (activeFilters.inStock && activeFilters.outOfStock) ||
        (activeFilters.inStock && hasInStock) ||
        (activeFilters.outOfStock && !hasInStock);

      const variantSizes = new Set(p.variants?.map((v) => v.size).filter(Boolean) || []);
      const variantColors = new Set(p.variants?.map((v) => v.color).filter(Boolean) || []);
      const matchesSize =
        (activeFilters.sizes?.length ?? 0) === 0 ||
        (activeFilters.sizes?.some((s) => variantSizes.has(s)) ?? true);
      const matchesColor =
        (activeFilters.colors?.length ?? 0) === 0 ||
        (activeFilters.colors?.some((c) => variantColors.has(c)) ?? true);

      const matchesGender =
        (activeFilters.genders?.length ?? 0) === 0 ||
        (activeFilters.genders?.some((g) => p.gender === g) ?? true);

      const allPrices = p.variants?.map((v) => v.price) || [p.price || 0];
      const minProductPrice = Math.min(...allPrices.filter(Boolean));
      const maxProductPrice = Math.max(...allPrices.filter(Boolean));
      const minFilter = activeFilters.priceMin ? Number(activeFilters.priceMin) : null;
      const maxFilter = activeFilters.priceMax ? Number(activeFilters.priceMax) : null;
      const matchesPrice =
        !minFilter && !maxFilter ||
        (minFilter === null || maxProductPrice >= minFilter) &&
        (maxFilter === null || minProductPrice <= maxFilter);

      return matchesCategory && matchesStock && matchesSize && matchesColor && matchesGender && matchesPrice;
    });
  }, [products, activeFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const formatPrice = (price: number | undefined) => {
    if (!price) return "$0";
    return `$${price.toLocaleString()}`;
  };

  const hasActiveFilters = activeFilters.inStock || activeFilters.outOfStock || 
    (activeFilters.sizes?.length ?? 0) > 0 || (activeFilters.colors?.length ?? 0) > 0 || 
    (activeFilters.genders?.length ?? 0) > 0 ||
    activeFilters.priceMin || activeFilters.priceMax || activeFilters.category;

  const handleFiltersChange = (newFilters: Partial<Filters>) => {
    const updated = { ...activeFilters, ...newFilters };
    setFilters(updated);
    
    const params = new URLSearchParams(searchParams.toString());
    if (updated.category) params.set("category", updated.category);
    else params.delete("category");
    if (updated.inStock) params.set("inStock", "true");
    else params.delete("inStock");
    if (updated.outOfStock) params.set("outOfStock", "true");
    else params.delete("outOfStock");
    if (updated.sizes && updated.sizes.length > 0) params.set("sizes", updated.sizes.join(","));
    else params.delete("sizes");
    if (updated.colors && updated.colors.length > 0) params.set("colors", updated.colors.join(","));
    else params.delete("colors");
    if (updated.genders && updated.genders.length > 0) params.set("gender", updated.genders.join(","));
    else params.delete("gender");
    if (updated.priceMin) params.set("minPrice", updated.priceMin);
    else params.delete("minPrice");
    if (updated.priceMax) params.set("maxPrice", updated.priceMax);
    else params.delete("maxPrice");
    
     router.push(`${pathname}?${params.toString()}`);
     setCurrentPage(1);
   };

   const clearAllFilters = () => {
     const cleared: Filters = {
       category: "",
       inStock: false,
       outOfStock: false,
       sizes: [],
       colors: [],
       genders: [],
       priceMin: "",
       priceMax: "",
     };
     setFilters(cleared);
     router.push(pathname);
     setCurrentPage(1);
   };

  if (loading) {
    return <StorefrontSkeleton variant="grid" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero/Header */}
        <section className="mb-6">
          <div className="py-4 sm:py-6">
            <nav className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              <Link href="/" className="hover:text-[#0F766E]">Home</Link>
              <FiChevronRight size={12} aria-hidden="true" />
              <span className="text-gray-900 dark:text-gray-100">
                {activeFilters.category ? activeFilters.category.charAt(0).toUpperCase() + activeFilters.category.slice(1) : "All Products"}
              </span>
            </nav>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <h1 className="text-2xl font-semibold tracking-wide text-gray-900 dark:text-gray-100 sm:text-3xl uppercase">
                {activeFilters.category ? activeFilters.category.charAt(0).toUpperCase() + activeFilters.category.slice(1) : "All Products"}
              </h1>
              <div className="flex items-center gap-4">
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0F766E] hover:text-[#0F766E]/80 hover:bg-[#0F766E]/5 rounded-lg transition"
                  >
                    <FiX size={12} />
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Category Tabs */}
        <section className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-16 z-40">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 overflow-x-auto overscroll-x-contain whitespace-nowrap touch-pan-x scrollbar-hide sm:gap-6">
              <Link
                href="/products"
                className={`shrink-0 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  !activeFilters.category ? "border-[#0F766E] text-[#0F766E]" : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                View All
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/products?category=${cat.slug}`}
                  className={`shrink-0 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeFilters.category === cat.slug || activeFilters.category === cat.category_name.toLowerCase()
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {cat.category_name.toUpperCase()}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Mobile Filter Bar */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <FiSliders size={18} />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-5 h-5 flex items-center justify-center bg-[#0F766E] text-white text-[10px] font-bold rounded-full">
                 {(activeFilters.sizes?.length || 0) + (activeFilters.colors?.length || 0) + (activeFilters.genders?.length || 0) + (activeFilters.inStock ? 1 : 0) + (activeFilters.outOfStock ? 1 : 0) + (activeFilters.priceMin ? 1 : 0) + (activeFilters.priceMax ? 1 : 0) + (activeFilters.category ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filter Sidebar + Main Content (side by side on desktop) */}
        <div className="mt-6 lg:mt-8 lg:flex lg:items-start lg:gap-8">
          {/* Filter Sidebar */}
          <FilterSidebar
            key={categoryFromUrl}
            products={products}
            categories={categories}
            initialFilters={activeFilters}
            onFiltersChange={handleFiltersChange}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Main Content */}
          <section className="w-full px-4 py-8 lg:h-[calc(100vh-8rem)] lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-width:none] lg:[-ms-overflow-style:none] lg:[&::-webkit-scrollbar]:hidden">
            <main>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <FiFilter className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No products found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Try adjusting your filters or search terms.</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F766E] text-white text-sm font-medium rounded-lg hover:bg-[#0F766E]/90 transition"
                  >
                    <FiX size={14} />
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProducts.map((product) => {
                  const firstVariant = product.variants?.[0];
                  const currentPrice = firstVariant?.price || product.price || 0;
                  const comparePrice = firstVariant?.compare_price || product.compare_price || 0;
                  const hasDiscount = comparePrice > currentPrice;
                  const isNew = product.created_at
                    ? new Date(product.created_at).getTime() > NEW_PRODUCT_CUTOFF
                    : false;

                  return (
                    <div key={product._id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden group">
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
                               <button
                                 type="button"
                                 onClick={() => toggleWishlist(product._id)}
                                 className={`w-8 h-8 bg-white dark:bg-gray-800 flex items-center justify-center rounded-full transition-colors ${
                                   wishlistItems.has(product._id)
                                     ? "hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                                     : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                 }`}
                                 aria-label={wishlistItems.has(product._id) ? "Remove from wishlist" : "Add to wishlist"}
                               >
                                 <FiHeart
                                   size={16}
                                   className={wishlistItems.has(product._id) ? "fill-current" : ""}
                                 />
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
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  aria-label="Previous page"
                >
                  <FiChevronLeft size={16} />
                </button>
                {(totalPages <= 4
                  ? Array.from({ length: totalPages }, (_, index) => index + 1)
                  : [1, 2, -1, totalPages]
                ).map((pageNum, index) => pageNum === -1 ? (
                  <span key={`ellipsis-${index}`} aria-hidden="true" className="px-1 text-gray-400 dark:text-gray-500">…</span>
                ) : (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${
                      currentPage === pageNum
                        ? "bg-[#0F766E] text-white"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                    aria-label={`Page ${pageNum}`}
                    aria-current={currentPage === pageNum ? "page" : undefined}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  aria-label="Next page"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            )}
          </main>
        </section>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<StorefrontSkeleton variant="grid" />}>
      <ProductsContent />
    </Suspense>
  );
}
