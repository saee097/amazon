"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Edit2,
  Trash2,
  GripVertical,
  X,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  Search as SearchIcon,
  Filter,
  X as XIcon,
} from "lucide-react";
import api from "@/lib/api";
import { upload } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { SkeletonTable } from "@/components/ui/skeleton";
import DeleteConfirmDialog from "@/components/ui/DeleteConfirmDialog";

function getDefaults(fields) {
  const defaults = {};
  fields.forEach((f) => {
    if (f.type === "boolean") defaults[f.name] = false;
    else if (f.type === "number") defaults[f.name] = f.defaultValue ?? 0;
    else if (f.type === "select") defaults[f.name] = f.options?.[0]?.value || "";
    else defaults[f.name] = "";
  });
  return defaults;
}

function FileUploadField({
  field,
  form,
  setForm,
  disabled,
  uploading,
  progress,
  error,
}) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(form[field.name] || "");

  const validateFile = (file) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return "Please select a valid image file (JPEG, PNG, WebP, or GIF)";
    }
    if (file.size > 5 * 1024 * 1024) {
      return "File size must be less than 5MB";
    }
    return null;
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setForm((prev) => ({ ...prev, [field.name]: "", [field.name + "_error"]: validationError }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("image", file);

    setForm((prev) => ({ ...prev, [field.name]: "", [field.name + "_uploading"]: true, [field.name + "_progress"]: 0, [field.name + "_error"]: "" }));

    try {
      const { data } = await upload(field.endpoint || "/admin/upload/image", formData, (p) =>
        setForm((prev) => ({ ...prev, [field.name + "_progress"]: p }))
      );
      const imageUrl = data?.url || data?.data?.url;
      if (imageUrl) {
        setForm((prev) => ({ ...prev, [field.name]: imageUrl, [field.name + "_uploading"]: false, [field.name + "_progress"]: 0 }));
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setForm((prev) => ({
        ...prev,
        [field.name]: "",
        [field.name + "_uploading"]: false,
        [field.name + "_progress"]: 0,
        [field.name + "_error"]: err?.response?.data?.message || "Upload failed. Please try again.",
      }));
      setPreview("");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleClick = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setForm((prev) => ({ ...prev, [field.name]: "" }));
    setPreview("");
  };

  const isUploading = form[field.name + "_uploading"];
  const uploadProgress = form[field.name + "_progress"] || 0;
  const uploadError = form[field.name + "_error"] || error;
  const isExternalUrl = preview && (preview.startsWith("http") || preview.startsWith("//"));

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={field.accept || "image/*"}
        onChange={(e) => handleFileSelect(e.target.files[0])}
        className="hidden"
        disabled={disabled || isUploading}
        aria-label={field.label}
      />

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 rounded-xl transition-all cursor-pointer
          ${dragActive ? "border-[#0F766E] bg-[#0F766E]/5" : "border-gray-200 dark:border-gray-600 hover:border-gray-300"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${preview ? "min-h-[180px]" : "min-h-[140px] flex items-center justify-center"}
        `}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleClick()}
      >
        {(isUploading || uploading) && (
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex flex-col items-center justify-center z-10 rounded-xl">
        <Loader2 size={24} className="animate-spin text-[#0F766E]" />
        <div className="mt-2 w-48 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0F766E] transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
        <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">Uploading... {uploadProgress}%</span>
      </div>
        )}

        {!isUploading && preview && (
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
            <img
              src={preview}
              alt={`${field.label} preview`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition"
              aria-label={`Remove ${field.label.toLowerCase()}`}
            >
              <XIcon size={16} />
            </button>
            {isExternalUrl && (
              <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-1 text-xs text-white bg-black/50 rounded">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                External URL
              </span>
            )}
          </div>
        )}

        {!isUploading && !preview && (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0F766E]/10 text-[#0F766E] mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">
              {dragActive ? "Drop image here" : "Click or drag to upload"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              JPEG, PNG, WebP, GIF up to 5MB
            </p>
          </div>
        )}
      </div>

      {uploadError && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
          <XIcon size={14} className="shrink-0" />
          {uploadError}
        </p>
      )}

      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {field.label} {field.required && <span className="text-red-500">*</span>}
      </label>
    </div>
  );
}

export default function ResourceManager({
  title,
  endpoint,
  columns = [],
  fields = [],
  searchKeys = [],
  disableCreate = false,
  addLabel = "Add New",
  emptyIcon = "📄",
  emptyText = "No records found.",
  emptyDescription = "",
  imageField = "image",
  canReorder = false,
  rowActions = [],
  renderHeaderActions,
  renderFilters,
  renderStats,
  customEmptyState,
}) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteItemName, setDeleteItemName] = useState("");
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(endpoint);
      setItems(data.data || []);
      setError("");
    } catch (err) {
      console.error(`Failed to load ${endpoint}:`, err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(getDefaults(fields));
    setShowModal(true);
  };

  const openEdit = (item) => {
    const next = {};
    fields.forEach((f) => {
      const val = item[f.name];
      if (f.type === "boolean") next[f.name] = val ?? false;
      else if (f.type === "number") next[f.name] = val ?? (f.defaultValue ?? 0);
      else next[f.name] = val ?? "";
    });
    setEditing(item);
    setForm(next);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? (value === "" ? 0 : Number(value)) : value,
    }));
  };

  const handleFileUpload = async (file, field) => {
    if (!file || !field.uploadHandler) return null;
    return field.uploadHandler(file);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanForm = {};
      fields.forEach((f) => {
        cleanForm[f.name] = form[f.name];
      });
      if (editing) {
        await api.put(`${endpoint}/${editing._id}`, cleanForm);
        toast.success(`${title} updated successfully`);
      } else {
        await api.post(endpoint, cleanForm);
        toast.success(`${title} created successfully`);
      }
      setShowModal(false);
      setEditing(null);
      await load();
    } catch (err) {
      console.error("Save failed:", err);
      toast.error(err?.response?.data?.message || "Failed to save. Please check the form.");
    } finally {
      setSaving(false);
    }
  };

  const remove = (id, itemName) => {
    setDeletingId(id);
    setDeleteItemName(itemName || "this record");
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`${endpoint}/${deletingId}`);
      toast.success(`${title} deleted successfully`);
      await load();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete.");
    } finally {
      setDeletingId(null);
      setDeleteConfirmOpen(false);
      setDeleteItemName("");
    }
  };

  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (draggedId && draggedId !== id) setDragOverId(id);
  };

  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    const sourceId = draggedId;
    setDraggedId(null);
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;

    const fromIndex = items.findIndex((i) => i._id === sourceId);
    const toIndex = items.findIndex((i) => i._id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    setItems(next);
    try {
      await api.post(`${endpoint}/reorder`, {
        order: next.map((i, idx) => ({ id: i._id, sort_order: idx })),
      });
    } catch (err) {
      console.error("Reorder failed:", err);
      await load();
    }
  };

  const filtered = items.filter((item) => {
    if (searchKeys.length && search) {
      const matchesSearch = searchKeys.some((key) =>
        String(item[key] ?? "").toLowerCase().includes(search.toLowerCase())
      );
      if (!matchesSearch) return false;
    }
    return true;
  });

  const getVisibleColumns = () => {
    if (typeof window === "undefined") return columns;
    const width = window.innerWidth;
    return columns.filter((col) => {
      if (col.priority === "high") return true;
      if (col.priority === "medium" && width >= 768) return true;
      if (col.priority === "low" && width >= 1024) return true;
      return false;
    });
  };

  const visibleColumns = getVisibleColumns();

  return (
    <div className="max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{filtered.length} records</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          {renderHeaderActions && renderHeaderActions()}
          {!disableCreate && (
            <button
              onClick={openCreate}
              className="inline-flex items-center px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 transition w-full sm:w-auto justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {addLabel}
            </button>
          )}
        </div>
      </div>

      {renderStats && <div>{renderStats(filtered)}</div>}

      {renderFilters && <div className="mb-6">{renderFilters()}</div>}

      {searchKeys.length > 0 && !renderFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl  border border-gray-200 dark:border-gray-700 mb-6 p-4">
          <div className="relative">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 pl-10 pr-4 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl  border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-6" role="status" aria-busy="true">
            <span className="sr-only">Loading…</span>
            <SkeletonTable rows={6} cols={visibleColumns.length + 1} className="rounded-none border-0" />
          </div>
        ) : filtered.length === 0 ? (
          customEmptyState ? (
            customEmptyState(filtered, loading, error)
          ) : (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">{emptyIcon}</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{emptyText}</h3>
              {emptyDescription && (
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">{emptyDescription}</p>
              )}
            </div>
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" role="grid">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  {canReorder && (
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10" scope="col">
                      <span className="sr-only">Drag to reorder</span>
                    </th>
                  )}
                  {visibleColumns.map((col) => (
                    <th
                      key={col.key || col.header}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      scope="col"
                    >
                      {col.header}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32" scope="col">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((item, index) => (
                  <tr
                    key={item._id}
                    draggable={canReorder}
                    onDragStart={(e) => canReorder && handleDragStart(e, item._id)}
                    onDragOver={(e) => canReorder && handleDragOver(e, item._id)}
                    onDrop={(e) => canReorder && handleDrop(e, item._id)}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDragOverId(null);
                    }}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                      draggedId === item._id ? "opacity-40" : ""
                    } ${dragOverId === item._id ? "border-t-2 border-t-[#0F766E]" : ""}`}
                  >
                    {canReorder && (
                      <td className="px-3 py-4 text-gray-300 cursor-grab active:cursor-grabbing">
                        <GripVertical size={16} />
                      </td>
                    )}
                    {visibleColumns.map((col) => (
                      <td key={col.key || col.header} className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {col.render ? col.render(item) : item[col.key]}
                      </td>
                    ))}
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {rowActions.map((action) => {
                          const ActionIcon = action.icon || Edit2;
                          const disabled = action.requires && !action.requires(item);
                          return (
                            <button
                              key={action.key || action.label}
                              onClick={() => action.onClick(item)}
                              disabled={disabled}
                              title={action.label}
                              className={`inline-flex items-center justify-center h-8 w-8 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                action.variant === "danger"
                                  ? "text-red-600 hover:bg-red-50"
                                  : action.variant === "warning"
                                    ? "text-amber-600 hover:bg-amber-50"
                                    : action.variant === "success"
                                      ? "text-emerald-600 hover:bg-emerald-50"
                                      : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                              }`}
                              aria-label={action.label}
                            >
                              {action.loading ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <ActionIcon size={15} />
                              )}
                            </button>
                          );
                        })}
                        {fields.length > 0 && (
                          <button
                            onClick={() => openEdit(item)}
                            title="Edit"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-[#0F766E] hover:bg-[#0F766E]/10 dark:hover:bg-[#0F766E]/20 transition"
                            aria-label="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => remove(item._id, item.heading || item.title || item.name || item.code || "this record")}
                          disabled={deletingId === item._id}
                          title="Delete"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                          aria-label="Delete"
                        >
                          {deletingId === item._id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F766E]/10 text-[#0F766E]">
                  <Edit2 size={18} />
                </span>
                <div>
                  <h2 id="modal-title" className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {editing ? `Edit ${title}` : `Create ${title}`}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {editing ? "Update the record details" : "Fill in the details to create a new record"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1.5 transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={save} className="p-6 space-y-5 overflow-y-auto" noValidate>
              {fields.map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {f.label}
                    {f.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {f.type === "file" ? (
                    <FileUploadField
                      field={f}
                      form={form}
                      setForm={setForm}
                      disabled={saving}
                    />
                  ) : f.type === "textarea" ? (
                    <textarea
                      name={f.name}
                      value={form[f.name] ?? ""}
                      onChange={handleChange}
                      rows={f.rows || 4}
                      required={f.required}
                      disabled={saving}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 transition disabled:opacity-50"
                    />
                  ) : f.type === "select" ? (
                    <select
                      name={f.name}
                      value={form[f.name] ?? ""}
                      onChange={handleChange}
                      required={f.required}
                      disabled={saving}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 transition disabled:opacity-50"
                    >
                      {f.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "boolean" ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name={f.name}
                        checked={!!form[f.name]}
                        onChange={handleChange}
                        disabled={saving}
                        className="h-5 w-5 rounded border-gray-300 text-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Enabled</span>
                    </label>
                  ) : (
                    <input
                      type={f.type || "text"}
                      name={f.name}
                      value={form[f.name] ?? ""}
                      onChange={handleChange}
                      required={f.required}
                      placeholder={f.placeholder}
                      min={f.min}
                      max={f.max}
                      step={f.step}
                      disabled={saving}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 transition disabled:opacity-50"
                    />
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90 disabled:opacity-70 disabled:cursor-not-allowed transition"
                >
                  {saving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      {editing ? "Save Changes" : "Create"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeletingId(null);
          setDeleteItemName("");
        }}
        onConfirm={handleDeleteConfirm}
        itemName={deleteItemName}
        loading={!!deletingId}
      />

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}