"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";
import { notifyStoreUpdate } from "@/lib/storeEvents";
import ProductImage from "@/components/ui/ProductImage";
import { StorefrontSkeleton } from "@/components/ui/skeleton";

export default function WishlistPage() {
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push("/auth/login");
      return;
    }

    const loadWishlist = async () => {
      try {
        const { data } = await api.get("/store/wishlist");
        setWishlistItems(data.data || []);
      } catch {
        removeToken();
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [router]);

  const addToCart = async (productId) => {
    try {
      await api.post("/store/cart", { productId });
      notifyStoreUpdate();
      router.push("/cart");
    } catch (err) {
      console.error("Failed to add to cart:", err);
    }
  };

  if (loading) {
    return <StorefrontSkeleton variant="grid" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-light text-gray-800 mb-3">
            Wishlist
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">
            Your saved products for later
          </p>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 text-center">
            <p className="text-gray-500 mb-4">Your wishlist is empty.</p>
            <Link href="/products" className="text-sm font-medium text-[#0F766E] hover:underline">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <div key={item._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <ProductImage
                  product={item.product}
                  aspectRatio="aspect-[3/4]"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800">{item.product?.title || "Product"}</h3>
                  <p className="text-sm text-gray-500">{item.product?.category?.category_name}</p>
                  <p className="text-lg font-bold text-[#0F766E] mt-2">
                    ${item.product?.variants?.[0]?.price || item.product?.price || 0}
                  </p>
                  <button
                    onClick={() => addToCart(item.product._id)}
                    className="mt-3 w-full py-2.5 text-sm text-white bg-[#0F766E] rounded-lg hover:bg-[#0F766E]/90 transition"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}