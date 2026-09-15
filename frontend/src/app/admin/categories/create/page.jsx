"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderTree,
  Save,
  ArrowLeft,
  X,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";
import StatusBadge from "@/components/StatusBadge";

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function AdminCategoriesCreate() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    category_name: "",
    slug: "",
    description: "",
    image_url: "",
    status: "active",
    parent_id: "",
  });

  useEffect(() => {
    if (!getToken()) {
      router.push("/auth/login");
      return;
    }
    const loadParents = async () => {
      try {
        const res = await api.get("/admin/categories");
        setCategories(res.data?.data || []);
      } catch {
        setCategories([]);
      } finally {
        setLoadingCats(false);
      }
    };
    loadParents();
  }, [router]);

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm((f) => ({
      ...f,
      category_name: name,
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
        category_name: form.category_name,
        slug: form.slug,
        description: form.description || undefined,
        image_url: form.image_url || undefined,
        status: form.status,
        parent_id: form.parent_id || null,
      };
      const res = await api.post("/admin/categories", payload);
      if (res.data?.success) {
        setSuccess("Category created successfully.");
        setTimeout(() => router.push("/admin/categories"), 1500);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create category.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100";

  const parentOptions = categories.filter((c) => c._id !== undefined);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
            <FolderTree size={22} />
          </span>
          <div>
            <p className="text-sm font-medium text-[#0F766E]">Catalog</p>
            <h1 className="text-2xl font-semibold text-gray-950">Create category</h1>
            <p className="mt-1 text-sm text-gray-500">Add a new category to organize your products.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/categories")}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            <ArrowLeft size={15} /> Back
          </button>
          <button
            type="submit"
            form="category-create-form"
            disabled={submitting}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0F766E] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#0F766E]/90 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
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

      <form id="category-create-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Basic information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="category_name"
                value={form.category_name}
                onChange={handleNameChange}
                required
                className={inputClass}
                placeholder="e.g. Women's Clothing"
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
                placeholder="womens-clothing"
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
              placeholder="Optional description for this category…"
            />
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Image URL
            </label>
            <input
              type="url"
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              className={inputClass}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Organization</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Parent Category
              </label>
              <select
                name="parent_id"
                value={form.parent_id}
                onChange={handleChange}
                className={inputClass}
                disabled={loadingCats}
              >
                <option value="">None (top-level)</option>
                {parentOptions.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
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
        </div>
      </form>
    </div>
  );
}
