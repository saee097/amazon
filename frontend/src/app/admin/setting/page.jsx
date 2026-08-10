"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminSettings() {
  const [form, setForm] = useState({
    storeName: "",
    supportEmail: "",
    currency: "USD",
    maintenanceMode: false,
  });
  const [id, setId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/admin/settings").catch(() => ({ data: { data: [] } }));
        const list = data.data || [];
        if (list.length > 0) {
          const s = list[0];
          setId(s._id);
          setForm({
            storeName: s.storeName || "",
            supportEmail: s.supportEmail || "",
            currency: s.currency || "USD",
            maintenanceMode: !!s.maintenanceMode,
          });
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (id) {
        await api.put(`/admin/settings/${id}`, form);
      } else {
        const res = await api.post("/admin/settings", form);
        setId(res.data.data?._id);
      }
      alert("Settings saved.");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
            <input
              type="text"
              name="storeName"
              value={form.storeName}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
            <input
              type="email"
              name="supportEmail"
              value={form.supportEmail}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <input
              type="text"
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
            />
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="maintenanceMode"
              checked={form.maintenanceMode}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-[#0F766E] focus:ring-[#0F766E]"
            />
            <span className="text-sm text-gray-700">Maintenance Mode</span>
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
