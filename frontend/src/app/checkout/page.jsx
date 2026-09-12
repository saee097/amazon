"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const paymentMethod = "cash_on_delivery";
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.push("/auth/login");
      return;
    }

    const loadCheckout = async () => {
      try {
        const [cartRes, addressRes] = await Promise.all([
          api.get("/store/cart"),
          api.get("/addresses"),
        ]);
        setCart(cartRes.data.data || null);
        setAddresses(addressRes.data.data || []);
      } catch {
        removeToken();
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    loadCheckout();
  }, [router]);

  const cartItems = cart?.items || [];

  const placeOrder = async () => {
    if (cartItems.length === 0) {
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const idempotencyKey = `checkout_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      await api.post("/store/checkout", {
        couponCode,
        paymentMethod,
        addressId: selectedAddress,
        idempotencyKey,
      });
      router.push("/orders");
    } catch (err) {
      console.error("Failed to place order:", err);
      setError(err?.response?.data?.message || "We could not place your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-light text-gray-800 mb-3">
              Checkout
            </h1>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 w-full text-center">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-light text-gray-800 mb-3">
              Checkout
            </h1>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 w-full text-center">
            <p className="text-gray-500 mb-4">Your cart is empty.</p>
            <Link href="/products" className="text-sm font-medium text-[#0F766E] hover:underline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-light text-gray-800 mb-3">
            Checkout
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">
            Complete your purchase
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Shipping Address</h2>
              {addresses.length === 0 ? (
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span>No addresses found.</span>
                  <Link href="/addresses" className="font-medium text-[#0F766E] hover:underline">
                    Add a shipping address
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map((address) => (
                    <label
                      key={address._id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddress === address._id}
                        onChange={() => setSelectedAddress(address._id)}
                        className="text-[#0F766E]"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{address.street}</p>
                        <p className="text-sm text-gray-500">
                          {address.city}, {address.state && `${address.state},`} {address.country}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Method</h2>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                Cash on Delivery
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coupon Code
                </label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-500 outline-none transition focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]/20"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-800">${cart?.totals?.subtotal || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium text-gray-800">${cart?.totals?.shipping || 0}</span>
                </div>
                {cart?.totals?.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-${cart.totals.discount}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>${cart?.totals?.total || 0}</span>
                </div>
              </div>
              <button
                onClick={placeOrder}
                disabled={submitting || !selectedAddress}
                className="w-full py-3.5 bg-[#0F766E] text-white rounded-lg text-sm font-semibold hover:bg-[#0F766E]/90 transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? "Placing Order..." : "Place Order"}
              </button>
              {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
