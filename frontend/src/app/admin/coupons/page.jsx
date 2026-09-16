"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import StatusBadge from "@/components/StatusBadge";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/catalog/coupons");
      setCoupons(data.data || []);
      setError("");
    } catch {
      setError("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = coupons.filter((c) => {
    if (!searchQuery) return true;
    return (
      c.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.discount_type?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      code: "",
      discount_type: "percentage",
      discount_value: "",
      min_order: "",
      max_uses: "",
      per_user_usage_limit: "",
      start_date: "",
      expires_at: "",
      status: "active",
    });
    setShowModal(true);
  };

  const openEdit = (coupon) => {
    setEditing(coupon);
    setForm({ ...coupon });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/catalog/coupons/${editing._id || editing.id}`, form);
      } else {
        await api.post("/catalog/coupons", form);
      }
      setShowModal(false);
      setEditing(null);
      setForm({});
      load();
    } catch {
      setError("Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await api.delete(`/catalog/coupons/${id}`);
      setCoupons(coupons.filter((c) => c._id !== id && c.id !== id));
    } catch {
      setError("Failed to delete coupon");
    }
  };

  if (deletingId) {
    handleDelete(deletingId);
    setDeletingId(null);
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Coupons</h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 transition"
        >
          <FiPlus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search coupons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-sm px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 mx-auto rounded-full border-2 border-[#0F766E] border-t-transparent animate-spin" />
            <p className="mt-3 text-sm text-gray-500">Loading coupons...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No coupons found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((coupon) => (
                <tr key={coupon._id || coupon.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{coupon.code || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${coupon.status === "active" || coupon.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {coupon.status || (coupon.isActive ? "Active" : "Inactive")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(coupon)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#0F766E] bg-[#0F766E]/5 border border-[#0F766E]/20 hover:bg-[#0F766E]/10 transition"
                        title="Edit"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(coupon._id || coupon.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {editing ? "Edit Coupon" : "Create Coupon"}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditing(null); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code *</label>
                <input
                  type="text"
                  required
                  value={form.code || ""}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. SAVE20"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
                  <select
                    value={form.discount_type || "percentage"}
                    onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    value={form.discount_value || ""}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    placeholder="e.g. 20"
                    min="0"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Order</label>
                  <input
                    type="number"
                    value={form.min_order || ""}
                    onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                    placeholder="e.g. 50"
                    min="0"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Uses</label>
                  <input
                    type="number"
                    value={form.max_uses || ""}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    placeholder="e.g. 100"
                    min="1"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={form.status || "active"}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditing(null); }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
