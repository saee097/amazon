"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { getProductImage } from "@/lib/images";
import {
  Pencil,
  Plus,
  Boxes,
} from "lucide-react";
import { FiEye, FiExternalLink, FiLock, FiLoader, FiTrash2 } from "react-icons/fi";
import { AdminPageSkeleton } from "@/components/ui/skeleton";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [togglingStatus, setTogglingStatus] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get("/admin/products"),
          api.get("/admin/categories"),
        ]);
        setProducts(productsRes.data.data || []);
        setCategories(categoriesRes.data.data || []);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleToggleStatus = async (product) => {
    const newStatus = product.status === "active" ? "draft" : "active";
    setTogglingStatus(product._id);
    try {
      await api.put(`/admin/products/${product._id}`, { status: newStatus });
      setProducts(products.map((p) => (p._id === product._id ? { ...p, status: newStatus } : p)));
    } catch (error) {
      console.error("Failed to update product status:", error);
      alert("Failed to update status");
    } finally {
      setTogglingStatus(null);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !searchQuery ||
      product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || product.status === statusFilter;
    const matchesCategory = !categoryFilter || product.category?._id === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      setProducts(products.filter((p) => p._id !== id));
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Active
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            Draft
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  const getVisibilityBadge = (status) => {
    if (status === "active") {
      return {
        icon: <FiEye className="text-green-600" size={14} title="Visible to customers" />,
        label: "Published",
      };
    }
    return {
      icon: <FiLock className="text-gray-400" size={14} title="Hidden from customers" />,
      label: "Hidden",
    };
  };

  if (loading) {
    return <AdminPageSkeleton variant="grid" className="max-w-7xl mx-auto" />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Products</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{filteredProducts.length} product{filteredProducts.length === 1 ? " " : "s"} found</p>
        </div>
        <Link
          href="/admin/products/create"
          className="inline-flex items-center justify-center px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 transition text-sm font-medium"
        >
          + Add New Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]/20"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]/20"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.category_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
{filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No products found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Get started by creating your first product.</p>
              <Link
                href="/admin/products/create"
                className="inline-flex items-center px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 transition"
              >
                Add New Product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 sm:rounded-xl sm:overflow-x-auto">
              <table className="w-full min-w-[900px] sm:min-w-0">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Visibility</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
{filteredProducts.map((product) => {
                    const visibility = getVisibilityBadge(product.status);
                    const isLowStock = (product.inventory_quantity || 0) < 10;
                    return (
                      <tr
                        key={product._id}
                        className="group hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        {/* Product */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shrink-0">
                              <img
                                src={getProductImage(product)}
                                alt={product.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[180px] sm:max-w-xs">{product.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px] sm:max-w-xs">{product.sku || "No SKU"}</p>
                            </div>
                          </div>
                        </td>

                        {/* Category (hidden on mobile) */}
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                          {product.category?.category_name || "—"}
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                          ${Number(product.price || 0).toFixed(2)}
                          {product.compare_price && (
                            <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 line-through">${Number(product.compare_price).toFixed(2)}</span>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="px-6 py-4 text-sm">
                          <span className={isLowStock ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-gray-600 dark:text-gray-400"}>
                            {typeof product.inventory_quantity === "number" ? product.inventory_quantity : "—"}
                          </span>
                          {isLowStock && product.inventory_quantity !== undefined && (
                            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400">Low</span>
                          )}
                        </td>

                        {/* Visibility (hidden on tablet and below) */}
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            {visibility.icon}
                            {getStatusBadge(product.status)}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity lg:opacity-100">
                            {/* Publish / Unpublish toggle */}
                            {product.status !== "active" && (
                              <button
                                onClick={() => handleToggleStatus(product)}
                                disabled={togglingStatus === product._id}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:hover:bg-green-900/30 dark:text-green-400 transition disabled:opacity-50"
                                title="Publish to storefront"
                              >
                                {togglingStatus === product._id ? <FiLoader className="animate-spin" size={14} /> : <FiEye size={14} />}
                              </button>
                            )}
                            {product.status === "active" && (
                              <button
                                onClick={() => handleToggleStatus(product)}
                                disabled={togglingStatus === product._id}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-yellow-700 bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800 dark:hover:bg-yellow-900/30 dark:text-yellow-400 transition disabled:opacity-50"
                                title="Hide from storefront"
                              >
                                {togglingStatus === product._id ? <FiLoader className="animate-spin" size={14} /> : <FiLock size={14} />}
                              </button>
                            )}

                            {/* Edit */}
                            <Link
                              href={`/admin/products/edit/${product._id}`}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#0F766E] bg-[#0F766E]/5 border border-[#0F766E]/20 hover:bg-[#0F766E]/10 dark:bg-[#0F766E]/10 dark:border-[#0F766E]/30 dark:hover:bg-[#0F766E]/20 transition"
                              title="Edit product"
                            >
                              <Pencil size={14} />
                            </Link>

                            {/* View on storefront (only if published + has slug) */}
                            {product.status === "active" && product.slug && (
                              <a
                                href={`/products/${product.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:text-gray-300 transition"
                                title="View on storefront"
                              >
                                <FiExternalLink size={14} />
                              </a>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:hover:bg-rose-900/30 dark:text-rose-400 transition"
                              title="Delete product"
                            >
                              <FiTrash2 size={14} />
                            </button>

                            {/* Manage Variants */}
                            <Link
                              href={`/admin/inventory?product=${product._id}`}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:hover:bg-blue-900/30 dark:text-blue-400 transition"
                              title="Manage variants"
                            >
                              <Boxes size={14} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
