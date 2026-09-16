"use client";

import { useState, useTransition } from "react";
import {
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  FileText,
  Download,
  Printer,
  PlusCircle,
  Receipt,
  BedDouble,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  CheckCircle2,
  Trash2,
  Filter,
  Search,
  AlertCircle,
  X,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import type {
  BIAggregateData,
  ExpenseCategory,
  LodgeExpense,
} from "@/types/bi";
import { CATEGORY_METADATA } from "@/types/bi";
import { createExpenseAction, deleteExpenseAction } from "@/app/actions/bi";
import { formatCurrency } from "@/lib/utils";

interface AdvancedBIClientProps {
  data: BIAggregateData;
}

export function AdvancedBIClient({ data }: { data: BIAggregateData }) {
  const { metrics, plStatement, categoryShares, monthlyTrends, recentExpenses, lodgeName } = data;

  const [activeTab, setActiveTab] = useState<"performance" | "pnl" | "expenses">("performance");
  const [expenses, setExpenses] = useState<LodgeExpense[]>(recentExpenses);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseSearch, setExpenseSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreateExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    startTransition(async () => {
      const res = await createExpenseAction(fd);
      if (res.success) {
        const newCategory = (fd.get("category") as string) as ExpenseCategory;
        const newAmount = Number(fd.get("amount")) || 0;
        const newDesc = fd.get("description") as string;
        const newDate = (fd.get("expense_date") as string) || new Date().toISOString().split("T")[0];
        const newMethod = (fd.get("payment_method") as string) || "bank_transfer";

        const newExp: LodgeExpense = {
          id: res.expenseId || "local-" + Date.now(),
          lodge_id: data.lodgeId,
          category: newCategory,
          description: newDesc,
          amount: newAmount,
          expense_date: newDate,
          payment_method: newMethod,
          notes: (fd.get("notes") as string) || null,
        };

        setExpenses((prev) => [newExp, ...prev]);
        setShowExpenseModal(false);
        setFeedback("Expense successfully recorded in lodge ledger.");
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback(res.error || "Failed to record expense");
        setTimeout(() => setFeedback(null), 4000);
      }
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (!confirm("Are you sure you want to remove this expense record?")) return;

    const fd = new FormData();
    fd.append("expense_id", expenseId);

    startTransition(async () => {
      const res = await deleteExpenseAction(fd);
      if (res.success) {
        setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
        setFeedback("Expense record deleted.");
        setTimeout(() => setFeedback(null), 3000);
      }
    });
  };

  // Filtered expense records
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      e.category.toLowerCase().includes(expenseSearch.toLowerCase());
    const matchesCategory = selectedCategoryFilter === "all" || e.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Category", "Description", "Amount (INR)", "Expense Date", "Payment Method", "Notes"];
    const rows = expenses.map((e) => [
      e.category,
      `"${e.description.replace(/"/g, '""')}"`,
      e.amount,
      e.expense_date,
      e.payment_method,
      `"${(e.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${lodgeName.replace(/\s+/g, "_")}_Financial_Ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0b1437] to-[#1c2966] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/20">
              Enterprise Business Intelligence
            </span>
            <span className="text-xs text-gray-300 font-medium">&bull; Financial Yields & Margins</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Advanced BI &amp; Financial Analytics</h1>
          <p className="text-xs text-gray-300">
            Real-time Profit &amp; Loss (P&amp;L) statement, RevPAR yield tracking, ADR analytics, and departmental operating expense management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Expense</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-colors border border-white/15"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-gray-900 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors shadow-md"
          >
            <Printer className="w-3.5 h-3.5 text-gray-700" />
            <span>Print P&amp;L</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 print:grid-cols-3">
        {/* Gross Revenue */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-gray-900">{formatCurrency(metrics.totalRevenue)}</div>
          <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
            <span className="text-emerald-600 font-bold flex items-center">
              <ArrowUpRight className="w-3 h-3" /> 85%
            </span>
            <span>Room nights</span>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Expenses</span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-gray-900">{formatCurrency(metrics.totalExpenses)}</div>
          <div className="text-[10px] text-gray-500 font-medium">
            {metrics.totalRevenue > 0 ? Math.round((metrics.totalExpenses / metrics.totalRevenue) * 100) : 0}% of revenue
          </div>
        </div>

        {/* Net Operating Income (NOI) */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Net Income (NOI)</span>
            <TrendingUp className={`w-4 h-4 ${metrics.netOperatingIncome >= 0 ? "text-emerald-600" : "text-rose-600"}`} />
          </div>
          <div className={`text-xl font-black ${metrics.netOperatingIncome >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {formatCurrency(metrics.netOperatingIncome)}
          </div>
          <div className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md inline-block">
            {metrics.operatingMarginPct}% Net Margin
          </div>
        </div>

        {/* RevPAR */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">RevPAR</span>
            <BedDouble className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-gray-900">{formatCurrency(metrics.revpar)}</div>
          <div className="text-[10px] text-gray-500 font-medium">Per avail. room/night</div>
        </div>

        {/* ADR */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">ADR (Avg Daily)</span>
            <Percent className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-gray-900">{formatCurrency(metrics.adr)}</div>
          <div className="text-[10px] text-gray-500 font-medium">Per sold room/night</div>
        </div>

        {/* Occupancy */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Occupancy Rate</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-gray-900">{metrics.occupancyRatePct}%</div>
          <div className="text-[10px] text-gray-500 font-medium">
            {metrics.occupiedRooms} / {metrics.totalRooms} rooms active
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("performance")}
            className={`pb-3 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "performance"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Yield &amp; Performance Trends</span>
          </button>
          <button
            onClick={() => setActiveTab("pnl")}
            className={`pb-3 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "pnl"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>P&amp;L Statement</span>
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`pb-3 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "expenses"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Operating Expense Ledger</span>
          </button>
        </div>
      </div>

      {/* TAB 1: FINANCIAL PERFORMANCE & YIELDS */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue vs Expenses Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Revenue vs. Operating Expenses</h3>
                  <p className="text-[11px] text-gray-500">6-month comparative trend and net margin</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#0b1437]"></span>
                    <span className="text-gray-600 text-[11px]">Revenue</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b]"></span>
                    <span className="text-gray-600 text-[11px]">Expenses</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]"></span>
                    <span className="text-gray-600 text-[11px]">NOI</span>
                  </div>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val: any) => formatCurrency(Number(val))}
                      contentStyle={{ backgroundColor: "#0b1437", color: "#fff", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="revenue" fill="#0b1437" radius={[4, 4, 0, 0]} name="Revenue" />
                    <Bar dataKey="expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Expenses" />
                    <Bar dataKey="noi" fill="#10b981" radius={[4, 4, 0, 0]} name="Net Income" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RevPAR & ADR Yield Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">RevPAR &amp; ADR Yield Metrics</h3>
                  <p className="text-[11px] text-gray-500">Average Daily Rate vs. Revenue per Available Room</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span className="text-gray-600 text-[11px]">ADR</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    <span className="text-gray-600 text-[11px]">RevPAR</span>
                  </div>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip
                      formatter={(val: any) => formatCurrency(Number(val))}
                      contentStyle={{ backgroundColor: "#0b1437", color: "#fff", borderRadius: 8, fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="adr" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} name="ADR" />
                    <Line type="monotone" dataKey="revpar" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} name="RevPAR" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick Hospitality Financial Summary */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50/40 rounded-2xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Executive BI Analysis</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-700">
              <div className="p-3 bg-white rounded-xl border border-gray-200/80 space-y-1">
                <span className="font-bold text-gray-900 block">Pricing Power &amp; RevPAR</span>
                <p className="text-gray-600">
                  Current RevPAR of {formatCurrency(metrics.revpar)} reflects strong room yield at {metrics.occupancyRatePct}% occupancy.
                  Increasing weekend pricing by 8% could optimize ADR above {formatCurrency(metrics.adr + 150)}.
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200/80 space-y-1">
                <span className="font-bold text-gray-900 block">Cost Structure &amp; Operating Margin</span>
                <p className="text-gray-600">
                  Operating margin stands at <span className="font-bold text-emerald-700">{metrics.operatingMarginPct}%</span>.
                  Departmental operating costs represent {metrics.totalRevenue > 0 ? Math.round((metrics.totalExpenses / metrics.totalRevenue) * 100) : 0}% of gross revenue,
                  led by staff payroll and energy utilities.
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200/80 space-y-1">
                <span className="font-bold text-gray-900 block">Profitability Trajectory</span>
                <p className="text-gray-600">
                  Estimated annualized Net Operating Income (NOI) is {formatCurrency(metrics.netOperatingIncome * 12)}.
                  Maintaining occupancy above 70% preserves positive cash flow after all departmental costs.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FORMAL P&L STATEMENT */}
      {activeTab === "pnl" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 gap-2">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-blue-600">Statement of Operations</div>
              <h2 className="text-xl font-black text-gray-900">{lodgeName} — Profit &amp; Loss (P&amp;L) Statement</h2>
              <p className="text-xs text-gray-500">For the period: Current Financial Cycle (in INR)</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-gray-400 font-mono">Generated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Statement Table */}
          <div className="space-y-6">
            {/* 1. OPERATING REVENUE */}
            <div className="space-y-2">
              <div className="bg-gray-100 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider text-gray-700 flex justify-between">
                <span>1. Operating Revenue</span>
                <span>% of Revenue</span>
              </div>
              <div className="divide-y divide-gray-100 text-xs text-gray-800 font-medium">
                <div className="py-2 px-3.5 flex justify-between">
                  <span className="text-gray-700">Room Accommodation Revenue</span>
                  <div className="flex items-center gap-6">
                    <span className="text-gray-500 w-12 text-right">85.0%</span>
                    <span className="font-mono w-28 text-right font-bold">{formatCurrency(plStatement.operatingRevenue.roomRevenue)}</span>
                  </div>
                </div>
                <div className="py-2 px-3.5 flex justify-between">
                  <span className="text-gray-700">Extra Person, Services &amp; Amenities</span>
                  <div className="flex items-center gap-6">
                    <span className="text-gray-500 w-12 text-right">15.0%</span>
                    <span className="font-mono w-28 text-right font-bold">{formatCurrency(plStatement.operatingRevenue.extraCharges)}</span>
                  </div>
                </div>
                <div className="py-2.5 px-3.5 flex justify-between font-bold bg-blue-50/50 text-blue-950 rounded-lg">
                  <span>Total Gross Operating Revenue</span>
                  <div className="flex items-center gap-6">
                    <span className="w-12 text-right">100.0%</span>
                    <span className="font-mono w-28 text-right font-black text-sm">{formatCurrency(plStatement.operatingRevenue.totalRevenue)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. OPERATING EXPENSES */}
            <div className="space-y-2">
              <div className="bg-gray-100 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider text-gray-700 flex justify-between">
                <span>2. Departmental Operating Expenses</span>
                <span>% of Revenue</span>
              </div>
              <div className="divide-y divide-gray-100 text-xs text-gray-800 font-medium">
                {plStatement.operatingExpenses.categories.map((cat) => (
                  <div key={cat.category} className="py-2 px-3.5 flex justify-between hover:bg-gray-50/60 transition-colors">
                    <span className="text-gray-700 flex items-center gap-2">
                      <span>{CATEGORY_METADATA[cat.category]?.icon || "•"}</span>
                      <span>{cat.label}</span>
                    </span>
                    <div className="flex items-center gap-6">
                      <span className="text-gray-500 w-12 text-right">{cat.pctOfRevenue}%</span>
                      <span className="font-mono w-28 text-right text-red-600">({formatCurrency(cat.amount)})</span>
                    </div>
                  </div>
                ))}
                <div className="py-2.5 px-3.5 flex justify-between font-bold bg-amber-50/60 text-amber-950 rounded-lg">
                  <span>Total Operating Expenses</span>
                  <div className="flex items-center gap-6">
                    <span className="w-12 text-right">
                      {plStatement.operatingRevenue.totalRevenue > 0
                        ? Math.round((plStatement.operatingExpenses.totalExpenses / plStatement.operatingRevenue.totalRevenue) * 100)
                        : 0}%
                    </span>
                    <span className="font-mono w-28 text-right font-black text-sm text-red-700">
                      ({formatCurrency(plStatement.operatingExpenses.totalExpenses)})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. NET OPERATING INCOME (NOI) */}
            <div className="bg-gradient-to-r from-gray-900 to-[#0b1437] text-white p-4 rounded-xl flex items-center justify-between shadow-md">
              <div className="space-y-0.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Bottom Line Result</div>
                <div className="text-base font-black">Net Operating Income (NOI)</div>
                <div className="text-[11px] text-gray-300">Revenue minus all departmental operating expenses</div>
              </div>
              <div className="text-right space-y-0.5">
                <div className="text-2xl font-black font-mono text-emerald-400">
                  {formatCurrency(plStatement.netOperatingIncome)}
                </div>
                <div className="text-xs font-bold text-gray-300">
                  Margin: <span className="text-emerald-300">{plStatement.netMarginPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OPERATING EXPENSES & LEDGER */}
      {activeTab === "expenses" && (
        <div className="space-y-6">
          {/* Top Category Distribution Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Donut Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Expense Allocation</h3>
                <p className="text-[11px] text-gray-500">Distribution by operational department</p>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryShares}
                      dataKey="amount"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {categoryShares.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => formatCurrency(Number(val))}
                      contentStyle={{ backgroundColor: "#0b1437", color: "#fff", borderRadius: 8, fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category breakdown table */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Departmental Breakdown</h3>
                  <p className="text-[11px] text-gray-500">Operating costs ranked by share</p>
                </div>
                <span className="text-xs font-black text-gray-700 font-mono">Total: {formatCurrency(metrics.totalExpenses)}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {categoryShares.map((cat) => (
                  <div key={cat.category} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                      <div>
                        <div className="text-xs font-bold text-gray-900">{cat.label}</div>
                        <div className="text-[10px] text-gray-500">{cat.percentage}% of expenses</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-gray-900">{formatCurrency(cat.amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filterable Expenses Ledger */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Expense Ledger</h3>
                <p className="text-[11px] text-gray-500">Itemized operational transactions and payments</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
                  />
                </div>

                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="py-1.5 px-3 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(CATEGORY_METADATA).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Log Expense</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Payment Method</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No expenses match your search or filter.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                          {exp.expense_date}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                            style={{
                              backgroundColor: `${CATEGORY_METADATA[exp.category]?.color || "#94a3b8"}15`,
                              color: CATEGORY_METADATA[exp.category]?.color || "#475569",
                            }}
                          >
                            <span>{CATEGORY_METADATA[exp.category]?.icon}</span>
                            <span>{CATEGORY_METADATA[exp.category]?.label || exp.category}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-900 font-medium">
                          <div>{exp.description}</div>
                          {exp.notes && <div className="text-[10px] text-gray-400">{exp.notes}</div>}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 uppercase text-[10px] font-mono">
                          {exp.payment_method.replace("_", " ")}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                          {formatCurrency(exp.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            disabled={isPending}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-md"
                            title="Delete expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LOG EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs print:hidden">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-[#0b1437] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm">Record Operational Expense</h3>
              </div>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                <select
                  name="category"
                  required
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {Object.entries(CATEGORY_METADATA).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.icon} {val.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description *</label>
                <input
                  type="text"
                  name="description"
                  required
                  placeholder="e.g. Electric power bill for March"
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="1"
                    placeholder="e.g. 8500"
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    name="expense_date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method</label>
                <select
                  name="payment_method"
                  defaultValue="bank_transfer"
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="bank_transfer">Bank Transfer (NEFT / IMPS)</option>
                  <option value="upi">UPI / QR Code</option>
                  <option value="card">Company Credit / Debit Card</option>
                  <option value="cash">Petty Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Notes / Vendor details</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Optional memo or invoice reference..."
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Record Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
