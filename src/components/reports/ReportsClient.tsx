"use client";

import { useState } from "react";
import {
  TrendingUp,
  CreditCard,
  Users,
  Calendar,
  Download,
  Printer,
  BedDouble,
  DollarSign,
  Percent,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ReportsAggregateData } from "@/lib/reports";
import { formatCurrency } from "@/lib/utils";

const METHOD_COLORS = ["#0b1437", "#2563eb", "#10b981", "#f59e0b", "#8b5cf6"];
const STATUS_COLORS: Record<string, string> = {
  Paid: "#10b981",
  Partial: "#f59e0b",
  Pending: "#ef4444",
};

export function ReportsClient({ data }: { data: ReportsAggregateData }) {
  const [activeTab, setActiveTab] = useState<"overview" | "revenue" | "guests">("overview");

  // CSV Export Handler
  const handleExportCSV = () => {
    const rows: string[][] = [
      ["LODGEOS EXECUTIVE REPORT", data.lodgeName],
      ["Generated At", new Date(data.generatedAt).toLocaleString()],
      [""],
      ["KEY PERFORMANCE METRICS"],
      ["Metric", "Value"],
      ["Total Rooms", data.metrics.totalRooms.toString()],
      ["Occupied Today", data.metrics.occupiedToday.toString()],
      ["Occupancy Rate Today", `${data.metrics.occupancyRateToday}%`],
      ["Total Billed", data.metrics.totalBilled.toString()],
      ["Total Received", data.metrics.totalReceived.toString()],
      ["Total Outstanding", data.metrics.totalOutstanding.toString()],
      ["Collection Rate", `${data.metrics.collectionRate}%`],
      ["Total Reservations", data.metrics.totalReservations.toString()],
      ["Total Guests", data.metrics.totalGuests.toString()],
      ["Repeat Guest Rate", `${data.metrics.repeatGuestRate}%`],
      ["Avg Stay Length (Nights)", data.metrics.avgStayLengthDays.toString()],
      ["Cancellation Rate", `${data.metrics.cancellationRate}%`],
      [""],
      ["MONTHLY REVENUE SUMMARY"],
      ["Month", "Billed (INR)", "Received (INR)", "Outstanding (INR)"],
      ...data.monthlyRevenue.map((m) => [m.month, m.billed.toString(), m.received.toString(), m.outstanding.toString()]),
      [""],
      ["PAYMENT METHOD DISTRIBUTION"],
      ["Method", "Amount (INR)", "Share (%)", "Transactions Count"],
      ...data.paymentMethods.map((pm) => [pm.method, pm.amount.toString(), `${pm.percentage}%`, pm.count.toString()]),
      [""],
      ["TOP REPEAT GUESTS"],
      ["Guest Name", "Mobile", "Visits", "Total Spent (INR)", "Last Stay"],
      ...data.topRepeatGuests.map((g) => [g.name, g.mobile, g.visits.toString(), g.totalSpent.toString(), g.lastStay || "—"]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.map((val) => `"${val}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LodgeOS_Report_${data.lodgeName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 print:hidden">
        {/* Navigation Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeTab === "overview" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("revenue")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeTab === "revenue" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Revenue & Payments
          </button>
          <button
            onClick={() => setActiveTab("guests")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeTab === "guests" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Guest Analytics
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0b1437] text-white hover:bg-[#162268] rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Occupancy Rate */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Today Occupancy</p>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BedDouble className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{data.metrics.occupancyRateToday}%</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.metrics.occupiedToday} of {data.metrics.totalRooms} rooms booked
          </p>
        </div>

        {/* Total Billed Revenue */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Billed</p>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(data.metrics.totalBilled)}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-0.5">
            {data.metrics.collectionRate}% collected ({formatCurrency(data.metrics.totalReceived)})
          </p>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Outstanding Due</p>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{formatCurrency(data.metrics.totalOutstanding)}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Pending guest settlement
          </p>
        </div>

        {/* Repeat Guest Share */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Repeat Guests</p>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{data.metrics.repeatGuestRate}%</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.metrics.repeatGuestCount} returning guests out of {data.metrics.totalGuests}
          </p>
        </div>
      </div>

      {/* Overview Tab Content */}
      {(activeTab === "overview" || activeTab === "revenue") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Monthly Revenue Comparison (Bar Chart) */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Monthly Revenue Trend</h3>
                <p className="text-xs text-gray-400">Billed amounts vs. collected receipts</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                Last 6 Months
              </span>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val))}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Bar dataKey="billed" name="Billed" fill="#0b1437" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="received" name="Received" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Method Distribution (Pie Chart) */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Payment Methods</h3>
              <p className="text-xs text-gray-400 mb-3">Share by transaction volume</p>

              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.paymentMethods}
                      dataKey="amount"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {data.paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={METHOD_COLORS[index % METHOD_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              {data.paymentMethods.map((pm, idx) => (
                <div key={pm.method} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: METHOD_COLORS[idx % METHOD_COLORS.length] }}
                    />
                    <span className="text-gray-700 font-medium">{pm.method}</span>
                  </div>
                  <span className="font-bold text-gray-900">{pm.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 14-Day Occupancy Trend */}
      {(activeTab === "overview" || activeTab === "guests") && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">14-Day Occupancy Trend</h3>
              <p className="text-xs text-gray-400">Daily room occupancy rate percentage</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              Avg: {data.metrics.occupancyRateToday}%
            </span>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.occupancyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, "Occupancy Rate"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="occupancyRate" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#occGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Guest Loyalty Leaderboard */}
      {(activeTab === "overview" || activeTab === "guests") && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Top Repeat Guests</h3>
              <p className="text-xs text-gray-400">Loyalty rankings by visit frequency and expenditure</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Avg Stay: <strong className="text-gray-900">{data.metrics.avgStayLengthDays} nights</strong></span>
              <span>•</span>
              <span>Cancellation: <strong className="text-gray-900">{data.metrics.cancellationRate}%</strong></span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Rank</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Phone</th>
                  <th className="py-2.5 px-4 text-center">Visits</th>
                  <th className="py-2.5 px-4 text-right">Total Spent</th>
                  <th className="py-2.5 px-4 text-right">Last Stay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.topRepeatGuests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">No guest records found</td>
                  </tr>
                ) : (
                  data.topRepeatGuests.map((guest, idx) => (
                    <tr key={guest.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-400">#{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{guest.name}</td>
                      <td className="py-3 px-4 text-gray-500 font-mono">{guest.mobile}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700">
                          {guest.visits} visits
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                        {formatCurrency(guest.totalSpent)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-400">
                        {guest.lastStay ? new Date(guest.lastStay).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

