"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminShipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShipments = async () => {
      try {
        const { data } = await api.get("/admin/shipments");
        setShipments(data.data || []);
      } catch (error) {
        console.error("Failed to load shipments:", error);
      } finally {
        setLoading(false);
      }
    };

    loadShipments();
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Shipments</h1>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {shipments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No shipments found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Order</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Carrier</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Tracking</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shipments.map((shipment) => (
                <tr key={shipment._id}>
                  <td className="px-6 py-4">#{shipment.order?._id?.toString().slice(-6).toUpperCase()}</td>
                  <td className="px-6 py-4">{shipment.carrier || "N/A"}</td>
                  <td className="px-6 py-4">{shipment.tracking_number || "N/A"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        shipment.delivery_status === "delivered"
                          ? "bg-green-100 text-green-800"
                          : shipment.delivery_status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {shipment.delivery_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}