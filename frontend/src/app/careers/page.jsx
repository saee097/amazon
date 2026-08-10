"use client";

import Link from "next/link";

const openings = [
  { title: "Senior Frontend Engineer", location: "Karachi (Remote)", type: "Full-time", department: "Engineering" },
  { title: "Product Designer", location: "Karachi (Hybrid)", type: "Full-time", department: "Design" },
  { title: "Marketing Manager", location: "Karachi (On-site)", type: "Full-time", department: "Marketing" },
  { title: "Customer Success Lead", location: "Remote", type: "Full-time", department: "Support" },
  { title: "Data Analyst", location: "Karachi (Hybrid)", type: "Full-time", department: "Analytics" },
  { title: "Warehouse Associate", location: "Karachi (On-site)", type: "Part-time", department: "Operations" },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#0F766E]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Careers</span>
        </nav>
        <h1 className="text-3xl font-medium text-gray-800 tracking-wide uppercase mb-2">Careers</h1>
        <p className="text-sm text-gray-500 mb-8">Join our team and help shape the future of fashion retail.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Open Positions</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {openings.map((job) => (
                  <div key={job.title} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-50 transition">
                    <div>
                      <h3 className="text-sm font-medium text-gray-800">{job.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{job.department} • {job.location}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 border border-gray-200 rounded-full px-3 py-1">{job.type}</span>
                      <button className="text-xs font-medium text-[#0F766E] hover:underline">Apply Now</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Why Work With Us</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="text-[#0F766E] mt-0.5">•</span>Competitive salary and benefits package</li>
                <li className="flex items-start gap-2"><span className="text-[#0F766E] mt-0.5">•</span>Flexible work arrangements (remote / hybrid)</li>
                <li className="flex items-start gap-2"><span className="text-[#0F766E] mt-0.5">•</span>Continuous learning and growth opportunities</li>
                <li className="flex items-start gap-2"><span className="text-[#0F766E] mt-0.5">•</span>Inclusive and supportive team culture</li>
                <li className="flex items-start gap-2"><span className="text-[#0F766E] mt-0.5">•</span>Employee discounts on all products</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Our Culture</h3>
              <p className="text-sm text-gray-500 mb-4">We value creativity, collaboration, and kindness. Our team is diverse, passionate, and driven by a shared love for great fashion.</p>
              <Link href="/about" className="text-sm text-[#0F766E] hover:underline">Learn more about us →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
