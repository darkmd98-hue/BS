import React from "react";
import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Avatar } from "@/components/shared/Avatar";
import { revalidatePath } from "next/cache";

export default async function AdminStaffPage() {
  const tenant = await getTenantContext();
  const supabase = await createClient();

  // Fetch all staff profiles for this lodge
  const { data: profiles } = await (supabase as any)
    .from("profiles")
    .select("*")
    .eq("lodge_id", tenant.lodgeId)
    .order("created_at", { ascending: true });

  const staffList: any[] = profiles || [];

  // Server action to invite / add staff member
  async function inviteStaffAction(formData: FormData) {
    "use server";
    const tenantCtx = await getTenantContext();
    const adminSupabase = createAdminClient();

    const fullName = (formData.get("fullName") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = (formData.get("password") as string)?.trim() || "Password123!";
    const role = (formData.get("role") as string) || "reception";

    if (!fullName || !email) {
      throw new Error("Full name and email are required");
    }

    // 1. Create auth user with service client
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (authError || !authUser.user) {
      throw new Error(`Failed to create staff user: ${authError?.message}`);
    }

    // 2. Insert into profiles with the current lodge_id
    const { error: profileError } = await (adminSupabase as any).from("profiles").insert({
      id: authUser.user.id,
      lodge_id: tenantCtx.lodgeId,
      full_name: fullName,
      role: role,
    });

    if (profileError) {
      await adminSupabase.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Failed to create staff profile: ${profileError.message}`);
    }

    revalidatePath("/admin/staff");
  }

  const ROLES = [
    {
      name: "Admin",
      color: "bg-red-50 text-red-700",
      description: "Full access to rooms, staff, billing, settings & reports",
    },
    {
      name: "Reception",
      color: "bg-blue-50 text-blue-700",
      description: "Front desk access to room booking, check-ins, customers & billing",
    },
  ];

  const PERMISSIONS = [
    { module: "Dashboard & Analytics", admin: true, reception: true },
    { module: "Room Booking & Realtime Inventory", admin: true, reception: true },
    { module: "Customer Stays & Check-in / Check-out", admin: true, reception: true },
    { module: "Billing & Invoicing", admin: true, reception: true },
    { module: "Room Configuration & Pricing", admin: true, reception: false },
    { module: "User & Staff Management", admin: true, reception: false },
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-[26px] font-bold text-gray-900">Users & Roles</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage staff access and permissions for <span className="font-semibold text-gray-800">{tenant.lodgeName}</span>
          </p>
        </div>
      </div>

      {/* Staff Members List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
          <h2 className="font-display font-semibold text-gray-900 text-sm">
            Active Staff Members ({staffList.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-gray-100 bg-gray-50/40 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Created Date</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staffList.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.full_name} size="md" />
                      <div>
                        <div className="font-semibold text-gray-900">{u.full_name}</div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                        u.role === "admin"
                          ? "bg-red-50 text-red-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Invite New Staff Form */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-gray-100 p-6 shadow-xs">
          <h2 className="font-display font-semibold text-gray-900 text-base mb-1">
            Add Staff Member
          </h2>
          <p className="text-xs text-gray-500 mb-5">
            Provision login credentials for receptionist or administrative team members.
          </p>
          <form action={inviteStaffAction} className="space-y-4">
            <div>
              <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                required
                placeholder="e.g. Fatima Receptionist"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="e.g. staff@yourlodge.com"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">
                Initial Password
              </label>
              <input
                type="text"
                name="password"
                defaultValue="Password123!"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">
                Role Assignment
              </label>
              <select
                name="role"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-800"
              >
                <option value="reception">Receptionist (Front Desk)</option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-[#0b1437] text-white rounded-lg text-sm font-semibold hover:bg-[#162268] transition-colors shadow-xs mt-2"
            >
              + Create Staff Account
            </button>
          </form>
        </div>

        {/* Role Permissions Matrix */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-gray-100 overflow-hidden shadow-xs flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/70">
              <h2 className="font-display font-semibold text-gray-900 text-sm">
                Role Permissions Matrix
              </h2>
            </div>
            <div className="p-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-3 font-bold text-gray-400 uppercase tracking-wider">
                      Module / Capability
                    </th>
                    <th className="pb-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700">
                        Admin
                      </span>
                    </th>
                    <th className="pb-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                        Reception
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {PERMISSIONS.map((p) => (
                    <tr key={p.module} className="hover:bg-gray-50/40">
                      <td className="py-3 text-gray-700 font-medium">{p.module}</td>
                      <td className="py-3 text-center text-emerald-600 font-bold">
                        {p.admin ? "✓" : "—"}
                      </td>
                      <td className="py-3 text-center text-emerald-600 font-bold">
                        {p.reception ? "✓" : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-5 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            Permissions are enforced at the database level via Postgres Row Level Security (RLS).
          </div>
        </div>
      </div>
    </div>
  );
}

