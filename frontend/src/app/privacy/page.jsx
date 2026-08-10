"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#0F766E]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Privacy Policy</span>
        </nav>
        <h1 className="text-3xl font-medium text-gray-800 tracking-wide uppercase mb-8">Privacy Policy</h1>

        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
          <div className="prose prose-sm max-w-none text-gray-600 space-y-6">
            <p className="text-sm text-gray-500">Last updated: August 10, 2026</p>

            <section>
              <h2 className="text-lg font-medium text-gray-800 mb-3">1. Introduction</h2>
              <p>At STORE, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-800 mb-3">2. Information We Collect</h2>
              <p>We may collect information about you in a variety of ways, including:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Personal Data: Name, email address, phone number, shipping address</li>
                <li>Payment Information: Credit card details (processed securely by our payment provider)</li>
                <li>Usage Data: Browser type, IP address, pages visited, time spent on site</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-800 mb-3">3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Process and fulfill your orders</li>
                <li>Send order confirmations and shipping updates</li>
                <li>Respond to customer service requests</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Improve our website and product offerings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-800 mb-3">4. Data Security</h2>
              <p>We implement appropriate technical and organizational security measures to protect your personal data. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-800 mb-3">5. Your Rights</h2>
              <p>You have the right to access, correct, or delete your personal data. To exercise these rights, please contact us at privacy@store.com.</p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-800 mb-3">6. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at <Link href="mailto:privacy@store.com" className="text-[#0F766E] hover:underline">privacy@store.com</Link>.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
