"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  HelpCircle,
  Mail,ChevronRight,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";

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
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="border-b border-gray-200 bg-white">
     

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex items-center gap-1.5 text-sm"
          >
            <Link
              href="/"
              className="font-medium text-gray-500 transition-colors hover:text-[#0F766E]"
            >
              Home
            </Link>

                       <ChevronRight className="h-4 w-4 text-gray-400" />


            <span className="font-medium text-gray-900">
              Track Order
            </span>
          </nav>

          {/* Hero Content */}
          <div className="max-w-3xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#0F766E]/15 bg-[#0F766E]/5 px-3 py-1 text-[12px] font-medium text-[#0F766E]">
                <ShieldCheck className="h-4 w-4" />
              Order Tracking
            </div>

           

        
  <h1 className="text-3xl font-semibold tracking-tight text-gray-700 sm:text-3xl lg:text-4xl">
              Track your order
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
              Enter your order details below to see the latest status,
              shipment information, and estimated delivery date.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <section className="py-5 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            {/* =================================================
                MAIN COLUMN
            ================================================== */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tracking Form */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {/* Card Header */}
                <div className="px-5 sm:px-7 py-5 border-b border-gray-200 bg-gray-50/70">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0F766E]/10 text-[#0F766E]">
                      <Search className="w-5 h-5" />
                    </div>

                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                        Find your shipment
                      </h2>

                      <p className="mt-0.5 text-xs text-gray-500">
                        Use the details from your order confirmation.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form
                  onSubmit={handleTrack}
                  className="p-5 sm:p-7"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Order ID */}
                    <div>
                      <label
                        htmlFor="orderId"
                        className="block text-sm font-medium text-gray-800 mb-2"
                      >
                        Order ID
                      </label>

                      <div className="relative">
                        <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

                        <input
                          id="orderId"
                          type="text"
                          required
                          value={orderId}
                          onChange={(e) =>
                            setOrderId(e.target.value)
                          }
                          placeholder="e.g. ORD-12345"
                          className="w-full h-12 pl-10 pr-4 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-[#0F766E] focus:ring-4 focus:ring-[#0F766E]/10"
                        />
                      </div>

                      <p className="mt-2 text-xs text-gray-400">
                        Your order ID can be found in your confirmation
                        email.
                      </p>
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-800 mb-2"
                      >
                        Email Address
                      </label>

                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

                        <input
                          id="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) =>
                            setEmail(e.target.value)
                          }
                          placeholder="you@example.com"
                          className="w-full h-12 pl-10 pr-4 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-[#0F766E] focus:ring-4 focus:ring-[#0F766E]/10"
                        />
                      </div>

                      <p className="mt-2 text-xs text-gray-400">
                        Use the email associated with your order.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-[#0F766E] text-white text-sm font-semibold rounded-lg hover:bg-[#0F766E]/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Tracking order...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          Track Order
                        </>
                      )}
                    </button>

                    <p className="text-xs text-gray-400">
                      Tracking information may take some time to update
                      after shipment.
                    </p>
                  </div>
                </form>
              </div>

              {/* =================================================
                  RESULT
              ================================================== */}
              {result && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  {/* Status Header */}
                  <div className="p-5 sm:p-7 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Package className="w-4 h-4" />
                          Order
                        </div>

                        <div className="mt-1 flex items-center gap-3">
                          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                            {result.orderId}
                          </h2>

                          <button
                            type="button"
                            title="Copy order ID"
                            className="p-1.5 rounded-md text-gray-400 hover:text-[#0F766E] hover:bg-[#0F766E]/5 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start px-3.5 py-2 rounded-full bg-[#0F766E]/10 text-[#0F766E]">
                        <span className="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse" />

                        <span className="text-xs font-semibold">
                          {result.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Summary */}
                  <div className="p-5 sm:p-7">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <InfoCard
                        icon={<Truck />}
                        label="Carrier"
                        value={result.carrier}
                      />

                      <InfoCard
                        icon={<Package />}
                        label="Tracking Number"
                        value={result.trackingNumber}
                      />

                      <InfoCard
                        icon={<Clock3 />}
                        label="Estimated Delivery"
                        value={result.estimatedDelivery}
                      />
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="px-5 sm:px-7 pb-7">
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Shipment progress
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          Follow your package from order placement to
                          delivery.
                        </p>
                      </div>

                      <div className="p-5 sm:p-7">
                        {/* Desktop Progress */}
                        <div className="hidden md:block">
                          <div className="relative">
                            {/* Background Line */}
                            <div className="absolute left-[10%] right-[10%] top-5 h-0.5 bg-gray-200" />

                            {/* Completed Line */}
                            <div
                              className="absolute left-[10%] top-5 h-0.5 bg-[#0F766E]"
                              style={{
                                width: "50%",
                              }}
                            />

                            <div className="relative grid grid-cols-5">
                              {result.steps.map((step, idx) => (
                                <div
                                  key={idx}
                                  className="flex flex-col items-center text-center"
                                >
                                  <div
                                    className={`
                                      relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white
                                      ${
                                        step.done
                                          ? "bg-[#0F766E] text-white "
                                          : "bg-gray-100 text-gray-400 border-gray-200"
                                      }
                                    `}
                                  >
                                    {step.done ? (
                                      <Check className="w-4 h-4" />
                                    ) : (
                                      <span className="text-xs font-semibold">
                                        {idx + 1}
                                      </span>
                                    )}
                                  </div>

                                  <p
                                    className={`mt-3 text-xs font-semibold ${
                                      step.done
                                        ? "text-gray-900"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {step.label}
                                  </p>

                                  <p className="mt-1 text-[11px] text-gray-400">
                                    {step.date}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Mobile Progress */}
                        <div className="md:hidden relative">
                          <div className="absolute left-5 top-5 bottom-5 w-px bg-gray-200" />

                          <div className="space-y-6">
                            {result.steps.map((step, idx) => (
                              <div
                                key={idx}
                                className="relative flex items-start gap-4"
                              >
                                <div
                                  className={`
                                    relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white
                                    ${
                                      step.done
                                        ? "bg-[#0F766E] text-white"
                                        : "bg-gray-100 text-gray-400 border-gray-200"
                                    }
                                  `}
                                >
                                  {step.done ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <span className="text-xs font-semibold">
                                      {idx + 1}
                                    </span>
                                  )}
                                </div>

                                <div className="pt-1">
                                  <p
                                    className={`text-sm font-semibold ${
                                      step.done
                                        ? "text-gray-900"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {step.label}
                                  </p>

                                  <p className="mt-1 text-xs text-gray-400">
                                    {step.date}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Notice */}
                  <div className="px-5 sm:px-7 pb-7">
                    <div className="flex items-start gap-3 rounded-xl bg-[#0F766E]/5 border border-[#0F766E]/10 p-4">
                      <MapPin className="w-5 h-5 shrink-0 text-[#0F766E] mt-0.5" />

                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Your package is on its way
                        </p>

                        <p className="mt-1 text-xs sm:text-sm text-gray-600 leading-5">
                          Your order has been shipped and is currently in
                          transit. The estimated delivery date is{" "}
                          <span className="font-medium text-gray-900">
                            {result.estimatedDelivery}
                          </span>
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  EMPTY STATE
              ================================================== */}
              {!result && !loading && (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 sm:p-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                    <Package className="w-6 h-6" />
                  </div>

                  <h2 className="mt-5 text-base sm:text-lg font-semibold text-gray-900">
                    Your tracking details will appear here
                  </h2>

                  <p className="mt-2 max-w-md mx-auto text-sm text-gray-500 leading-6">
                    Enter your order ID and email address above to view
                    your shipment status and delivery progress.
                  </p>
                </div>
              )}
            </div>

            {/* =================================================
                SIDEBAR
            ================================================== */}
            <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
            

            {/* Secure Shopping / Trust Panel */}
<div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
  {/* Header */}
  <div className="flex items-start gap-3.5">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-green-100 bg-green-50 text-green-600">
      <ShieldCheck
        className="h-5.5 w-5.5"
        strokeWidth={2}
        aria-hidden="true"
      />
    </div>

    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold tracking-tight text-gray-900">
          Shop with confidence
        </h3>

        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
          Secure
        </span>
      </div>

      <p className="mt-1.5 text-xs leading-5 text-gray-500">
        Your shopping experience is designed to be secure, reliable,
        and hassle-free.
      </p>
    </div>
  </div>

  {/* Trust Features */}
  <div className="mt-5 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/60">
    {[
      {
        text: "Secure checkout",
        description: "Protected payment experience",
      },
      {
        text: "Order tracking",
        description: "Stay updated from purchase to delivery",
      },
      {
        text: "Customer support",
        description: "We're here when you need us",
      },
    ].map((item) => (
      <div
        key={item.text}
        className="group flex items-center gap-3 px-3.5 py-3 transition-colors duration-200 hover:bg-white"
      >
        {/* Check Icon */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-green-600 ring-1 ring-gray-100 transition-all duration-200 group-hover:bg-green-50 group-hover:ring-green-100">
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.3a1 1 0 0 1-1.42.006L3.29 9.296a1 1 0 1 1 1.42-1.408l4.04 4.073 6.544-6.59a1 1 0 0 1 1.41-.08Z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-800">
            {item.text}
          </p>

          <p className="mt-0.5 text-[11px] leading-4 text-gray-500">
            {item.description}
          </p>
        </div>
      </div>
    ))}
  </div>

 
</div>

              {/* Contact Support */}
              <div className="overflow-hidden rounded-2xl bg-[#0F766E] text-white">
                <div className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                    <MessageIcon />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">
                    Need help with your order?
                  </h3>

                  <p className="mt-2 text-sm text-white/75 leading-6">
                    If you cannot find your order or have questions about
                    your delivery, our support team can help.
                  </p>

                  <Link
                    href="/contact"
                    className="mt-6 flex items-center justify-center gap-2 w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#0F766E] hover:bg-gray-100 transition-colors"
                  >
                    Contact Support
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
      <div className="flex items-center gap-2 text-gray-400">
        <span className="w-4 h-4 text-[#0F766E]">
          {icon}
        </span>

        <span className="text-xs">{label}</span>
      </div>

      <p className="mt-2 text-sm font-semibold text-gray-900 break-words">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   TIP
========================================================= */

function Tip({ number, text }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-[#0F766E]">
        {number}
      </span>

      <p className="text-xs text-gray-600 leading-5">
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   TRUST ITEM
========================================================= */

function TrustItem({ text }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />

      <span className="text-xs text-gray-600">
        {text}
      </span>
    </div>
  );
}

/* =========================================================
   MESSAGE ICON
========================================================= */

function MessageIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-1 4 8.5 8.5 0 0 1-7.5 4.5 8.38 8.38 0 0 1-4-1L3 21l1.5-5.5a8.38 8.38 0 0 1-1-4A8.5 8.5 0 0 1 8 4a8.38 8.38 0 0 1 4-1h.5A8.5 8.5 0 0 1 21 11v.5Z" />
    </svg>
  );
}