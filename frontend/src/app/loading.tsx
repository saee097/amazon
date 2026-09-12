export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin" />
        <p className="mt-4 text-sm text-gray-500">Loading…</p>
      </div>
    </div>
  );
}
