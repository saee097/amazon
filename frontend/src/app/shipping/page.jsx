"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Headphones,
  Package,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";

export default function ShippingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Hero */}
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

            <span className="font-medium text-gray-600">
              Shipping &amp; Returns
            </span>
          </nav>

          <div className="max-w-2xl">
            <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-[#0F766E]/15 bg-[#0F766E]/5 px-3 py-1 text-[12px] font-medium text-[#0F766E]">
              <Package className="h-4 w-4" />
              Shipping &amp; Returns
            </div>

 <h1 className="text-2xl font-semibold leading-[1.08] tracking-[-0.03em] text-gray-700 sm:text-3xl lg:text-[40px]">              Shipping made simple.
                <span className="mt-1 block text-[#0F766E]">
                Returns made easy.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
              Everything you need to know about delivery, order processing,
              returns, exchanges, and refunds.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Benefits */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 divide-y divide-gray-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            <Benefit
              icon={<Truck className="h-5 w-5" />}
              title="Free Standard Shipping"
              text="On orders over $50"
            />

            <Benefit
              icon={<Clock3 className="h-5 w-5" />}
              title="Fast Processing"
              text="Orders processed in 1–2 days"
            />

            <Benefit
              icon={<RotateCcw className="h-5 w-5" />}
              title="30-Day Returns"
              text="Easy returns after delivery"
            />

            <Benefit
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Secure Refunds"
              text="Refunded to original payment"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
            {/* Main Column */}
            <div className="space-y-8">
              {/* Shipping Policy */}
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <div className="border-b border-gray-200 bg-gray-50/70 px-5 py-5 sm:px-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
                      <Truck className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-gray-700 sm:text-xl">
                        Shipping Policy
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Delivery options, processing times, and shipping fees.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-8">
                  <p className="text-sm leading-7 text-gray-600 sm:text-[15px]">
                    We offer free standard shipping on all orders over $50.
                    Orders below $50 are subject to a flat $5.99 shipping fee.
                  </p>

                  {/* Free Shipping Highlight */}
                  <div className="mt-6 rounded-2xl border border-[#0F766E]/15 bg-[#0F766E]/5 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0F766E]">
                        <Package className="h-5 w-5" />
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-700">
                          Free standard shipping
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-gray-600">
                          Spend $50 or more and enjoy free standard delivery.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Times */}
                  <div className="mt-8 border-t border-gray-100 pt-7">
                    <div className="mb-5">
                      <h3 className="text-base font-bold text-gray-700">
                        Delivery Times
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Choose the delivery speed that works for you.
                      </p>
                    </div>

                    <div className="grid gap-3">
                      <DeliveryOption
                        title="Standard Shipping"
                        time="5–7 business days"
                        description="Reliable delivery for everyday orders."
                        icon={<Truck className="h-5 w-5" />}
                      />

                      <DeliveryOption
                        title="Express Shipping"
                        time="2–3 business days"
                        description="Get your order sooner with express delivery."
                        icon={<Package className="h-5 w-5" />}
                      />

                      <DeliveryOption
                        title="Overnight Shipping"
                        time="1 business day"
                        description="The fastest available delivery option."
                        icon={<Clock3 className="h-5 w-5" />}
                      />
                    </div>
                  </div>

                  {/* Order Processing */}
                  <div className="mt-8 border-t border-gray-100 pt-7">
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                        <Clock3 className="h-5 w-5" />
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-gray-700">
                          Order Processing
                        </h3>

                        <p className="mt-2 text-sm leading-7 text-gray-600">
                          Orders are processed within 1-2 business days. You
                          will receive a confirmation email with tracking
                          information once your order ships.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Returns */}
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <div className="border-b border-gray-200 bg-gray-50/70 px-5 py-5 sm:px-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
                      <RefreshCcw className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-gray-700 sm:text-xl">
                        Returns &amp; Exchanges
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Simple steps for returning eligible items.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-8">
                  <p className="text-sm leading-7 text-gray-600 sm:text-[15px]">
                    We accept returns within 30 days of delivery. Items must be
                    unworn, unwashed, and in their original packaging with tags
                    attached.
                  </p>

                  {/* Return Eligibility */}
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <Eligibility
                      icon={<CheckCircle2 className="h-5 w-5" />}
                      text="Within 30 days"
                    />

                    <Eligibility
                      icon={<CheckCircle2 className="h-5 w-5" />}
                      text="Unworn & unwashed"
                    />

                    <Eligibility
                      icon={<CheckCircle2 className="h-5 w-5" />}
                      text="Original packaging"
                    />
                  </div>

                  {/* How to Return */}
                  <div className="mt-8 border-t border-gray-100 pt-7">
                    <div className="mb-5">
                      <h3 className="text-base font-bold text-gray-700">
                        How to Return
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Follow these steps to start your return.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <ReturnStep
                        number="01"
                        title="Contact our support team"
                        description="Contact our support team to initiate a return."
                      />

                      <ReturnStep
                        number="02"
                        title="Pack the item securely"
                        description="Pack the item securely in its original packaging."
                      />

                      <ReturnStep
                        number="03"
                        title="Include the return label"
                        description="Include the return label inside the package."
                      />

                      <ReturnStep
                        number="04"
                        title="Drop off your package"
                        description="Drop off at any authorized carrier location."
                      />
                    </div>
                  </div>

                  {/* Refund Timeline */}
                  <div className="mt-8 border-t border-gray-100 pt-7">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0F766E] ring-1 ring-gray-200">
                          <RefreshCcw className="h-5 w-5" />
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-gray-700">
                            Refund Timeline
                          </h3>

                          <p className="mt-2 text-sm leading-7 text-gray-600">
                            Refunds are processed within 5-7 business days
                            after we receive your return. The refund will be
                            issued to the original payment method.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
          

              {/* Quick Links */}
         <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
  <div className="flex items-start justify-between gap-4">
    <div>
      <h3 className="text-sm font-semibold tracking-tight text-gray-900">
        Quick Links
      </h3>
    </div>
  </div>

  <div className="mt-5 divide-y divide-gray-100">
    <QuickLink href="/track-order" label="Track Order" />
    <QuickLink href="/faq" label="Frequently Asked Questions" />
    <QuickLink href="/size-guide" label="Size Guide" />
  </div>
</div>

              {/* Trust Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <h3 className="mt-4 font-semibold text-gray-700">
                  Shop with confidence
                </h3>

                <div className="mt-4 space-y-3">
                  <TrustItem text="Secure checkout" />
                  <TrustItem text="30-day returns" />
                  <TrustItem text="Order tracking" />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

    
    </main>
  );
}

/* -------------------------------------------------------
   Reusable Components
------------------------------------------------------- */

function Benefit({ icon, title, text }) {
  return (
    <div className="flex items-center gap-3 px-0 py-4 sm:px-5 lg:py-2 first:pl-0 last:pr-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
        {icon}
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700">{title}</p>
        <p className="mt-0.5 text-xs text-gray-500">{text}</p>
      </div>
    </div>
  );
}

function DeliveryOption({ icon, title, time, description }) {
  return (
    <div className="group flex items-center gap-4 rounded-xl border border-gray-200 p-4 transition-all hover:border-[#0F766E]/30 hover:bg-[#0F766E]/5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-colors group-hover:bg-white group-hover:text-[#0F766E]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-sm font-semibold text-gray-700">{title}</h4>

          <span className="text-xs font-semibold text-[#0F766E]">
            {time}
          </span>
        </div>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function Eligibility({ icon, text }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
      <span className="text-[#0F766E]">{icon}</span>
      <span className="text-xs font-medium text-gray-700">{text}</span>
    </div>
  );
}

function ReturnStep({ number, title, description }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0F766E]/10 text-[10px] font-bold text-[#0F766E]">
        {number}
      </div>

      <div className="min-w-0 pt-0.5">
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>

        <p className="mt-1 text-sm leading-6 text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function QuickLink({ href, label }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition-all hover:bg-[#0F766E]/5 hover:text-[#0F766E]"
    >
      <span>{label}</span>

 
    </Link>
  );
}

function TrustItem({ text }) {
  return (
    <div className="flex items-center gap-2.5">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0F766E]" />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
}