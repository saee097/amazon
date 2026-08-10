"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#0F766E]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Terms of Service</span>
        </nav>
        <h1 className="text-3xl font-medium text-gray-800 tracking-wide uppercase mb-8">Terms of Service</h1>

        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
          <div className="prose prose-sm max-w-none text-gray-600 space-y-6">
            <p className="text-sm text-gray-500">Last updated: August 10, 2026</p>

            <section>
              <h2 className="text-lg font-medium text-gray-800 mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using our website, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-800 mb-3">2. Use of Our Services</h2>
              <p>You agree to use our services only for lawful purposes and in a way that does not infringe the rights of others. You are responsible for maintaining the confidentiality of your account information.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-800 mb-3">3. Products and Pricing</h2>
              <p>We strive to display accurate product information and pricing. However, errors may occur. We reserve the right to correct any errors and to cancel orders placed at incorrect prices.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-800 mb-3">4. Orders and Payments</h2>
              <p>All orders are subject to acceptance and availability. Payment must be received before orders are processed. We accept major credit cards and select payment methods as indicated at checkout.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-800 mb-3">5. Intellectual Property</h2>
              <p>All content on this website, including text, graphics, logos, and images, is the property of STORE and is protected by copyright and other intellectual property laws.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-800 mb-3">6. Limitation of Liability</h2>
              <p>To the fullest extent permitted by law, STORE shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-800 mb-3">7. Changes to Terms</h2>
              <p>We may update these Terms of Service from time to time. Continued use of our services after any changes constitutes acceptance of the new terms.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-800 mb-3">8. Contact Information</h2>
              <p>For questions about these Terms, please contact us at <Link href="mailto:legal@store.com" className="text-[#0F766E] hover:underline">legal@store.com</Link>.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
