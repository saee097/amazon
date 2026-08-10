"use client";

import { useState } from "react";
import Link from "next/link";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setResult({
        orderId: orderId || "ORD-12345",
        status: "In Transit",
        estimatedDelivery: "August 15, 2026",
        trackingNumber: "PK-987654321",
        carrier: "Pakistan Post",
        steps: [
          { label: "Order Placed", date: "Aug 10, 2026", done: true },
          { label: "Processing", date: "Aug 10, 2026", done: true },
          { label: "Shipped", date: "Aug 11, 2026", done: true },
          { label: "Out for Delivery", date: "Pending", done: false },
          { label: "Delivered", date: "Pending", done: false },
        ],
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#0F766E]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Track Order</span>
        </nav>
        <h1 className="text-3xl font-medium text-gray-800 tracking-wide uppercase mb-8">Track Order</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
              <form onSubmit={handleTrack} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order ID</label>
                  <input type="text" required value={orderId} onChange={(e) => setOrderId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#0F766E]" placeholder="e.g., ORD-12345" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#0F766E]" placeholder="you@example.com" />
                </div>
                <button type="submit" disabled={loading} className="px-8 py-3 bg-[#0F766E] text-white text-sm font-medium rounded-lg hover:bg-[#0F766E]/90 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? "Tracking..." : "Track Order"}
                </button>
              </form>

              {result && (
                <div className="mt-8 border-t border-gray-200 pt-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-500">Order ID</p>
                      <p className="text-lg font-semibold text-gray-800">{result.orderId}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm text-gray-500">Status</p>
                      <span className="inline-block mt-1 px-3 py-1 bg-[#0F766E]/10 text-[#0F766E] text-xs font-medium rounded-full">{result.status}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Carrier</p>
                        <p className="font-medium text-gray-800">{result.carrier}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Tracking Number</p>
                        <p className="font-medium text-gray-800">{result.trackingNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Est. Delivery</p>
                        <p className="font-medium text-gray-800">{result.estimatedDelivery}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200"></div>
                    <div className="space-y-6">
                      {result.steps.map((step, idx) => (
                        <div key={idx} className="relative flex items-start gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${step.done ? "bg-[#0F766E] text-white" : "bg-gray-200 text-gray-500"}`}>
                            {step.done ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                              <span className="text-xs font-medium">{idx + 1}</span>
                            )}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${step.done ? "text-gray-800" : "text-gray-400"}`}>{step.label}</p>
                            <p className="text-xs text-gray-400">{step.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Order Tips</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="text-[#0F766E] mt-0.5">•</span>Your order ID was sent to your email after purchase.</li>
                <li className="flex items-start gap-2"><span className="text-[#0F766E] mt-0.5">•</span>Tracking info is updated within 24 hours of shipment.</li>
                <li className="flex items-start gap-2"><span className="text-[#0F766E] mt-0.5">•</span>For urgent queries, contact our support team.</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Need Help?</h3>
              <p className="text-sm text-gray-500 mb-4">Can&apos;t find your order or need assistance? We are here to help.</p>
              <Link href="/contact" className="block w-full text-center py-2.5 bg-[#0F766E] text-white text-sm font-medium rounded-lg hover:bg-[#0F766E]/90 transition">Contact Support</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
