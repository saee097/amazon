"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Tag,
  Save,
  ArrowLeft,
  X,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";

function slugify(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function AdminBrandsCreate() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    brand_name: "",
    slug: "",
    description: "",
    logo_url: "",
    status: "active",
  });

  useEffect(() => {
    if (!getToken()) {
      router.push("/auth/login");
      return;
    }
  }, [router]);

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm((f) => ({
      ...f,
      brand_name: name,
      slug: slugify(name),
    }));
  };

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
        brand_name: form.brand_name,
        slug: form.slug,
        description: form.description || undefined,
        logo_url: form.logo_url || undefined,
        status: form.status,
      };
      const res = await api.post("/admin/brands", payload);
      if (res.data?.success || res.data?.data) {
        setSuccess("Brand created successfully.");
        setTimeout(() => router.push("/admin/brands"), 1500);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create brand.");
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
            <p className="text-sm font-medium text-[#0F766E]">Catalog</p>
            <h1 className="text-2xl font-semibold text-gray-700">Create brand</h1>
            <p className="mt-1 text-sm text-gray-500">
              Add a new brand to your product catalog.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/brands")}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            <ArrowLeft size={15} /> Back
          </button>
          <button
            type="submit"
            form="brand-create-form"
            disabled={submitting}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0F766E]/90 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            {submitting ? "Saving…" : "Save"}
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

      <form
        id="brand-create-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
            Brand details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Brand Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="brand_name"
                value={form.brand_name}
                onChange={handleNameChange}
                required
                className={inputClass}
                placeholder="e.g. Nike"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Slug <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                required
                className={inputClass + " font-mono"}
                placeholder="nike"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className={inputClass}
              placeholder="Optional description for this brand…"
            />
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Logo URL
            </label>
            <input
              type="url"
              name="logo_url"
              value={form.logo_url}
              onChange={handleChange}
              className={inputClass}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
            Status
          </h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Brand Status
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
