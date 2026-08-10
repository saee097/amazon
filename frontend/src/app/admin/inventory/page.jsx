"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const { data } = await api.get("/admin/inventory");
        setInventory(data.data || []);
      } catch (error) {
        console.error("Failed to load inventory:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, []);

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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Inventory</h1>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {inventory.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No inventory items found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Product</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Warehouse</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inventory.map((item) => (
                <tr key={item._id}>
                  <td className="px-6 py-4">
                    {item.variant?.product?.title || "Unknown Product"}
                  </td>
                  <td className="px-6 py-4">{item.warehouse?.warehouse_name || "Unknown"}</td>
                  <td className="px-6 py-4">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}