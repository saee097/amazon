"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import ProductImage from "@/components/ui/ProductImage";
import { StorefrontSkeleton } from "@/components/ui/skeleton";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const searchProducts = async () => {
      try {
        const { data } = await api.get(`/store/products?q=${encodeURIComponent(query)}`);
        setProducts(data.data || []);
      } catch (err) {
        console.error("Failed to search products:", err);
      } finally {
        setLoading(false);
      }
    };

    searchProducts();
  }, [query]);

  if (loading) {
    return <StorefrontSkeleton variant="grid" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Search Results for: {query}
        </h1>

        {products.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No products found for your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product._id}
                href={`/products/${product.slug}`}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow"
              >
                <ProductImage
                  product={product}
                  aspectRatio="aspect-[3/4]"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 group-hover:text-[#0F766E] transition-colors">{product.title}</h3>
                  <p className="text-sm text-gray-500">{product.category?.category_name}</p>
                  <p className="text-lg font-bold text-[#0F766E] mt-2">
                    ${product.variants?.[0]?.price || product.price || 0}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<StorefrontSkeleton variant="grid" />}>
      <SearchResults />
    </Suspense>
  );
}
