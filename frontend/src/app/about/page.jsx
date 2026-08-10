"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#0F766E]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">About Us</span>
        </nav>
        <h1 className="text-3xl font-medium text-gray-800 tracking-wide uppercase mb-8">About Us</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
              <h2 className="text-xl font-medium text-gray-800 mb-4">Our Story</h2>
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>Founded in 2020, STORE began with a simple mission: to make premium fashion accessible to everyone. What started as a small online boutique has grown into a trusted destination for fashion-forward individuals across the country.</p>
                <p>We believe that style should not come at a premium. Our team works tirelessly to source the finest products, negotiate the best prices, and deliver an exceptional shopping experience from browse to unbox.</p>
                <p>Today, we are proud to serve thousands of happy customers and continue expanding our collection with the latest trends and timeless classics.</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
              <h2 className="text-xl font-medium text-gray-800 mb-6">Our Values</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#0F766E]/10 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-[#0F766E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Quality First</h3>
                  <p className="text-xs text-gray-500">Every product is carefully vetted to meet our high standards.</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#0F766E]/10 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-[#0F766E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 012-2h2" /></svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Fair Pricing</h3>
                  <p className="text-xs text-gray-500">We offer competitive prices without compromising on quality.</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#0F766E]/10 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-[#0F766E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Customer Love</h3>
                  <p className="text-xs text-gray-500">Your satisfaction is at the heart of everything we do.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Happy Customers</span>
                  <span className="text-sm font-semibold text-gray-800">50,000+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Products Sold</span>
                  <span className="text-sm font-semibold text-gray-800">120,000+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Years in Business</span>
                  <span className="text-sm font-semibold text-gray-800">5+</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Join Our Team</h3>
              <p className="text-sm text-gray-500 mb-4">We are always looking for passionate people to join our growing team.</p>
              <Link href="/careers" className="block w-full text-center py-2.5 bg-[#0F766E] text-white text-sm font-medium rounded-lg hover:bg-[#0F766E]/90 transition">View Openings</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
