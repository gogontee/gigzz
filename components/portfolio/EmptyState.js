// components/portfolio/EmptyState.js
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="text-center py-16 px-6 bg-gray-50 rounded-xl border">
      <h2 className="text-xl font-semibold mb-2 text-gray-700">No Portfolio Yet</h2>
      <p className="text-gray-500 mb-6">
        You haven’t added any portfolio projects. Start showcasing your work now!
      </p>
      <Link
        href="/dashboard/applicant/create-portfolio"
        className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-full hover:bg-orange-700 transition"
      >
        <PlusCircle size={18} /> Add Portfolio
      </Link>
    </div>
  );
}
