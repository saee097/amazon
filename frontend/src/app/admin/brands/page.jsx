"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const { data } = await api.get("/brands");
        setBrands(data.data || []);
      } catch (error) {
        console.error("Failed to load brands:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBrands();
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
        <h1 className="text-2xl font-bold text-gray-800">Brands</h1>
        <a
          href="/admin/brands/create"
          className="px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 transition"
        >
          Add New Brand
        </a>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {brands.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No brands found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Logo</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Slug</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {brands.map((brand) => (
                <tr key={brand._id}>
                  <td className="px-6 py-4">
                    {brand.logo ? (
                      <img src={brand.logo} alt={brand.brand_name} className="w-12 h-12 object-contain" />
                    ) : (
                      <span className="text-2xl">🏷️</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium">{brand.brand_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{brand.slug}</td>
                  <td className="px-6 py-4">
                    <a
                      href={`/admin/brands/edit/${brand._id}`}
                      className="text-sm text-[#0F766E] hover:underline"
                    >
                      Edit
                    </a>
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