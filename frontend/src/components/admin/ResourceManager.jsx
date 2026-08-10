"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

function getDefaults(fields) {
  const defaults = {};
  fields.forEach((f) => {
    if (f.type === "boolean") defaults[f.name] = false;
    else if (f.type === "number") defaults[f.name] = "";
    else if (f.type === "select") defaults[f.name] = f.options?.[0]?.value || "";
    else defaults[f.name] = "";
  });
  return defaults;
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
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
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
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const openCreate = () => {
    setEditing(null);
    setForm(getDefaults(fields));
    setShowModal(true);
  };

  const openEdit = (item) => {
    const next = {};
    fields.forEach((f) => {
      next[f.name] = item[f.name] ?? (f.type === "boolean" ? false : "");
    });
    setEditing(item);
    setForm(next);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`${endpoint}/${editing._id}`, form);
      } else {
        await api.post(endpoint, form);
      }
      setShowModal(false);
      setEditing(null);
      await load();
    } catch (err) {
      console.error("Save failed:", err);
      alert(err?.response?.data?.message || "Failed to save. Please check the form.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await api.delete(`${endpoint}/${id}`);
      await load();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete.");
    }
  };

  const filtered = searchKeys.length
    ? items.filter((item) =>
        searchKeys.some((key) =>
          String(item[key] ?? "")
            .toLowerCase()
            .includes(search.toLowerCase())
        )
      )
    : items;

  return (
    <div className="max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} records</p>
        </div>
        {!disableCreate && (
          <button
            onClick={openCreate}
            className="inline-flex items-center px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 transition"
          >
            + {addLabel}
          </button>
        )}
      </div>

      {searchKeys.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-4">
          <input
            type="text"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
          />
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">{emptyIcon}</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyText}</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key || col.header}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {col.header}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition">
                    {columns.map((col) => (
                      <td key={col.key || col.header} className="px-6 py-4 text-sm text-gray-700">
                        {col.render ? col.render(item) : item[col.key]}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {fields.length > 0 && (
                          <button
                            onClick={() => openEdit(item)}
                            className="text-sm text-[#0F766E] hover:underline"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => remove(item._id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Delete
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {editing ? `Edit ${title}` : `Create ${title}`}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              {fields.map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {f.label}
                    {f.required && <span className="text-red-500"> *</span>}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea
                      name={f.name}
                      value={form[f.name] ?? ""}
                      onChange={handleChange}
                      rows={f.rows || 4}
                      required={f.required}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
                    />
                  ) : f.type === "select" ? (
                    <select
                      name={f.name}
                      value={form[f.name] ?? ""}
                      onChange={handleChange}
                      required={f.required}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
                    >
                      {f.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "boolean" ? (
                    <input
                      type="checkbox"
                      name={f.name}
                      checked={!!form[f.name]}
                      onChange={handleChange}
                      className="h-5 w-5 rounded border-gray-300 text-[#0F766E] focus:ring-[#0F766E]"
                    />
                  ) : (
                    <input
                      type={f.type || "text"}
                      name={f.name}
                      value={form[f.name] ?? ""}
                      onChange={handleChange}
                      required={f.required}
                      placeholder={f.placeholder}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
                    />
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 disabled:opacity-70"
                >
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
