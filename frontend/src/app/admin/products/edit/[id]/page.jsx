"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function AdminProductsEdit() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    price: "",
    compare_price: "",
    category: "",
    brand: "",
    status: "draft",
    sku: "",
    inventory_quantity: 0,
  });

  useEffect(() => {
    if (!getToken()) {
      router.push("/auth/login");
      return;
    }

    const loadData = async () => {
      try {
        const [productRes, catRes, brandRes] = await Promise.all([
          api.get(`/products/${productId}`),
          api.get("/categories"),
          api.get("/brands"),
        ]);
        const p = productRes.data.data || {};
        setCategories(catRes.data.data || []);
        setBrands(brandRes.data.data || []);
        setForm({
          title: p.title || "",
          slug: p.slug || "",
          description: p.description || "",
          price: p.price || "",
          compare_price: p.compare_price || "",
          category: p.category?._id || "",
          brand: p.brand?._id || "",
          status: p.status || "draft",
          sku: p.sku || "",
          inventory_quantity: p.inventory_quantity || 0,
        });
      } catch (error) {
        console.error("Failed to load product:", error);
        router.push("/admin/products");
      }
    };

    loadData();
  }, [productId, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleTitleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
      slug: generateSlug(value),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const productData = {
        ...form,
        price: Number(form.price),
        compare_price: form.compare_price ? Number(form.compare_price) : undefined,
        inventory_quantity: Number(form.inventory_quantity),
        category: form.category || undefined,
        brand: form.brand || undefined,
      };

      const res = await api.put(`/products/${productId}`, productData);

      if (res.data.success) {
        router.push("/admin/products");
      }
    } catch (error) {
      console.error("Failed to update product:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Product</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Title</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleTitleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL Slug</label>
              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="4"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Pricing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Compare Price ($)</label>
              <input
                type="number"
                name="compare_price"
                value={form.compare_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
              <input
                type="text"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Inventory Qty</label>
              <input
                type="number"
                name="inventory_quantity"
                value={form.inventory_quantity}
                onChange={handleChange}
                min="0"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Organization</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              <select
                name="brand"
                value={form.brand}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
              >
                <option value="">Select Brand</option>
                {brands.map((brand) => (
                  <option key={brand._id} value={brand._id}>
                    {brand.brand_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 disabled:opacity-70 transition"
          >
            {submitting ? "Updating..." : "Update Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
