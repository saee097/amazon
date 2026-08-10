"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getUser, getToken, removeToken } from "@/lib/auth";

export default function ProfilePage() {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = getToken();
        const user = getUser();

        if (!token || !user) {
          router.push("/auth/login");
          return;
        }

        if (user.role === "superadmin") {
          router.push("/admin/superadmin");
          return;
        }

        if (user.role === "admin") {
          router.push("/admin/dashboard");
          return;
        }

        const { data } = await api.get("/auth/profile");
        setCustomer(data.customer);
      } catch {
        removeToken();
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const logoutHandler = () => {
    removeToken();
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
          <h2 className="mt-6 text-2xl font-bold text-gray-800">
            Loading Profile
          </h2>
          <p className="text-gray-500 mt-2">
            Please wait while we fetch your information...
          </p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const fullName = `${customer?.first_name || customer?.firstName || ""} ${
    customer?.last_name || customer?.lastName || ""
  }`.trim() || "Customer";

  const menuItems = [
    { label: "Orders", href: "/orders", icon: "📦" },
    { label: "Addresses", href: "/addresses", icon: "🏠" },
    { label: "Wishlist", href: "/wishlist", icon: "❤️" },
    { label: "Settings", href: "/settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-light text-gray-800 mb-3">
            My Profile
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#0F766E] to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {fullName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {fullName || "Customer"}
                </h2>
                <p className="text-gray-600">{customer?.email}</p>
              </div>
            </div>
            <button
              onClick={logoutHandler}
              className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Account Status</p>
                <p className="text-lg font-semibold text-green-600">{customer?.status || "Active"}</p>
              </div>
              <span className="text-2xl">✅</span>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium text-gray-800">
                  {customer?.created_at ? new Date(customer.created_at).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <span className="text-2xl">📅</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-5">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Full Name</p>
                  <p className="font-medium text-gray-800">{fullName || "Not Available"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email Address</p>
                  <p className="font-medium text-gray-800 break-all">{customer?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                  <p className="font-medium text-gray-800">{customer?.phone || "Not Added"}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-5">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {menuItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <span className="text-2xl mb-2">{item.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Menu</h3>
              <nav className="space-y-2">
                <a href="/profile" className="block px-3 py-2 text-sm font-medium text-[#0F766E] bg-teal-50 rounded-lg">
                  Profile Overview
                </a>
                <a href="/orders" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50">
                  My Orders
                </a>
                <a href="/addresses" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50">
                  Address Book
                </a>
                <a href="/wishlist" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50">
                  Wishlist
                </a>
                <a href="/settings" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50">
                  Settings
                </a>
              </nav>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Contact our support team for any questions about your account.
              </p>
              <a
                href="/contact"
                className="inline-block px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-semibold hover:bg-[#0F766E]/90 transition"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}