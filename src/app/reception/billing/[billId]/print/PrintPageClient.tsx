"use client";

import Link from "next/link";

export function PrintPageClient() {
  return (
    <div className="no-print fixed top-4 right-4 z-50 flex gap-3 print:hidden">
      <button
        onClick={() => window.print()}
        className="px-5 py-2 bg-[#0b1437] text-white text-sm font-semibold rounded-lg hover:bg-[#162268] shadow-md transition-colors cursor-pointer"
      >
        <span aria-hidden="true">🖨</span> Print Invoice
      </button>
      <Link
        href="/reception/billing"
        className="px-5 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
      >
        ← Back
      </Link>
    </div>
  );
}
