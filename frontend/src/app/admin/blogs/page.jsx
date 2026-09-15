"use client";

export default function AdminBlogs() {
  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Blogs</h1>
        <button className="px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 transition">
          Add New Blog
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <p className="text-gray-500">No blog posts found.</p>
      </div>
    </div>
  );
}