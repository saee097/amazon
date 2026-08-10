"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { FiSearch, FiHeart } from "react-icons/fi";
import ProductImage from "@/components/ui/ProductImage";

const NEW_PRODUCT_CUTOFF = Date.now() - 7 * 24 * 60 * 60 * 1000;

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
  slug: string;
};

function ProductsContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get("/store/products"),
          api.get("/store/categories"),
        ]);
        setProducts(productsRes.data.data || []);
        setCategories(categoriesRes.data.data || []);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.category_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !category ||
      p.category?.slug?.toLowerCase() === category.toLowerCase() ||
      p.category?.category_name.toLowerCase() === category.toLowerCase() ||
      p.category?.category_name.toLowerCase().includes(category.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price: number | undefined) => {
    if (!price) return "$0";
    return `$${price.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero/Header */}
      <section className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-xs text-gray-500 mb-4">
            <Link href="/" className="hover:text-[#0F766E]">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">
              {category ? category.charAt(0).toUpperCase() + category.slice(1) : "All Products"}
            </span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-medium text-gray-800 tracking-wide uppercase">
              {category ? category.charAt(0).toUpperCase() + category.slice(1) : "All Products"}
            </h1>
            <p className="text-sm text-gray-500">{filteredProducts.length} Products</p>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="border-b border-gray-200 bg-white sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
            <Link
              href="/products"
              className={`py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                !category ? "border-[#0F766E] text-[#0F766E]" : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              View All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat._id}
                href={`/products?category=${cat.slug}`}
                className={`py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  category === cat.slug || category === cat.category_name.toLowerCase()
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

      {/* Main Content */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-32">
              {/* Search */}
              <div className="mb-8">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                  />
                  <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                </div>
              </div>

              {/* Availability */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Availability</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span>In Stock ({products.filter(p => (p.variants?.some(v => (v.inventory_quantity ?? 0) > 0) ?? false)).length})</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span>Out of Stock ({products.filter(p => !p.variants?.some(v => (v.inventory_quantity ?? 0) > 0)).length})</span>
                  </label>
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Product Category</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat._id}
                      href={`/products?category=${cat.slug}`}
                      className={`block text-sm py-1 ${
                        category === cat.slug || category === cat.category_name.toLowerCase()
                          ? "text-gray-900 font-medium"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {cat.category_name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                    <button
                      key={size}
                      className="px-3 py-1 border border-gray-300 text-xs text-gray-600 hover:border-gray-900 hover:text-gray-900 transition"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Color Family</h3>
                <div className="space-y-2">
                  {["Black", "White", "Beige", "Blue", "Green", "Pink", "Red", "Maroon"].map((color) => (
                    <label key={color} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span>{color}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Price</h3>
                <div className="flex items-center gap-2">
                  <input type="text" placeholder="Min" className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" />
                  <span className="text-gray-400">-</span>
                  <input type="text" placeholder="Max" className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" />
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">No products found in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const firstVariant = product.variants?.[0];
                  const currentPrice = firstVariant?.price || product.price || 0;
                  const comparePrice = firstVariant?.compare_price || product.compare_price || 0;
                  const hasDiscount = comparePrice > currentPrice;
                  const isNew = product.created_at
                    ? new Date(product.created_at).getTime() > NEW_PRODUCT_CUTOFF
                    : false;

                  return (
                    <div key={product._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow">
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
                              <button className="w-8 h-8 bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 rounded-full">
                                <FiHeart size={14} className="text-gray-700" />
                              </button>
                              <button className="w-8 h-8 bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 rounded-full">
                                <FiSearch size={14} className="text-gray-700" />
                              </button>
                            </>
                          }
                        />
                      </Link>
                      <div className="p-4">
                         <Link href={`/products/${product.slug}`}>
                          <h3 className="text-sm font-medium text-gray-900 mb-1 group-hover:text-[#0F766E] transition-colors line-clamp-2">
                            {product.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-gray-500 mb-2">
                          {product.brand?.brand_name || product.category?.category_name}
                        </p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatPrice(currentPrice)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-gray-400 line-through">
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

            {/* Load More */}
            {filteredProducts.length > 12 && (
              <div className="text-center mt-12">
                <button className="px-8 py-3 bg-[#0F766E] text-white text-sm font-medium hover:bg-[#0F766E]/90 transition rounded-lg">
                  LOAD MORE
                </button>
              </div>
            )}
          </main>
        </div>
      </section>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500">Loading products...</p>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
