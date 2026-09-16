"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  Hotel,
  TrendingUp,
  CreditCard,
  Users,
  ExternalLink,
  ArrowRightLeft,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  ChevronRight,
  Briefcase,
  Layers,
} from "lucide-react";
import type { MultiPropertyData, PropertySummary } from "@/lib/multi-property";
import { formatCurrency } from "@/lib/utils";
import { reassignStaffAction } from "@/app/actions/multi-property";

export function MultiPropertyClient({ data }: { data: MultiPropertyData }) {
  const { organization, properties, portfolioSummary, staffMembers } = data;

  const [activeTab, setActiveTab] = useState<"overview" | "financials" | "staff">("overview");
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [targetPropertyId, setTargetPropertyId] = useState("");
  const [reassignSuccess, setReassignSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !targetPropertyId) return;

    const fd = new FormData();
    fd.append("staff_id", selectedStaff.id);
    fd.append("target_lodge_id", targetPropertyId);

    startTransition(async () => {
      const res = await reassignStaffAction(fd);
      if (res.success) {
        setReassignSuccess(true);
        setTimeout(() => {
          setSelectedStaff(null);
          setReassignSuccess(false);
        }, 1500);
      }
    });
  };

  const getSwitchUrl = (subdomain: string) => {
    if (typeof window === "undefined") return `/`;
    const host = window.location.host;
    const parts = host.split(".");
    if (parts.length >= 2) {
      // Localhost: subdomain.localhost:3000
      // Production: subdomain.domain.com
      const domainPart = parts.slice(1).join(".");
      return `${window.location.protocol}//${subdomain}.${domainPart}/admin`;
    }
    return `/`;
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Header */}
      <div className="bg-gradient-to-r from-[#0b1437] to-[#1a2b6d] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/20">
              Enterprise Portfolio
            </span>
            <span className="text-xs text-gray-300 font-medium">&bull; {organization.role} Access</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">{organization.name}</h1>
          <p className="text-xs text-gray-300">
            Unified management across {portfolioSummary.totalProperties} properties and {portfolioSummary.totalRooms} rooms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/10 text-right">
            <div className="text-[10px] text-gray-300 uppercase tracking-wider font-bold">Portfolio Occupancy</div>
            <div className="text-xl font-black text-emerald-400">{portfolioSummary.portfolioOccupancyRate}%</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/10 text-right">
            <div className="text-[10px] text-gray-300 uppercase tracking-wider font-bold">Portfolio Revenue</div>
            <div className="text-xl font-black text-white">{formatCurrency(portfolioSummary.totalBilled)}</div>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Properties</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{portfolioSummary.totalProperties}</div>
          <div className="text-[11px] text-gray-500 mt-1">Multi-tenant active locations</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Portfolio Occupancy</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{portfolioSummary.portfolioOccupancyRate}%</div>
          <div className="text-[11px] text-gray-500 mt-1">
            {portfolioSummary.totalOccupied} of {portfolioSummary.totalRooms} rooms occupied
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Received</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{formatCurrency(portfolioSummary.totalReceived)}</div>
          <div className="text-[11px] text-gray-500 mt-1">{portfolioSummary.collectionRate}% collection rate</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Staff Members</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{staffMembers.length}</div>
          <div className="text-[11px] text-gray-500 mt-1">Across all properties</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "overview"
              ? "bg-white text-gray-900 shadow-xs"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Properties Overview ({properties.length})
        </button>
        <button
          onClick={() => setActiveTab("financials")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "financials"
              ? "bg-white text-gray-900 shadow-xs"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Portfolio Financials
        </button>
        <button
          onClick={() => setActiveTab("staff")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "staff"
              ? "bg-white text-gray-900 shadow-xs"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Cross-Property Staff ({staffMembers.length})
        </button>
      </div>

      {/* Tab 1: Properties Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {properties.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border transition-all p-6 space-y-4 shadow-xs ${
                p.isCurrent
                  ? "border-blue-400 ring-2 ring-blue-50"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-gray-900">{p.name}</h3>
                    {p.isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                        Current Lodge
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{p.address || "Address not set"}</p>
                </div>

                <span className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-600">
                  {p.subdomain}.lodgeos.app
                </span>
              </div>

              {/* Occupancy progress bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-600">Occupancy</span>
                  <span className="font-bold text-gray-900">
                    {p.occupancyRate}% ({p.occupiedRooms} / {p.totalRooms} rooms)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, p.occupancyRate)}%` }}
                  />
                </div>
              </div>

              {/* Metric stats */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100 text-center">
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Total Billed</div>
                  <div className="text-xs font-bold text-gray-800 mt-0.5">{formatCurrency(p.totalBilled)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Received</div>
                  <div className="text-xs font-bold text-emerald-600 mt-0.5">{formatCurrency(p.totalReceived)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Staff Count</div>
                  <div className="text-xs font-bold text-purple-600 mt-0.5">{p.staffCount} Members</div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Isolated RLS Scope
                </span>

                {p.isCurrent ? (
                  <span className="px-3.5 py-1.5 bg-gray-50 text-gray-500 rounded-xl text-xs font-bold">
                    Active Session
                  </span>
                ) : (
                  <a
                    href={getSwitchUrl(p.subdomain)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0b1437] hover:bg-[#162268] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                  >
                    <span>Switch to {p.name.split(" ")[0]}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Portfolio Financials */}
      {activeTab === "financials" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-900">Property Financial Breakdown</h3>
            <p className="text-[11px] text-gray-400">Comparative billing and collections performance</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-5">Property Name</th>
                  <th className="py-3 px-5">Rooms</th>
                  <th className="py-3 px-5 text-right">Total Billed</th>
                  <th className="py-3 px-5 text-right">Received</th>
                  <th className="py-3 px-5 text-right">Balance Due</th>
                  <th className="py-3 px-5 text-center">Collection Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {properties.map((p) => {
                  const rate = p.totalBilled > 0 ? Math.round((p.totalReceived / p.totalBilled) * 100) : 0;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-gray-800">
                        {p.name} {p.isCurrent && <span className="text-blue-600 text-[10px]">(Current)</span>}
                      </td>
                      <td className="py-3.5 px-5 text-gray-600">{p.totalRooms} Rooms</td>
                      <td className="py-3.5 px-5 text-right font-bold text-gray-800">{formatCurrency(p.totalBilled)}</td>
                      <td className="py-3.5 px-5 text-right font-bold text-emerald-600">{formatCurrency(p.totalReceived)}</td>
                      <td className="py-3.5 px-5 text-right font-bold text-red-600">{formatCurrency(p.totalBalance)}</td>
                      <td className="py-3.5 px-5 text-center font-bold text-blue-600">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-bold text-gray-900">
                <tr>
                  <td className="py-3 px-5">Total Portfolio</td>
                  <td className="py-3 px-5">{portfolioSummary.totalRooms} Rooms</td>
                  <td className="py-3 px-5 text-right">{formatCurrency(portfolioSummary.totalBilled)}</td>
                  <td className="py-3 px-5 text-right text-emerald-700">{formatCurrency(portfolioSummary.totalReceived)}</td>
                  <td className="py-3 px-5 text-right text-red-700">{formatCurrency(portfolioSummary.totalBalance)}</td>
                  <td className="py-3 px-5 text-center text-blue-700">{portfolioSummary.collectionRate}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Cross-Property Staff */}
      {activeTab === "staff" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Cross-Property Staff Registry</h3>
              <p className="text-[11px] text-gray-400">View and reassign staff across your lodge portfolio</p>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {staffMembers.length} Staff Total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-5">Staff Name</th>
                  <th className="py-3 px-5">Role</th>
                  <th className="py-3 px-5">Assigned Property</th>
                  <th className="py-3 px-5">Member Since</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staffMembers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-gray-800">{s.fullName}</td>
                    <td className="py-3.5 px-5 capitalize">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.role === "admin"
                            ? "bg-red-50 text-red-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {s.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-medium text-gray-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Hotel className="w-3.5 h-3.5 text-gray-400" />
                        {s.lodgeName}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-gray-400">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => {
                          setSelectedStaff(s);
                          setTargetPropertyId(properties.find((p) => p.id !== s.lodgeId)?.id || "");
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <ArrowRightLeft className="w-3 h-3 text-gray-500" />
                        <span>Reassign</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Reassignment Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-gray-900">Reassign Staff Property</h3>
              </div>
              <button
                onClick={() => setSelectedStaff(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {reassignSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-sm text-gray-900">Reassignment Complete!</h4>
                <p className="text-xs text-gray-500">
                  {selectedStaff.fullName}&apos;s profile has been transferred.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReassign} className="space-y-4">
                <p className="text-xs text-gray-500">
                  Transfer <strong>{selectedStaff.fullName}</strong> ({selectedStaff.role}) from{" "}
                  <strong>{selectedStaff.lodgeName}</strong> to another property in your portfolio.
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Destination Property *
                  </label>
                  <select
                    value={targetPropertyId}
                    onChange={(e) => setTargetPropertyId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 text-gray-800 bg-white"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.id === selectedStaff.lodgeId}>
                        {p.name} {p.id === selectedStaff.lodgeId ? "(Current)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStaff(null)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !targetPropertyId || targetPropertyId === selectedStaff.lodgeId}
                    className="px-5 py-2 bg-[#0b1437] hover:bg-[#162268] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Confirm Transfer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

