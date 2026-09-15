"use client";

import {
  Tag,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import ResourceManager from "@/components/admin/ResourceManager";
import StatusBadge from "@/components/StatusBadge";

export default function AdminCoupons() {
  const couponColumns = [
    {
      key: "code",
      header: "Code",
      render: (item) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {item.code || "-"}
        </span>
      ),
      priority: "high",
    },
    {
      key: "discount_type",
      header: "Type",
      render: (item) => <span>{item.discount_type || "-"}</span>,
      priority: "high",
    },
    {
      key: "discount_value",
      header: "Value",
      render: (item) => {
        const val = item.discount_value ?? 0;
        return item.discount_type === "percentage" ? `${val}%` : `$${val}`;
      },
      priority: "high",
    },
    {
      key: "status",
      header: "Status",
      render: (item) => {
        const status = item.status || (item.isActive ? "active" : "inactive");
        return <StatusBadge status={status} className="border border-gray-200" />;
      },
      priority: "high",
    },
    {
      key: "created_at",
      header: "Created",
      render: (item) =>
        item.created_at ? (
          <time className="text-sm text-gray-600 whitespace-nowrap">
            {new Date(item.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </time>
        ) : (
          <span className="text-gray-400">-</span>
        ),
      priority: "low",
    },
  ];

  const couponFields = [
    { name: "code", label: "Coupon Code", type: "text", required: true, placeholder: "e.g. SAVE20" },
    {
      name: "discount_type",
      label: "Discount Type",
      type: "select",
      required: true,
      options: [
        { value: "percentage", label: "Percentage" },
        { value: "fixed", label: "Fixed Amount" },
      ],
    },
    { name: "discount_value", label: "Discount Value", type: "number", required: true, placeholder: "e.g. 20", min: 0 },
    { name: "min_order", label: "Min Order Amount", type: "number", placeholder: "e.g. 50", min: 0 },
    { name: "max_uses", label: "Max Uses", type: "number", placeholder: "e.g. 100", min: 1 },
    { name: "per_user_usage_limit", label: "Per User Usage Limit", type: "number", placeholder: "e.g. 3", min: 1 },
    { name: "start_date", label: "Start Date", type: "datetime-local" },
    { name: "expires_at", label: "Expires At", type: "datetime-local" },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

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

      <div className="bg-white rounded-xl  border border-gray-200 overflow-hidden">
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
                  <td className="px-6 py-4 border-b border-gray-200 font-medium">{coupon.code}</td>
                  <td className="px-6 py-4 border-b border-gray-200">{coupon.discount_type}</td>
                  <td className="px-6 py-4 border-b border-gray-200">
                    {coupon.discount_type === "percentage"
                      ? `${coupon.discount_value}%`
                      : `$${coupon.discount_value}`}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${coupon.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
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