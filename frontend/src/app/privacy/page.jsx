"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileText,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function PrivacyPage() {
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
              Privacy Policy
            </span>
          </nav>

          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#0F766E]/15 bg-[#0F766E]/5 px-3 py-1 text-[12px] font-medium text-[#0F766E]">
              <ShieldCheck className="h-4 w-4" />
              Your privacy matters
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-gray-700 sm:text-3xl lg:text-4xl">
              Privacy Policy
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
              Learn how we collect, use, protect, and handle your information
              when you use our website and services.
            </p>

        
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-5 sm:py-6 lg:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-12">
            {/* Sidebar */}
            <aside className="hidden lg:block lg:order-2">
              <div className="sticky top-24">
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                    On this page
                  </p>

                  <nav className="space-y-1">
                    {[
                      "Introduction",
                      "Information We Collect",
                      "How We Use Your Information",
                      "Data Security",
                      "Your Rights",
                      "Contact Us",
                    ].map((item, index) => (
                  
<a
  key={item}
  href={`#section-${index + 1}`}
  className="group flex items-center gap-2 rounded-lg border border-transparent px-3 py-2.5 text-sm text-gray-600 transition-all duration-200 hover:border-[#0F766E]/50 hover:bg-[#0F766E]/5 hover:text-[#0F766E]"
>
  <span
    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500 transition-all duration-200 group-hover:bg-[#0F766E] group-hover:text-white"
  >
    {index + 1}
  </span>

  <span className="leading-5">
    {item}
  </span>
</a>


                    ))}
                  </nav>
                </div>

       
              </div>
            </aside>

            {/* Policy Content */}
            <article className="min-w-0 lg:order-1">
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                {/* Document Header */}
                <div className="border-b border-gray-200 bg-gray-50/70 px-5 py-5 sm:px-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-base font-semibold text-gray-600">
                        Privacy &amp; Data Protection
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-gray-500">
                        Please review the following information to understand
                        how your data is handled.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Document Body */}
                <div className="px-5 py-7 sm:px-8 sm:py-10 lg:px-10">
                  <div className="space-y-10">
                    {/* Section 1 */}
                    <PolicySection
                      id="section-1"
                      number="01"
                      title="Introduction"
                    >
                      <p>
                        At STORE, we take your privacy seriously. This Privacy
                        Policy explains how we collect, use, disclose, and
                        safeguard your information when you visit our website
                        or make a purchase.
                      </p>
                    </PolicySection>

                    {/* Section 2 */}
                    <PolicySection
                      id="section-2"
                      number="02"
                      title="Information We Collect"
                    >
                      <p>
                        We may collect information about you in a variety of
                        ways, including:
                      </p>

                      <InfoList
                        items={[
                          <>
                            <strong>Personal Data:</strong> Name, email
                            address, phone number, shipping address
                          </>,
                          <>
                            <strong>Payment Information:</strong> Credit card
                            details (processed securely by our payment
                            provider)
                          </>,
                          <>
                            <strong>Usage Data:</strong> Browser type, IP
                            address, pages visited, time spent on site
                          </>,
                        ]}
                      />
                    </PolicySection>

                    {/* Section 3 */}
                    <PolicySection
                      id="section-3"
                      number="03"
                      title="How We Use Your Information"
                    >
                      <p>We use the information we collect to:</p>

                      <InfoList
                        items={[
                          "Process and fulfill your orders",
                          "Send order confirmations and shipping updates",
                          "Respond to customer service requests",
                          "Send marketing communications (with your consent)",
                          "Improve our website and product offerings",
                        ]}
                      />
                    </PolicySection>

                    {/* Section 4 */}
                    <PolicySection
                      id="section-4"
                      number="04"
                      title="Data Security"
                    >
                      <div className="rounded-xl border border-[#0F766E]/15 bg-[#0F766E]/5 p-4 sm:p-5">
                        <div className="flex gap-3">
                          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0F766E]" />

                          <p className="text-sm leading-7 text-gray-600">
                            We implement appropriate technical and
                            organizational security measures to protect your
                            personal data. However, no method of transmission
                            over the Internet is 100% secure, and we cannot
                            guarantee absolute security.
                          </p>
                        </div>
                      </div>
                    </PolicySection>

                    {/* Section 5 */}
                    <PolicySection
                      id="section-5"
                      number="05"
                      title="Your Rights"
                    >
                      <p>
                        You have the right to access, correct, or delete your
                        personal data. To exercise these rights, please contact
                        us at{" "}
                        <Link
                          href="mailto:privacy@store.com"
                          className="font-medium text-[#0F766E] underline decoration-[#0F766E]/30 underline-offset-4 transition-colors hover:text-[#0a5c4f] hover:decoration-[#0a5c4f]"
                        >
                          privacy@store.com
                        </Link>
                        .
                      </p>
                    </PolicySection>

                    {/* Section 6 */}
                    <PolicySection
                      id="section-6"
                      number="06"
                      title="Contact Us"
                    >
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:p-6">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#0F766E] ring-1 ring-gray-200">
                              <Mail className="h-5 w-5" />
                            </div>

                            <div>
                              <h3 className="font-semibold text-gray-600">
                                Have questions?
                              </h3>

                              <p className="mt-1 text-sm leading-6 text-gray-500">
                                If you have any questions about this Privacy
                                Policy, please contact us.
                              </p>
                            </div>
                          </div>

                          <Link
                            href="mailto:privacy@store.com"
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0a5c4f] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:ring-offset-2"
                          >
                            Contact Privacy Team
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </PolicySection>
                  </div>
                </div>

                {/* Document Footer */}
                <div className="border-t border-gray-200 bg-gray-50/70 px-5 py-5 sm:px-8">
                  <div className="flex flex-col gap-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#0F766E]" />
                      <span>Privacy policy information</span>
                    </div>

                    <span>Last updated: August 10, 2026</span>
                  </div>
                </div>
              </div>

              {/* Mobile Quick Links */}
              <div className="mt-6 lg:hidden">
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                    Quick navigation
                  </p>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {[
                      "Introduction",
                      "Information We Collect",
                      "How We Use Your Information",
                      "Data Security",
                      "Your Rights",
                      "Contact Us",
                    ].map((item, index) => (
                      <a
                        key={item}
                        href={`#section-${index + 1}`}
                        className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-[#0F766E]/5 hover:text-[#0F766E]"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-gray-500 ring-1 ring-gray-200">
                          {index + 1}
                        </span>

                        {item}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}

/* -------------------------------------------------------
   Reusable Components
------------------------------------------------------- */

function PolicySection({ id, number, title, children }) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-b border-gray-100 pb-10 last:border-0 last:pb-0"
    >
      <div className="flex items-start gap-4 sm:gap-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0F766E]/10 text-xs font-bold text-[#0F766E]">
          {number}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold tracking-tight text-gray-600 sm:text-xl">
            {title}
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-gray-600 sm:text-[15px]">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoList({ items }) {
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item, index) => (
        <li
          key={index}
          className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3.5"
        >
          <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#0F766E]" />

          <span className="leading-6 text-gray-600">{item}</span>
        </li>
      ))}
    </ul>
  );
}