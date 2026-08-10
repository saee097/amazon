"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminStock() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    product: "",
    variant: "",
    warehouse: "",
    type: "adjustment",
    quantity: "",
    reason: "",
    reference: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [stockRes, productsRes, warehousesRes] = await Promise.all([
          api.get("/admin/stock"),
          api.get("/admin/products"),
          api.get("/warehouses"),
        ]);
        setStock(stockRes.data.data || []);
        setProducts(productsRes.data.data || []);
        setWarehouses(warehousesRes.data.data || []);
      } catch (error) {
        console.error("Failed to load stock:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        product: form.product || undefined,
        variant: form.variant || undefined,
      };

      const res = await api.post("/admin/stock", payload);

      if (res.data.success) {
        setShowForm(false);
        setForm({
          product: "",
          variant: "",
          warehouse: "",
          type: "adjustment",
          quantity: "",
          reason: "",
          reference: "",
        });

        const stockRes = await api.get("/admin/stock");
        setStock(stockRes.data.data || []);
      }
    } catch (error) {
      console.error("Failed to create stock entry:", error);
    } finally {
      setSubmitting(false);
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
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stock</h1>
          <p className="text-sm text-gray-500 mt-1">{stock.length} records</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 transition"
        >
          {showForm ? "Cancel" : "Add Stock"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">New Stock Entry</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                <select
                  value={form.product}
                  onChange={(e) => setForm({ ...form, product: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
                >
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Warehouse</label>
                <select
                  value={form.warehouse}
                  onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.warehouse_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
                >
                  <option value="purchase">Purchase</option>
                  <option value="sale">Sale</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="return">Return</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference</label>
                <input
                  type="text"
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-[#0F766E]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 disabled:opacity-70 transition"
              >
                {submitting ? "Saving..." : "Save Stock Entry"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {stock.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No stock records found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Product</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Warehouse</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Quantity</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Reason</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stock.map((item) => (
                <tr key={item._id}>
                  <td className="px-6 py-4">
                    {item.product?.title || item.variant?.product?.title || "Unknown"}
                  </td>
                  <td className="px-6 py-4">{item.warehouse?.warehouse_name || "Unknown"}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">{item.quantity}</td>
                  <td className="px-6 py-4">{item.reason || "-"}</td>
                  <td className="px-6 py-4">{item.reference || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
