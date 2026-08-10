"use client";

import Link from "next/link";

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#0F766E]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Shipping &amp; Returns</span>
        </nav>
        <h1 className="text-3xl font-medium text-gray-800 tracking-wide uppercase mb-8">Shipping &amp; Returns</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
              <h2 className="text-xl font-medium text-gray-800 mb-4">Shipping Policy</h2>
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>We offer free standard shipping on all orders over $50. Orders below $50 are subject to a flat $5.99 shipping fee.</p>
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Delivery Times</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Standard Shipping (5-7 business days)</li>
                    <li>Express Shipping (2-3 business days)</li>
                    <li>Overnight Shipping (1 business day)</li>
                  </ul>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Order Processing</h3>
                  <p>Orders are processed within 1-2 business days. You will receive a confirmation email with tracking information once your order ships.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
              <h2 className="text-xl font-medium text-gray-800 mb-4">Returns &amp; Exchanges</h2>
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>We accept returns within 30 days of delivery. Items must be unworn, unwashed, and in their original packaging with tags attached.</p>
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">How to Return</h3>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600">
                    <li>Contact our support team to initiate a return</li>
                    <li>Pack the item securely in its original packaging</li>
                    <li>Include the return label inside the package</li>
                    <li>Drop off at any authorized carrier location</li>
                  </ol>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Refund Timeline</h3>
                  <p>Refunds are processed within 5-7 business days after we receive your return. The refund will be issued to the original payment method.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Need Help?</h3>
              <p className="text-sm text-gray-500 mb-4">If you have questions about shipping or returns, our team is here to help.</p>
              <Link href="/contact" className="block w-full text-center py-2.5 bg-[#0F766E] text-white text-sm font-medium rounded-lg hover:bg-[#0F766E]/90 transition">Contact Support</Link>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/track-order" className="block text-sm text-[#0F766E] hover:underline">Track Order</Link>
                <Link href="/faq" className="block text-sm text-[#0F766E] hover:underline">FAQ</Link>
                <Link href="/size-guide" className="block text-sm text-[#0F766E] hover:underline">Size Guide</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
