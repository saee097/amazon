"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push("/auth/login");
      return;
    }

    const loadOrders = async () => {
      try {
        const { data } = await api.get("/store/orders");
        setOrders(data.data || []);
      } catch {
        removeToken();
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-light text-gray-800 mb-3">
              My Orders
            </h1>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 w-full text-center">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
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
            My Orders
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">
            Track and view your order history
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 text-center">
            <p className="text-gray-500 mb-4">You have no orders yet.</p>
            <Link href="/products" className="text-sm font-medium text-[#0F766E] hover:underline">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">
                    Order #{order.order_number?.toString().slice(-6).toUpperCase()}
                  </h3>
                  <span
                    className={`text-sm px-3 py-1 rounded-full ${
                      order.order_status === "delivered"
                        ? "bg-green-100 text-green-800"
                        : order.order_status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {order.order_status}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total:</span>
                    <span className="font-medium ml-2">${order.total || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Payment:</span>
                    <span className="ml-2">{order.payment_status}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Items:</span>
                    <span className="ml-2">{order.items?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}