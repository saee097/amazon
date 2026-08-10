"use client";

import { useState } from "react";
import Link from "next/link";
import { FiMapPin } from "react-icons/fi";

const stores = [
  { city: "Karachi", address: "123 Fashion Street, Clifton, Karachi", hours: "10:00 AM - 10:00 PM", phone: "+92 300 1234567" },
  { city: "Lahore", address: "45 Mall Road, Gulberg, Lahore", hours: "10:00 AM - 10:00 PM", phone: "+92 300 7654321" },
  { city: "Islamabad", address: "78 Jinnah Avenue, F-8, Islamabad", hours: "10:00 AM - 9:00 PM", phone: "+92 300 9876543" },
];

export default function StoresPage() {
  const [selected, setSelected] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#0F766E]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Store Locator</span>
        </nav>
        <h1 className="text-3xl font-medium text-gray-800 tracking-wide uppercase mb-8">Store Locator</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Our Stores</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {stores.map((store, idx) => (
                  <button key={store.city} onClick={() => setSelected(idx)} className={`w-full text-left px-6 py-5 hover:bg-gray-50 transition ${selected === idx ? "bg-[#0F766E]/5" : ""}`}>
                    <div className="flex items-start gap-3">
                      <FiMapPin className={`mt-0.5 ${selected === idx ? "text-[#0F766E]" : "text-gray-400"}`} size={18} />
                      <div>
                        <h3 className={`text-sm font-medium ${selected === idx ? "text-[#0F766E]" : "text-gray-800"}`}>{store.city}</h3>
                        <p className="text-xs text-gray-500 mt-1">{store.address}</p>
                        <p className="text-xs text-gray-400 mt-1">{store.hours} • {store.phone}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Visit Us</h3>
              <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                <div className="text-center">
                  <FiMapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Interactive map placeholder</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <p className="font-medium text-gray-800">{stores[selected].city}</p>
                  <p className="text-gray-500">{stores[selected].address}</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Hours</span>
                  <span className="text-gray-800">{stores[selected].hours}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <span className="text-gray-800">{stores[selected].phone}</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">In-Store Services</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Personal Styling</li>
                <li>Alterations &amp; Tailoring</li>
                <li>Gift Wrapping</li>
                <li>Click &amp; Collect</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
