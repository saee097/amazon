import Link from "next/link";
import { FiLock } from "react-icons/fi";

export default function Forbidden() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <FiLock size={24} />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Access denied</h2>
        <p className="mt-2 text-sm text-gray-500">
          You do not have permission to view this page. Please contact an administrator if you believe this is an error.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d5e58] transition"
        >
          Back to store
        </Link>
      </div>
    </div>
  );
}
