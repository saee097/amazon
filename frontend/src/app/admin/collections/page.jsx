"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { SkeletonTable } from "@/components/ui/skeleton";
import DeleteConfirmDialog from "@/components/ui/DeleteConfirmDialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Star,
  Eye,
  EyeOff,
  Image,
  Tag,
  GripVertical,
} from "lucide-react";

const PAGE_SIZE = 15;

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  status: "active",
};

function SlugInput({ value, onChange, disabled }) {
  const handleChange = (e) => {
    let val = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    onChange(val);
  };
  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50 font-mono"
      placeholder="auto-generated-from-name"
    />
  );
}

export default function AdminCollections() {
  const toast = useToast();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [draggedItem, setDraggedItem] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", page.toString());
      params.set("limit", PAGE_SIZE.toString());

      const { data } = await api.get(`/admin/collections?${params.toString()}`);
      setCollections(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load collections";
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, statusFilter, page, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [searchQuery, statusFilter]);

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.slug.trim()) errors.slug = "Slug is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const filteredCollections = collections;

  const openCreate = () => {
    setEditingCollection(null);
    setForm({ ...EMPTY_FORM, status: "active" });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (collection) => {
    setEditingCollection(collection);
    setForm({
      name: collection.name || "",
      slug: collection.slug || "",
      description: collection.description || "",
      status: collection.status || "active",
    });
    setFormErrors({});
    setShowModal(true);
  };

  const confirmDelete = (collection) => {
    setDeletingId(collection._id);
    setDeleteConfirmOpen(true);
  };

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetItem) => {
    e.preventDefault();
    if (!draggedItem || draggedItem._id === targetItem._id) {
      setDraggedItem(null);
      return;
    }

    const draggedIndex = collections.findIndex((i) => i._id === draggedItem._id);
    const targetIndex = collections.findIndex((i) => i._id === targetItem._id);

    const newCollections = [...collections];
    newCollections.splice(draggedIndex, 1);
    newCollections.splice(targetIndex, 0, draggedItem);

    const updates = newCollections.map((item, index) => ({
      id: item._id,
      sort_order: index + 1,
    }));

    try {
      await Promise.all(
        updates.map((u) => api.put(`/admin/collections/${u.id}`, { sort_order: u.sort_order }))
      );
      setCollections(newCollections);
      toast.success("Collections reordered");
    } catch {
      toast.error("Failed to reorder collections");
      load();
    } finally {
      setDraggedItem(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        status: form.status,
      };

      if (editingCollection) {
        const res = await api.put(`/admin/collections/${editingCollection._id}`, payload);
        toast.success("Collection updated");
      } else {
        const res = await api.post("/admin/collections", payload);
        toast.success("Collection created");
      }
      setShowModal(false);
      setEditingCollection(null);
      setForm(EMPTY_FORM);
      load().then(setTotalPages);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save collection";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (collection) => {
    const newStatus = collection.status === "active" ? "inactive" : "active";
    try {
      await api.put(`/admin/collections/${collection._id}`, { status: newStatus });
      toast.success(`Collection ${newStatus === "active" ? "activated" : "deactivated"}`);
      load().then(setTotalPages);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/collections/${deletingId}`);
      toast.success("Collection deleted");
      load().then(setTotalPages);
    } catch {
      toast.error("Failed to delete collection");
    } finally {
      setDeleteConfirmOpen(false);
      setDeletingId(null);
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusBadge = (status) => {
    const config = {
      active: { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500", darkBg: "dark:bg-green-900/20", darkText: "dark:text-green-400", darkDot: "dark:bg-green-400" },
      inactive: { bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500", darkBg: "dark:bg-gray-700", darkText: "dark:text-gray-300", darkDot: "dark:bg-gray-400" },
      draft: { bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500", darkBg: "dark:bg-yellow-900/20", darkText: "dark:text-yellow-400", darkDot: "dark:bg-yellow-400" },
    }[status] || { bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500", darkBg: "dark:bg-gray-700", darkText: "dark:text-gray-300", darkDot: "dark:bg-gray-400" };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} ${config.darkBg} ${config.darkText}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${config.darkDot}`}></span>
        {status}
      </span>
    );
  };

  return (
    <ToastProvider>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-100 flex items-center gap-2">
              <Star size={24} className="text-[#0F766E]" />
              Collections
            </h1>
            <p className="mt-1 text-sm text-gray-500">Curated product collections for featured displays</p>
          </div>
          <button onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0F766E]/90 transition">
            <Plus size={16} /> Add Collection
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search collections…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 w-full sm:w-auto"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
              <button onClick={() => load(true)} disabled={refreshing} className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <SkeletonTable rows={6} cols={7} />
          ) : filteredCollections.length === 0 ? (
            <div className="py-16 text-center">
              <Star className="mx-auto text-gray-300" size={36} />
              <p className="mt-4 text-sm text-gray-500">No collections found</p>
              <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E]/90">
                <Plus size={15} /> Add Collection
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50 border-b border-gray-200 dark:bg-gray-700/50 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Slug</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredCollections.map((collection) => (
                      <tr key={collection._id} className={`hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors ${draggedItem?._id === collection._id ? "opacity-50" : ""}`} draggable onDragStart={(e) => handleDragStart(e, collection)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, collection)}>
                        <td className="px-6 py-4">
                          <button type="button" onDragStart={(e) => handleDragStart(e, collection)} draggable className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-grab active:cursor-grabbing transition" title="Drag to reorder" aria-label="Drag to reorder">
                            <GripVertical size={16} />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {collection.image_url && (
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                                <img src={collection.image_url} alt={collection.name} className="w-full h-full object-cover" loading="lazy" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">{collection.name}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">ID: {collection._id?.slice(0, 8)}…</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell font-mono">{collection.slug}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell truncate max-w-[200px]">{collection.description || "—"}</td>
                        <td className="px-6 py-4">{getStatusBadge(collection.status)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(collection.created_at)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => openEdit(collection)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#0F766E] bg-[#0F766E]/5 border border-[#0F766E]/20 hover:bg-[#0F766E]/10 transition" title="Edit collection"><Edit size={14} /></button>
                            <button onClick={() => handleStatusToggle(collection)} className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition ${collection.status === "active" ? "text-yellow-700 bg-yellow-50 border border-yellow-200 hover:bg-yellow-100" : "text-green-700 bg-green-50 border border-green-200 hover:bg-green-100"}`} title={collection.status === "active" ? "Deactivate" : "Activate"}>{collection.status === "active" ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                            <button onClick={() => confirmDelete(collection)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition" title="Delete collection"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                  <p className="text-sm text-gray-500">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, (page - 1) * PAGE_SIZE + filteredCollections.length)} of {filteredCollections.length + (page - 1) * PAGE_SIZE}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-600" title="Previous page"><ChevronLeft size={15} /></button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{page} / {totalPages}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-600" title="Next page"><ChevronRight size={15} /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{editingCollection ? "Edit Collection" : "New Collection"}</h2>
                <button onClick={() => { setShowModal(false); setEditingCollection(null); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close"><X size={18} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 p-6 max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Name <span className="text-rose-500">*</span></label>
                  <input type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }))} className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${formErrors.name ? "border-rose-500" : "border-gray-300"}`} placeholder="Summer Collection" autoFocus />
                  {formErrors.name && <p className="mt-1 text-sm text-rose-600">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Slug <span className="text-rose-500">*</span></label>
                  <SlugInput value={form.slug} onChange={(v) => setForm((f) => ({ ...f, slug: v }))} disabled={editingCollection} />
                  <p className="mt-1 text-xs text-gray-500">URL-friendly identifier. {editingCollection ? "Cannot be changed after creation." : "Auto-generated from name if left empty."}</p>
                  {formErrors.slug && <p className="mt-1 text-sm text-rose-600">{formErrors.slug}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" placeholder="Brief description of this collection" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button type="button" onClick={() => { setShowModal(false); setEditingCollection(null); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">Cancel</button>
                  <button type="submit" disabled={saving} className="rounded-lg bg-[#0F766E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0F766E]/90 disabled:opacity-60">{saving ? <> <Loader2 size={14} className="mr-2 animate-spin" /> Saving… </> : editingCollection ? "Save Changes" : "Create Collection"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <DeleteConfirmDialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} onConfirm={handleDelete} itemName={collections.find((c) => c._id === deletingId)?.name || "this collection"} loading={deleting} />
      </div>
    </ToastProvider>
  );
}