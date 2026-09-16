"use client";

import { useState, useTransition } from "react";
import {
  Settings,
  Building2,
  Clock,
  Mail,
  Globe,
  Shield,
  Save,
  Loader2,
  CheckCircle2,
  Phone,
  CreditCard,
  PawPrint,
  FileText,
  Users,
} from "lucide-react";
import type { LodgeSettings } from "@/lib/settings";
import { updateLodgeSettingsAction } from "@/app/actions/settings";

type TabId = "general" | "business" | "roles";

export function SettingsClient({
  settings,
  staffCount,
  role,
}: {
  settings: LodgeSettings;
  staffCount: number;
  role: string;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [isPending, startTransition] = useTransition();
  const [saveResult, setSaveResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveResult(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateLodgeSettingsAction(formData);
      if (result.success) {
        setSaveResult({ type: "success", message: "Settings saved successfully." });
      } else {
        setSaveResult({ type: "error", message: result.error || "Failed to save." });
      }
    });
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: "General", icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: "business", label: "Business Rules", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "roles", label: "Roles & Security", icon: <Shield className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-bold transition-colors ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Save Result */}
      {saveResult && (
        <div
          className={`p-3 rounded-lg text-xs font-medium border ${
            saveResult.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {saveResult.type === "success" && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />}
          {saveResult.message}
        </div>
      )}

      {/* General Tab */}
      {activeTab === "general" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Lodge Identity */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Lodge Identity</h3>
                <p className="text-[11px] text-gray-400">Property name, address, and branding</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="settings_name" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Lodge Name *
                </label>
                <input
                  type="text"
                  id="settings_name"
                  name="name"
                  required
                  defaultValue={settings.name}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                />
              </div>

              <div>
                <label htmlFor="settings_subdomain" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Subdomain
                </label>
                <div className="flex items-center gap-0">
                  <input
                    type="text"
                    id="settings_subdomain"
                    value={settings.subdomain || "—"}
                    readOnly
                    disabled
                    className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-l-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <span className="px-3 py-2.5 bg-gray-100 border border-l-0 border-gray-200 rounded-r-lg text-xs text-gray-400 font-mono">
                    .lodgeos.app
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Subdomain is set during registration and cannot be changed.</p>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="settings_address" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Full Address
                </label>
                <textarea
                  id="settings_address"
                  name="address"
                  rows={2}
                  defaultValue={settings.address || ""}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800 resize-none"
                />
              </div>

              <div>
                <label htmlFor="settings_website" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Website URL
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    id="settings_website"
                    name="website"
                    defaultValue={settings.website || ""}
                    placeholder="https://yourproperty.com"
                    className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="settings_gst" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  GST / Tax Number
                </label>
                <input
                  type="text"
                  id="settings_gst"
                  name="gst_number"
                  defaultValue={settings.gst_number || ""}
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Contact Information</h3>
                <p className="text-[11px] text-gray-400">Displayed on invoices and guest communication</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="settings_phone" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    id="settings_phone"
                    name="contact_phone"
                    defaultValue={settings.contact_phone || ""}
                    placeholder="+91 9876543210"
                    className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="settings_email" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Contact Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    id="settings_email"
                    name="contact_email"
                    defaultValue={settings.contact_email || ""}
                    placeholder="info@yourlodge.com"
                    className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0b1437] text-white rounded-lg text-sm font-semibold hover:bg-[#162268] transition-colors shadow-sm disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save General Settings
            </button>
          </div>
        </form>
      )}

      {/* Business Rules Tab */}
      {activeTab === "business" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Operating Hours */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Check-in / Check-out Times</h3>
                <p className="text-[11px] text-gray-400">Default operating hours for the property</p>
              </div>
            </div>

            {/* Hidden fields to preserve General tab values */}
            <input type="hidden" name="name" value={settings.name} />
            <input type="hidden" name="address" value={settings.address || ""} />
            <input type="hidden" name="contact_phone" value={settings.contact_phone || ""} />
            <input type="hidden" name="contact_email" value={settings.contact_email || ""} />
            <input type="hidden" name="website" value={settings.website || ""} />
            <input type="hidden" name="gst_number" value={settings.gst_number || ""} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="settings_checkin" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Standard Check-in Time
                </label>
                <input
                  type="time"
                  id="settings_checkin"
                  name="check_in_time"
                  defaultValue={settings.check_in_time || "14:00"}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                />
              </div>

              <div>
                <label htmlFor="settings_checkout" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Standard Check-out Time
                </label>
                <input
                  type="time"
                  id="settings_checkout"
                  name="check_out_time"
                  defaultValue={settings.check_out_time || "11:00"}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Policies */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Pricing & Policies</h3>
                <p className="text-[11px] text-gray-400">Default charges and cancellation policy</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label htmlFor="settings_currency" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Currency
                </label>
                <select
                  id="settings_currency"
                  name="currency"
                  defaultValue={settings.currency || "INR"}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                >
                  <option value="INR">₹ INR (Indian Rupee)</option>
                  <option value="USD">$ USD (US Dollar)</option>
                  <option value="EUR">€ EUR (Euro)</option>
                  <option value="GBP">£ GBP (British Pound)</option>
                </select>
              </div>

              <div>
                <label htmlFor="settings_extra_charge" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Extra Person Charge (Default)
                </label>
                <input
                  type="number"
                  id="settings_extra_charge"
                  name="extra_person_charge_default"
                  min="0"
                  step="50"
                  defaultValue={settings.extra_person_charge_default ?? 500}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                />
              </div>

              <div>
                <label htmlFor="settings_cancellation" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Cancellation Policy
                </label>
                <select
                  id="settings_cancellation"
                  name="cancellation_policy"
                  defaultValue={settings.cancellation_policy || "flexible"}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                >
                  <option value="flexible">Flexible (Free cancellation up to 24h)</option>
                  <option value="moderate">Moderate (Free cancellation up to 5 days)</option>
                  <option value="strict">Strict (Non-refundable)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="settings_timezone" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Timezone
                </label>
                <select
                  id="settings_timezone"
                  name="timezone"
                  defaultValue={settings.timezone || "Asia/Kolkata"}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
                  <option value="America/New_York">America/New_York (EST, UTC-5)</option>
                  <option value="Europe/London">Europe/London (GMT, UTC+0)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST, UTC+4)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT, UTC+8)</option>
                </select>
              </div>

              <div>
                <label htmlFor="settings_pet" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Pet Policy
                </label>
                <select
                  id="settings_pet"
                  name="pet_friendly"
                  defaultValue={settings.pet_friendly ? "true" : "false"}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                >
                  <option value="false">No Pets Allowed</option>
                  <option value="true">Pet Friendly 🐾</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0b1437] text-white rounded-lg text-sm font-semibold hover:bg-[#162268] transition-colors shadow-sm disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Business Rules
            </button>
          </div>
        </form>
      )}

      {/* Roles & Security Tab */}
      {activeTab === "roles" && (
        <div className="space-y-6">
          {/* Current Access Model */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Access Control Model</h3>
                <p className="text-[11px] text-gray-400">
                  Security policy and data isolation summary
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-gray-600" />
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Staff Members</h4>
                </div>
                <p className="text-2xl font-bold text-gray-900">{staffCount}</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Active accounts in your lodge. Add more from{" "}
                  <a href="/admin/staff" className="text-blue-600 hover:underline">
                    Users & Roles
                  </a>.
                </p>
              </div>

              <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Data Isolation</h4>
                </div>
                <p className="text-sm font-bold text-emerald-700">Database-Level RLS</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Every query is filtered at the Postgres level. No lodge can access another lodge&apos;s data, even via direct API.
                </p>
              </div>

              <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Your Role</h4>
                </div>
                <p className="text-sm font-bold text-gray-900 capitalize">{role}</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {role === "admin"
                    ? "Full access to all admin features, rooms, staff, and settings."
                    : "Reception access: bookings, billing, and customer management."}
                </p>
              </div>
            </div>
          </div>

          {/* Role Matrix */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Permission Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-3 font-bold text-gray-400 uppercase tracking-wider">Module</th>
                    <th className="pb-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700">Admin</span>
                    </th>
                    <th className="pb-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">Reception</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { module: "Dashboard & Analytics", admin: true, reception: true },
                    { module: "Room Booking & Inventory", admin: true, reception: true },
                    { module: "Billing & Invoicing", admin: true, reception: true },
                    { module: "Customer Management", admin: true, reception: true },
                    { module: "Housekeeping", admin: true, reception: false },
                    { module: "Maintenance Tracking", admin: true, reception: false },
                    { module: "Reports & Analytics", admin: true, reception: false },
                    { module: "Room Configuration & Pricing", admin: true, reception: false },
                    { module: "User & Staff Management", admin: true, reception: false },
                    { module: "Lodge Settings", admin: true, reception: false },
                  ].map((p) => (
                    <tr key={p.module} className="hover:bg-gray-50/40">
                      <td className="py-3 text-gray-700 font-medium">{p.module}</td>
                      <td className="py-3 text-center text-emerald-600 font-bold">{p.admin ? "✓" : "—"}</td>
                      <td className="py-3 text-center font-bold">{p.reception ? <span className="text-emerald-600">✓</span> : <span className="text-gray-300">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-500">
              All permissions are enforced at the database level via Postgres Row Level Security (RLS). They cannot be bypassed from client code.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

