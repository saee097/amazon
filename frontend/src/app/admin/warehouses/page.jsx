"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminWarehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const { data } = await api.get("/warehouses");
        setWarehouses(data.data || []);
      } catch (error) {
        console.error("Failed to load warehouses:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWarehouses();
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Warehouses</h1>
        <button className="px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 transition">
          Add Warehouse
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {warehouses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No warehouses found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {warehouses.map((warehouse) => (
                <tr key={warehouse._id}>
                  <td className="px-6 py-4 font-medium">{warehouse.warehouse_name}</td>
                  <td className="px-6 py-4">{warehouse.location || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}