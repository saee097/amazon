"use client";

import Link from "next/link";

const sizes = [
  { label: "XS", chest: "32-34", waist: "26-28", hip: "34-36" },
  { label: "S", chest: "35-37", waist: "29-31", hip: "37-39" },
  { label: "M", chest: "38-40", waist: "32-34", hip: "40-42" },
  { label: "L", chest: "41-43", waist: "35-37", hip: "43-45" },
  { label: "XL", chest: "44-46", waist: "38-40", hip: "46-48" },
  { label: "XXL", chest: "47-49", waist: "41-43", hip: "49-51" },
];

export default function SizeGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#0F766E]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Size Guide</span>
        </nav>
        <h1 className="text-3xl font-medium text-gray-800 tracking-wide uppercase mb-2">Size Guide</h1>
        <p className="text-sm text-gray-500 mb-8">Find your perfect fit with our comprehensive size chart.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Women&apos;s Size Chart (Inches)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Chest</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Waist</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sizes.map((size) => (
                      <tr key={size.label} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-800">{size.label}</td>
                        <td className="px-6 py-3 text-gray-600">{size.chest}</td>
                        <td className="px-6 py-3 text-gray-600">{size.waist}</td>
                        <td className="px-6 py-3 text-gray-600">{size.hip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 mt-8">
              <h2 className="text-xl font-medium text-gray-800 mb-4">How to Measure</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <span className="text-sm font-semibold text-[#0F766E]">1</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Chest</h3>
                  <p className="text-xs text-gray-500">Measure around the fullest part of your chest, keeping the tape horizontal.</p>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <span className="text-sm font-semibold text-[#0F766E]">2</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Waist</h3>
                  <p className="text-xs text-gray-500">Measure around your natural waistline, keeping the tape comfortably loose.</p>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <span className="text-sm font-semibold text-[#0F766E]">3</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Hip</h3>
                  <p className="text-xs text-gray-500">Measure around the fullest part of your hips, about 8 inches below your waist.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Fit Tips</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="text-[#0F766E] mt-0.5">•</span>If you are between sizes, size up for a relaxed fit or size down for a slim fit.</li>
                <li className="flex items-start gap-2"><span className="text-[#0F766E] mt-0.5">•</span>Check the product description for specific fit notes and model sizing.</li>
                <li className="flex items-start gap-2"><span className="text-[#0F766E] mt-0.5">•</span>All measurements are in inches and may vary slightly by style.</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Need Help?</h3>
              <p className="text-sm text-gray-500 mb-4">Still unsure about your size? Reach out to our style consultants.</p>
              <Link href="/contact" className="block w-full text-center py-2.5 bg-[#0F766E] text-white text-sm font-medium rounded-lg hover:bg-[#0F766E]/90 transition">Contact Us</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
