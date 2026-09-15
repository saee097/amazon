"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Eye, EyeOff, ExternalLink, Image as ImageIcon, CheckCircle2, AlertTriangle, RefreshCw, Loader2, Trash2, Edit2, GripVertical, Save, X, ChevronDown, ChevronUp, Filter, Search as SearchIcon, Download, Upload } from "lucide-react";
import ResourceManager from "@/components/admin/ResourceManager";
import StatusBadge from "@/components/StatusBadge";
import ImageUpload from "@/components/admin/ImageUpload";
import { useToast } from "@/components/ui/Toast";
import api from "@/lib/api";

const ITEMS_PER_PAGE = 10;

export default function AdminBanners() {
  const toast = useToast();
  const [preview, setPreview] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "sort_order", direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [viewMode, setViewMode] = useState("table");
  const previewRef = useRef(null);

  const openPreview = useCallback((item) => {
    setPreview(item);
    document.body.style.overflow = "hidden";
  }, []);

  const closePreview = useCallback(() => {
    setPreview(null);
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && preview) closePreview();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [preview, closePreview]);

  const handleImageUpload = useCallback(async (file) => {
    if (!file) return null;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload JPEG, PNG, WebP, or GIF.");
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB.");
      return null;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const { data } = await api.post("/admin/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data?.url || data?.data?.url;
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error(err?.response?.data?.message || "Failed to upload image");
      return null;
    }
  }, [toast]);

  const columns = [
    {
      key: "image",
      header: "Preview",
      render: (item) =>
        item.image ? (
          <div className="relative h-16 w-28 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 flex-shrink-0">
            <img
              src={item.image}
              alt={item.heading || "Banner"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="flex h-16 w-28 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 flex-shrink-0">
            <ImageIcon size={20} className="text-gray-300" />
          </div>
        ),
      priority: "high",
    },
    {
      key: "heading",
      header: "Heading",
      render: (item) => (
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">{item.heading || "-"}</p>
          {item.subheading && (
            <p className="text-sm text-gray-500 truncate">{item.subheading}</p>
          )}
        </div>
      ),
      priority: "high",
    },
    {
      key: "link_url",
      header: "Link",
      render: (item) =>
        item.link_url ? (
          <a
            href={item.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#0F766E] hover:underline text-sm"
            title={item.link_url}
          >
            <span className="truncate max-w-[200px]">{item.link_url}</span>
            <ExternalLink size={12} className="shrink-0" />
          </a>
        ) : (
          <span className="text-gray-400">-</span>
        ),
      priority: "medium",
    },
    {
      key: "sort_order",
      header: "Order",
      render: (item) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
          {item.sort_order ?? 0}
        </span>
      ),
      priority: "low",
    },
    {
      key: "status",
      header: "Status",
      render: (item) =>
        item.status === "active" ? (
          <StatusBadge status="ACTIVE" className="border border-gray-200" />
        ) : (
          <StatusBadge status="INACTIVE" className="border border-gray-200"/>
        ),
      priority: "high",
    },
    {
      key: "created_at",
      header: "Created",
      render: (item) =>
        item.created_at ? (
          <time dateTime={item.created_at} className="text-sm text-gray-600 whitespace-nowrap">
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

  const fields = [
    { name: "heading", label: "Heading", type: "text", required: true, placeholder: "e.g. Summer Sale" },
    { name: "subheading", label: "Subheading", type: "text", placeholder: "e.g. Up to 50% off" },
    {
      name: "image",
      label: "Banner Image",
      type: "file",
      required: true,
      uploadHandler: handleImageUpload,
      accept: "image/*",
      endpoint: "/admin/upload/image",
    },
    { name: "link_url", label: "Link URL", type: "url", placeholder: "https://example.com/promo" },
    {
      name: "sort_order",
      label: "Sort Order",
      type: "number",
      placeholder: "0",
      defaultValue: 0,
      min: 0,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  const rowActions = [
    {
      key: "preview",
      label: "Preview",
      icon: Eye,
      onClick: openPreview,
    },
  ];

  const stats = [
    { label: "Total", value: "total", icon: ImageIcon, color: "bg-blue-500" },
    { label: "Active", value: "active", icon: CheckCircle2, color: "bg-emerald-500" },
    { label: "Inactive", value: "inactive", icon: AlertTriangle, color: "bg-amber-500" },
  ];

  return (
    <>
      <ResourceManager
      title="Banners"
      endpoint="/admin/banners"
      addLabel="Add Banner"
      emptyIcon={<ImageIcon size={48} className="text-gray-300" />}
      emptyText="No banners found"
      emptyDescription="Create your first banner to promote products or promotions on the homepage."
      searchKeys={["heading", "subheading", "link_url"]}
      canReorder={true}
      imageField="image"
      columns={columns}
      fields={fields}
      rowActions={rowActions}
      renderHeaderActions={() => (
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <label htmlFor="view-mode" className="text-sm text-gray-500">View:</label>
            <select
              id="view-mode"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10"
            >
              <option value="table">Table</option>
              <option value="cards">Cards</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            aria-expanded={showFilters}
          >
            <Filter size={16} />
            Filters
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      )}
      renderFilters={showFilters ? (
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="relative flex-1">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search banners..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="w-full sm:w-48 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            type="button"
            onClick={() => setFilters({ status: "", search: "" })}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Clear
          </button>
        </div>
      ) : null}
      renderStats={(items) => {
        const total = items.length;
        const active = items.filter((i) => i.status === "active").length;
        const inactive = total - active;
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total", value: total, color: "bg-blue-500" },
              { label: "Active", value: active, color: "bg-emerald-500" },
              { label: "Inactive", value: inactive, color: "bg-amber-500" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color} text-white`}>
                    <ImageIcon size={24} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      }}
      customEmptyState={(items, loading, error) => {
        if (loading) return null;
        if (error) {
          return (
            <div className="p-12 text-center">
              <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load banners</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 transition"
              >
                <RefreshCw size={16} /> Retry
              </button>
            </div>
          );
        }
        return null;
      }}
    />

    {preview && (
      <div
        ref={previewRef}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onClick={closePreview}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
      >
        <div
          className="relative max-w-4xl w-full overflow-hidden rounded-xl bg-white shadow-2xl animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={closePreview}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition"
            aria-label="Close preview"
          >
            <EyeOff size={18} />
          </button>
          <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
            {preview.image ? (
              <img
                src={preview.image}
                alt={preview.heading || "Banner"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                <ImageIcon size={48} />
              </div>
            )}
            {preview.link_url && (
              <a
                href={preview.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-sm text-[#0F766E] rounded-lg hover:bg-white transition"
              >
                <span className="hidden sm:block">View Live</span>
                <ExternalLink size={14} />
              </a>
            )}
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h3 id="preview-title" className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
                  {preview.heading || "Untitled Banner"}
                </h3>
                {preview.subheading && (
                  <p className="mt-1 text-sm text-gray-500">{preview.subheading}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={preview.status === "active" ? "ACTIVE" : "INACTIVE"}  className="border border-gray-200"/>
              </div>
            </div>
            {preview.link_url && (
              <a
                href={preview.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[#0F766E] hover:underline"
              >
                {preview.link_url}
                <ExternalLink size={12} />
              </a>
            )}
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <span className="text-xs text-gray-400">Sort Order: {preview.sort_order ?? 0}</span>
              {preview.created_at && (
                <span className="text-xs text-gray-400">
                  Created: {new Date(preview.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}