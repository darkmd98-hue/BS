"use client";

import { BarChart3, TrendingUp, DollarSign, Calendar, FileText, Download } from "lucide-react";

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 font-serif">Revenue &amp; Occupancy Reports</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Lodge-scoped financial summaries, settled payments, and monthly occupancy trends.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Summary (CSV)</span>
        </button>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
            <span>This Month Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-stone-900 font-serif">₹4,85,000</p>
          <p className="text-xs text-emerald-700 font-semibold">+12% vs last month</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
            <span>Average Occupancy</span>
            <TrendingUp className="w-4 h-4 text-lodge-700" />
          </div>
          <p className="text-3xl font-extrabold text-stone-900 font-serif">74.2%</p>
          <p className="text-xs text-stone-500">Across 18 configured rooms</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
            <span>Total Stays Completed</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-stone-900 font-serif">142</p>
          <p className="text-xs text-stone-500">Average stay length: 2.3 nights</p>
        </div>
      </div>

      {/* Revenue by Room Category */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-3">
          Revenue Breakdown by Room Category
        </h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>King Suites (4 rooms)</span>
              <span>₹1,80,000 (37%)</span>
            </div>
            <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-lodge-700 h-full rounded-full" style={{ width: "37%" }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Deluxe Doubles (6 rooms)</span>
              <span>₹1,65,000 (34%)</span>
            </div>
            <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: "34%" }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Executive Suites (2 rooms)</span>
              <span>₹90,000 (19%)</span>
            </div>
            <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-amber-600 h-full rounded-full" style={{ width: "19%" }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Standard Singles (6 rooms)</span>
              <span>₹50,000 (10%)</span>
            </div>
            <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: "10%" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
