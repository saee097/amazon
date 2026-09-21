"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaRegHeart } from "react-icons/fa6";

import {
  IoSettingsOutline,
  IoHomeOutline,
  IoBagHandleOutline,
  IoHeartOutline,
  IoPersonOutline,
  IoLogOutOutline,
  IoMailOutline,
  IoCallOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";

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

        setCustomer(
          data?.data ||
            data?.user ||
            data?.customer ||
            null
        );
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 w-full max-w-sm text-center ">
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

  const fullName =
    customer?.display_name ||
    `${customer?.first_name || customer?.firstName || ""} ${
      customer?.last_name || customer?.lastName || ""
    }`.trim() ||
    customer?.username ||
    "Customer";

  // Quick action icons
  const menuItems = [
    {
      label: "Orders",
      href: "/orders",
      icon: IoBagHandleOutline,
    },
    {
      label: "Addresses",
      href: "/addresses",
      icon: IoHomeOutline,
    },
    {
      label: "Wishlist",
      href: "/wishlist",
      icon: IoHeartOutline,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: IoSettingsOutline,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-5xl mx-auto">

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-light text-gray-800 mb-3">
            My Profile
          </h1>

          <p className="text-base sm:text-lg text-gray-600 px-4">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 mb-8 ">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 shrink-0 rounded-full bg-gradient-to-r from-[#0F766E] to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {fullName?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 break-words">
                  {fullName || "Customer"}
                </h2>

                <p className="text-gray-600 break-all">
                  {customer?.email || "No email available"}
                </p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logoutHandler}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition"
            >
              <IoLogOutOutline className="text-xl" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Account Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">

          {/* Account Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 ">
            <div className="flex items-center justify-between gap-4">

              <div>
                <p className="text-sm text-gray-500">
                  Account Status
                </p>

                <p className="text-lg font-semibold text-green-600 mt-1">
                  {customer?.status || "Active"}
                </p>
              </div>

              <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center">
                <IoCheckmarkCircleOutline className="text-2xl text-green-600" />
              </div>
            </div>
          </div>

          {/* Member Since */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 ">
            <div className="flex items-center justify-between gap-4">

              <div>
                <p className="text-sm text-gray-500">
                  Member Since
                </p>

                <p className="font-medium text-gray-800 mt-1">
                  {customer?.created_at
                    ? new Date(
                        customer.created_at
                      ).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>

              <div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center">
                <IoCalendarOutline className="text-2xl text-[#0F766E]" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Personal Information */}
          
<div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 ">
  {/* Header */}
  <div className="flex items-center gap-3 mb-6">
    <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
      <IoPersonOutline className="text-xl text-[#0F766E]" />
    </div>

    <div>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
        Personal Information
      </h2>

      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
        Your account details and contact information
      </p>
    </div>
  </div>

  {/* Information Grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

    {/* Full Name */}
    <div className="group rounded-lg border border-gray-200 bg-gray-50/70 p-4 hover:border-[#0F766E]/20 hover:bg-teal-50/30 transition-all duration-200">
      <div className="flex items-center gap-2 mb-2">
    

        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Full Name
        </p>
      </div>

      <p className="text-sm sm:text-base font-semibold text-gray-800 break-words">
        {fullName || "Not Available"}
      </p>
    </div>

    {/* Email Address */}
    <div className="group rounded-lg border border-gray-200 bg-gray-50/70 p-4 hover:border-[#0F766E]/20 hover:bg-teal-50/30 transition-all duration-200">
      <div className="flex items-center gap-2 mb-2">

        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Email Address
        </p>
      </div>

      <p className="text-sm sm:text-base font-semibold text-gray-800 break-all">
        {customer?.email || "Not Available"}
      </p>
    </div>

    {/* Phone Number */}
    <div className="group rounded-lg border border-gray-200 bg-gray-50/70 p-4 hover:border-[#0F766E]/20 hover:bg-teal-50/30 transition-all duration-200">
      <div className="flex items-center gap-2 mb-2">

        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Phone Number
        </p>
      </div>

      <p className="text-sm sm:text-base font-semibold text-gray-800 break-words">
        {customer?.phone || "Not Added"}
      </p>
    </div>

  </div>
</div>



            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 ">

              <h2 className="text-xl font-semibold text-gray-800 mb-5">
                Quick Actions
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                {menuItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex flex-col items-center justify-center p-4 border border-gray-200 hover:border-[#0F766E]/50 bg-gray-50 rounded-lg hover:bg-teal-50 transition"
                    >
                      <div className="w-11 h-11 rounded-full bg-white group-hover:bg-[#0F766E] flex items-center justify-center mb-2 transition">
                        <Icon className="text-2xl text-[#0F766E] group-hover:text-white transition" />
                      </div>

                      <span className="text-sm font-medium text-gray-700 group-hover:text-[#0F766E]">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}

              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">

            {/* Account Menu */}
        
<div className="bg-white rounded-xl border border-gray-200 p-5 ">
  {/* Header */}
  <div className="flex items-center gap-3 mb-5">
    <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
      <IoPersonOutline className="text-xl text-[#0F766E]" />
    </div>

    <div>
      <h3 className="text-lg font-semibold text-gray-800">
        Account Menu
      </h3>

      <p className="text-xs text-gray-500 mt-0.5">
        Manage your account
      </p>
    </div>
  </div>

  {/* Navigation */}
  <nav className="space-y-1.5">

    {/* Profile */}
    <Link
      href="/profile"
      className="group flex items-center justify-between px-3.5 py-3 rounded-lg border border-[#0F766E]/20 bg-teal-50 text-[#0F766E] transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <IoPersonOutline className="text-xl shrink-0" />

        <span className="text-sm font-semibold">
          Profile Overview
        </span>
      </div>

     
    </Link>

    {/* Orders */}
    <Link
      href="/orders"
      className="group flex items-center justify-between px-3.5 py-3 rounded-lg text-gray-600 hover:text-[#0F766E] hover:bg-teal-50 border border-transparent hover:border-[#0F766E]/20 transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <IoBagHandleOutline className="text-xl shrink-0 transition-transform duration-200 group-hover:scale-110" />

        <span className="text-sm font-medium">
          My Orders
        </span>
      </div>

    
    </Link>

    {/* Addresses */}
    <Link
      href="/addresses"
      className="group flex items-center justify-between px-3.5 py-3 rounded-lg text-gray-600 hover:text-[#0F766E] hover:bg-teal-50 border border-transparent hover:border-[#0F766E]/20 transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <IoHomeOutline className="text-xl shrink-0 transition-transform duration-200 group-hover:scale-110" />

        <span className="text-sm font-medium">
          Address Book
        </span>
      </div>

     
    </Link>

    {/* Wishlist */}
    <Link
      href="/wishlist"
      className="group flex items-center justify-between px-3.5 py-3 rounded-lg text-gray-600 hover:text-[#0F766E] hover:bg-teal-50 border border-transparent hover:border-[#0F766E]/20 transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <IoHeartOutline className="text-xl shrink-0 transition-transform duration-200 group-hover:scale-110" />

        <span className="text-sm font-medium">
          Wishlist
        </span>
      </div>

     
    </Link>

    {/* Settings */}
    <Link
      href="/settings"
      className="group flex items-center justify-between px-3.5 py-3 rounded-lg text-gray-600 hover:text-[#0F766E] hover:bg-teal-50 border border-transparent hover:border-[#0F766E]/20 transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <IoSettingsOutline className="text-xl shrink-0 transition-transform duration-200 group-hover:rotate-45" />

        <span className="text-sm font-medium">
          Settings
        </span>
      </div>

    
    </Link>

  </nav>
</div>



            {/* Help */}
         
<div className="bg-white rounded-xl border border-gray-200 p-5 ">
  {/* Header */}
  <div className="flex items-center gap-3 mb-4">
    <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
      <IoMailOutline className="text-xl text-[#0F766E]" />
    </div>

    <div>
      <h3 className="text-lg font-semibold text-gray-800">
        Need Help?
      </h3>

      <p className="text-xs text-gray-500 mt-0.5">
        We’re here to help
      </p>
    </div>
  </div>

  {/* Description */}
  <p className="text-sm leading-6 text-gray-600 mb-5">
    Have questions about your account, orders, or anything else?
    Our support team is ready to assist you.
  </p>

  {/* Support Button */}
  <Link
    href="/contact"
    className="group w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#0F766E] text-white rounded-lg text-sm font-semibold hover:bg-[#0F766E]/90 hover:shadow-md transition-all duration-200"
  >
    

    <span>
      Contact Support
    </span>

   
  </Link>
</div>


          </div>
        </div>
      </div>
    </div>
  );
}