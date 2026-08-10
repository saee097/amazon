"use client";

import Link from "next/link";
import { FiShield, FiArrowLeft } from "react-icons/fi";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md mx-auto text-center">
        <div className="mb-6">
          <FiShield className="w-20 h-20 mx-auto text-red-400" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-light text-gray-800 mb-3">
          Access Denied
        </h1>
        <p className="text-base sm:text-lg text-gray-600 px-4 mb-8">
          You do not have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 transition"
        >
          <FiArrowLeft className="w-4 h-4" />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
