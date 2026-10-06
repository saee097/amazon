"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Tag,
  Save,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function AdminCouponsCreate() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_order: "",
    max_uses: "",
    max_discount: "",
    per_user_usage_limit: "",
    start_date: "",
    expires_at: "",
    status: "active",
  });

  useEffect(() => {
    if (!getToken()) {
      router.push("/auth/login");
      return;
    }
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        code: form.code,
        discount_type: form.discount_type,
        discount_value: form.discount_value ? Number(form.discount_value) : undefined,
        min_order: form.min_order ? Number(form.min_order) : undefined,
        max_uses: form.max_uses ? Number(form.max_uses) : undefined,
        max_discount: form.max_discount ? Number(form.max_discount) : undefined,
        per_user_usage_limit: form.per_user_usage_limit ? Number(form.per_user_usage_limit) : undefined,
        start_date: form.start_date || undefined,
        expires_at: form.expires_at || undefined,
        status: form.status,
      };
      const res = await api.post("/coupons", payload);
      if (res.data?.success || res.data?.data) {
        setSuccess("Coupon created successfully.");
        setTimeout(() => router.push("/admin/coupons"), 1500);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create coupon.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100";

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
            <Tag size={22} />
          </span>
          <div>
            <p className="text-sm font-medium text-[#0F766E]">Coupons</p>
            <h1 className="text-2xl font-semibold text-gray-700">Create coupon</h1>
            <p className="mt-1 text-sm text-gray-500">Add a new discount coupon to your store.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/coupons")}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            <ArrowLeft size={15} /> Back
          </button>
          <button
            type="submit"
            form="coupon-create-form"
            disabled={submitting}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0F766E]/90 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {submitting ? "Saving&hellip;" : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <form id="coupon-create-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Coupon details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Coupon Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="e.g. SAVE20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Discount Type <span className="text-rose-500">*</span>
              </label>
              <select
                name="discount_type"
                value={form.discount_type}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Discount Value <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="discount_value"
                value={form.discount_value}
                onChange={handleChange}
                required
                min={0}
                className={inputClass}
                placeholder="e.g. 20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Min Order Amount
              </label>
              <input
                type="number"
                name="min_order"
                value={form.min_order}
                onChange={handleChange}
                min={0}
                className={inputClass}
                placeholder="e.g. 50"
              />
            </div>
<div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Max Uses
                  </label>
                  <input
                    type="number"
                    name="max_uses"
                    value={form.max_uses}
                    onChange={handleChange}
                    min={1}
                    className={inputClass}
                    placeholder="e.g. 100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Max Discount
                  </label>
                  <input
                    type="number"
                    name="max_discount"
                    value={form.max_discount}
                    onChange={handleChange}
                    min={0}
                    step="0.01"
                    className={inputClass}
                    placeholder="e.g. 50"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Cap for percentage discounts</p>
                </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Per User Usage Limit
              </label>
              <input
                type="number"
                name="per_user_usage_limit"
                value={form.per_user_usage_limit}
                onChange={handleChange}
                min={1}
                className={inputClass}
                placeholder="e.g. 3"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date
              </label>
              <input
                type="datetime-local"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Expires At
              </label>
              <input
                type="datetime-local"
                name="expires_at"
                value={form.expires_at}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Status</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Coupon Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </form>
    </div>
  );
}
