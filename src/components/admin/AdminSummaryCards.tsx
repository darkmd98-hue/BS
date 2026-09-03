"use client";

import { TrendingUp, DollarSign, Clock, AlertCircle, BedDouble, Plus, Users, ShieldCheck } from "lucide-react";

export function AdminSummaryCards() {
  return (
    <div className="space-y-8">
      {/* 4 KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Occupancy */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Occupancy Rate</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-stone-900 font-serif">78%</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-stone-500">14 / 18 rooms occupied</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
              +5% today
            </span>
          </div>
        </div>

        {/* KPI 2: Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Today&apos;s Revenue</span>
            <div className="p-2 rounded-xl bg-lodge-50 text-lodge-800">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-stone-900 font-serif">₹42,500</span>
          </div>
          <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
            <span>Advances: ₹18k</span>
            <span>Settled: ₹24.5k</span>
          </div>
        </div>

        {/* KPI 3: Check-ins */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Check-ins Today</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-stone-900 font-serif">6</span>
          </div>
          <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
            <span className="text-emerald-700 font-semibold">4 Checked In</span>
            <span className="text-amber-700 font-semibold">2 Expected</span>
          </div>
        </div>

        {/* KPI 4: Pending Balances */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Balance</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-stone-900 font-serif">₹18,200</span>
          </div>
          <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
            <span>Across 5 active rooms</span>
            <span className="text-amber-800 font-bold">Unsettled</span>
          </div>
        </div>
      </div>

      {/* Live Property Overview Table */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
              Live Property Occupancy Overview
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">Real-time status of configured rooms in your lodge.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium">Tenant Scope: Hill View Heritage Lodge</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-100 text-stone-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Room</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Floor</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Current Guest</th>
                <th className="pb-3 font-semibold text-right">Nightly Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 text-stone-700">
              <tr>
                <td className="py-3 font-bold text-stone-900">101</td>
                <td className="py-3">King Suite</td>
                <td className="py-3">Floor 1</td>
                <td className="py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Available
                  </span>
                </td>
                <td className="py-3 text-stone-400 italic">—</td>
                <td className="py-3 text-right font-semibold">₹2,500</td>
              </tr>
              <tr>
                <td className="py-3 font-bold text-stone-900">102</td>
                <td className="py-3">Deluxe Double</td>
                <td className="py-3">Floor 1</td>
                <td className="py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                    Booked
                  </span>
                </td>
                <td className="py-3 font-semibold text-stone-900">Anand Sharma</td>
                <td className="py-3 text-right font-semibold">₹2,200</td>
              </tr>
              <tr>
                <td className="py-3 font-bold text-stone-900">103</td>
                <td className="py-3">Standard Single</td>
                <td className="py-3">Floor 1</td>
                <td className="py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                    Booked
                  </span>
                </td>
                <td className="py-3 font-semibold text-stone-900">Priya Rao</td>
                <td className="py-3 text-right font-semibold">₹1,500</td>
              </tr>
              <tr>
                <td className="py-3 font-bold text-stone-900">201</td>
                <td className="py-3">Family Cottage</td>
                <td className="py-3">Floor 2</td>
                <td className="py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                    Booked
                  </span>
                </td>
                <td className="py-3 font-semibold text-stone-900">Vikram Mehta</td>
                <td className="py-3 text-right font-semibold">₹3,500</td>
              </tr>
              <tr>
                <td className="py-3 font-bold text-stone-900">203</td>
                <td className="py-3">Standard Single</td>
                <td className="py-3">Floor 2</td>
                <td className="py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Maintenance
                  </span>
                </td>
                <td className="py-3 text-stone-400 italic">—</td>
                <td className="py-3 text-right font-semibold">₹1,500</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
