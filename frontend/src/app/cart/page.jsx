"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";
import ProductImage from "@/components/ui/ProductImage";

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push("/auth/login");
      return;
    }

    const loadCart = async () => {
      try {
        const { data } = await api.get("/store/cart");
        setCart(data.data || null);
        setCartItems(data.data?.items || []);
      } catch {
        removeToken();
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-light text-gray-800 dark:text-gray-200 mb-3">
              Shopping Cart
            </h1>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8 w-full text-center">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading cart...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-light text-gray-800 dark:text-gray-200 mb-3">
            Shopping Cart
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 px-4">
            Review your cart before checkout
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">Your cart is empty.</p>
            <Link href="/products" className="text-sm font-medium text-[#0F766E] hover:underline">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex items-center gap-4 py-4 border-b last:border-0">
                    <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                      <ProductImage
                        product={item.product}
                        aspectRatio="aspect-square"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800 dark:text-gray-200">{item.product?.title || "Product"}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Qty: {item.quantity} | ${item.price} each
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        ${item.lineTotal || item.price * item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Summary</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">${cart?.totals?.subtotal || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Shipping</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">${cart?.totals?.shipping || 0}</span>
                  </div>
                  {cart?.totals?.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-${cart.totals.discount}</span>
                    </div>
                  )}
                  <div className="border-t dark:border-gray-700 pt-2 flex justify-between font-bold">
                    <span className="text-gray-700 dark:text-gray-300">Total</span>
                    <span className="text-gray-900 dark:text-gray-100">${cart?.totals?.total || 0}</span>
                  </div>
                </div>
                <Link
                  href="/checkout"
                  className="block w-full text-center py-3 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 transition"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
