"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const { data } = await api.get("/coupons");
        setCoupons(data.data || []);
      } catch (error) {
        console.error("Failed to load coupons:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCoupons();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Coupons</h1>
        <a
          href="/admin/coupons/create"
          className="px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 transition"
        >
          Create Coupon
        </a>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {coupons.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No coupons found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Code</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Value</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {coupons.map((coupon) => (
                <tr key={coupon._id}>
                  <td className="px-6 py-4 font-medium">{coupon.code}</td>
                  <td className="px-6 py-4">{coupon.discount_type}</td>
                  <td className="px-6 py-4">
                    {coupon.discount_type === "percentage"
                      ? `${coupon.discount_value}%`
                      : `$${coupon.discount_value}`}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        coupon.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {coupon.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}