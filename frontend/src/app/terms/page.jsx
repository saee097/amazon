"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileText,
  Gavel,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function TermsPage() {
  const sections = [
    "Acceptance of Terms",
    "Use of Our Services",
    "Products and Pricing",
    "Orders and Payments",
    "Intellectual Property",
    "Limitation of Liability",
    "Changes to Terms",
    "Contact Information",
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* =========================================================
          HERO
      ========================================================== */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-white">
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

            <span className="font-medium text-gray-700">
              Terms of Service
            </span>
          </nav>

          {/* Hero Content */}
          <div className="max-w-3xl pb-4">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-[#0F766E]/15 bg-[#0F766E]/5 px-3 py-1.5 text-xs font-semibold text-[#0F766E]">
              <Gavel className="h-3.5 w-3.5" />
              Terms &amp; Conditions
            </div>

  <h1 className="text-2xl font-semibold leading-[1.08] tracking-[-0.03em] text-gray-700 sm:text-3xl lg:text-[40px]">              Terms of Service
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base sm:leading-7">
              Please review these terms carefully before using our website,
              creating an account, or placing an order.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          MAIN CONTENT
      ========================================================== */}
      <section className="py-8 sm:py-10 lg:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
            {/* =====================================================
                TERMS DOCUMENT
            ====================================================== */}
            <article className="min-w-0">
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                {/* Document Header */}
                <div className="border-b border-gray-200 bg-gray-50/80 px-5 py-5 sm:px-8 sm:py-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#0F766E]/10 bg-[#0F766E]/10 text-[#0F766E]">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-gray-700">
                        Terms of Service
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-gray-500">
                        These terms govern your access to and use of our
                        website and services.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Document Body */}
                <div className="px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
                  <div className="space-y-10">
                    {/* Section 1 */}
                    <TermsSection
                      id="section-1"
                      number="01"
                      title="Acceptance of Terms"
                    >
                      <p>
                        By accessing or using our website, you agree to be
                        bound by these Terms of Service. If you do not agree to
                        these terms, please do not use our services.
                      </p>
                    </TermsSection>

                    {/* Section 2 */}
                    <TermsSection
                      id="section-2"
                      number="02"
                      title="Use of Our Services"
                    >
                      <p>
                        You agree to use our services only for lawful purposes
                        and in a way that does not infringe the rights of
                        others. You are responsible for maintaining the
                        confidentiality of your account information.
                      </p>
                    </TermsSection>

                    {/* Section 3 */}
                    <TermsSection
                      id="section-3"
                      number="03"
                      title="Products and Pricing"
                    >
                      <p>
                        We strive to display accurate product information and
                        pricing. However, errors may occur. We reserve the
                        right to correct any errors and to cancel orders
                        placed at incorrect prices.
                      </p>
                    </TermsSection>

                    {/* Section 4 */}
                    <TermsSection
                      id="section-4"
                      number="04"
                      title="Orders and Payments"
                    >
                      <p>
                        All orders are subject to acceptance and availability.
                        Payment must be received before orders are processed.
                        We accept major credit cards and select payment methods
                        as indicated at checkout.
                      </p>
                    </TermsSection>

                    {/* Section 5 */}
                    <TermsSection
                      id="section-5"
                      number="05"
                      title="Intellectual Property"
                    >
                      <p>
                        All content on this website, including text, graphics,
                        logos, and images, is the property of STORE and is
                        protected by copyright and other intellectual property
                        laws.
                      </p>
                    </TermsSection>

                    {/* Section 6 */}
                    <TermsSection
                      id="section-6"
                      number="06"
                      title="Limitation of Liability"
                    >
                      <div className="rounded-xl border border-[#0F766E]/15 bg-[#0F766E]/5 p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#0F766E] ring-1 ring-[#0F766E]/10">
                            <ShieldCheck className="h-4.5 w-4.5" />
                          </div>

                          <p className="text-sm leading-7 text-gray-600">
                            To the fullest extent permitted by law, STORE
                            shall not be liable for any indirect, incidental,
                            special, consequential, or punitive damages
                            arising from your use of our services.
                          </p>
                        </div>
                      </div>
                    </TermsSection>

                    {/* Section 7 */}
                    <TermsSection
                      id="section-7"
                      number="07"
                      title="Changes to Terms"
                    >
                      <p>
                        We may update these Terms of Service from time to time.
                        Continued use of our services after any changes
                        constitutes acceptance of the new terms.
                      </p>
                    </TermsSection>

                    {/* Section 8 */}
                    <TermsSection
                      id="section-8"
                      number="08"
                      title="Contact Information"
                    >
                      <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5 sm:p-6">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-[#0F766E]">
                              <Mail className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-700">
                                Questions about our terms?
                              </h3>

                              <p className="mt-1 text-sm leading-6 text-gray-500">
                                For questions about these Terms, please contact
                                us at{" "}
                                <Link
                                  href="mailto:legal@store.com"
                                  className="font-semibold text-[#0F766E] underline decoration-[#0F766E]/30 underline-offset-4 transition-colors hover:text-[#0a5c4f]"
                                >
                                  legal@store.com
                                </Link>
                                .
                              </p>
                            </div>
                          </div>

                          <Link
                            href="mailto:legal@store.com"
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#0a5c4f] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:ring-offset-2"
                          >
                            Contact Legal Team
                            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                          </Link>
                        </div>
                      </div>
                    </TermsSection>
                  </div>
                </div>

                {/* Document Footer */}
                <div className="border-t border-gray-200 bg-gray-50/70 px-5 py-5 sm:px-8">
                  <div className="flex flex-col gap-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0F766E]" />

                      <span>Terms of Service information</span>
                    </div>

                    <span>Last updated: August 10, 2026</span>
                  </div>
                </div>
              </div>

              {/* ===================================================
                  MOBILE QUICK NAVIGATION
              ==================================================== */}
              <div className="mt-6 lg:hidden">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700">
                      On this page
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Jump to a specific section.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {sections.map((item, index) => (
                      <a
                        key={item}
                        href={`#section-${index + 1}`}
                        className="group flex items-center gap-3 rounded-xl border border-transparent bg-gray-50 px-3 py-3 text-sm font-medium text-gray-600 transition-all duration-200 hover:border-[#0F766E]/20 hover:bg-[#0F766E]/5 hover:text-[#0F766E]"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] font-bold text-gray-500 ring-1 ring-gray-200 transition-colors duration-200 group-hover:bg-[#0F766E] group-hover:text-white group-hover:ring-[#0F766E]">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <span className="min-w-0 flex-1 leading-5">
                          {item}
                        </span>

                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#0F766E]" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            {/* =====================================================
                DESKTOP SIDEBAR
            ====================================================== */}
            <aside className="order-2 hidden lg:block">
              <div className="sticky top-24 space-y-5">
                {/* On This Page */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700">
                      On this page
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Navigate through the terms.
                    </p>
                  </div>

                  <nav className="space-y-1" aria-label="Terms navigation">
                    {sections.map((item, index) => (
                      <a
                        key={item}
                        href={`#section-${index + 1}`}
                        className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm text-gray-600 transition-all duration-200 hover:border-[#0F766E]/20 hover:bg-[#0F766E]/5 hover:text-[#0F766E]"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[9px] font-bold text-gray-500 transition-all duration-200 group-hover:bg-[#0F766E] group-hover:text-white">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <span className="min-w-0 flex-1 leading-5">
                          {item}
                        </span>

                       
                      </a>
                    ))}
                  </nav>
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
   REUSABLE TERMS SECTION
========================================================= */

function TermsSection({ id, number, title, children }) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-b border-gray-100 pb-10 last:border-0 last:pb-0"
    >
      <div className="flex items-start gap-4 sm:gap-5">
        {/* Section Number */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#0F766E]/10 bg-[#0F766E]/10 text-[11px] font-bold text-[#0F766E]">
          {number}
        </div>

        {/* Section Content */}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold tracking-tight text-gray-700 sm:text-xl">
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