"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    country: "",
    state: "",
    city: "",
    zipCode: "",
    street: "",
  });

  useEffect(() => {
    if (!getToken()) {
      router.push("/auth/login");
      return;
    }

    const loadAddresses = async () => {
      try {
        const { data } = await api.get("/addresses");
        setAddresses(data.data || []);
      } catch {
        removeToken();
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    loadAddresses();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const addAddress = async (e) => {
    e.preventDefault();

    try {
      await api.post("/addresses", {
        ...form,
        zip_code: form.zipCode,
      });

      setForm({
        country: "",
        state: "",
        city: "",
        zipCode: "",
        street: "",
      });
      setShowAddForm(false);

      const { data } = await api.get("/addresses");
      setAddresses(data.data || []);
    } catch (error) {
      console.error("Failed to add address:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-light text-gray-800 mb-3">
              Address Book
            </h1>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 w-full text-center">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading addresses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-light text-gray-800 mb-3">
            Address Book
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">
            Manage your shipping addresses
          </p>
        </div>

        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 transition"
          >
            Add New Address
          </button>
        </div>

        {addresses.length === 0 && !showAddForm ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 text-center">
            <p className="text-gray-500 mb-4">No addresses saved yet.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-sm font-medium text-[#0F766E] hover:underline"
            >
              Add your first address
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div key={address._id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{address.street}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {address.city}, {address.state && `${address.state},`} {address.country}
                    </p>
                    {address.zip_code && (
                      <p className="text-sm text-gray-500">ZIP: {address.zip_code}</p>
                    )}
                  </div>
                  {address.isDefault && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Default
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-5">Add New Address</h2>
              <form onSubmit={addAddress} className="space-y-4">
                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  value={form.country}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-500 outline-none transition focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]/20"
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State/Province"
                  value={form.state}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-500 outline-none transition focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]/20"
                />
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={form.city}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-500 outline-none transition focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]/20"
                />
                <input
                  type="text"
                  name="zipCode"
                  placeholder="ZIP Code"
                  value={form.zipCode}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-500 outline-none transition focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]/20"
                />
                <input
                  type="text"
                  name="street"
                  placeholder="Street Address"
                  value={form.street}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-500 outline-none transition focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]/20"
                />
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#0F766E] text-white rounded-lg text-sm font-semibold hover:bg-[#0F766E]/90 transition"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}