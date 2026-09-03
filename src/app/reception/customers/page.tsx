import React from "react";
import Link from "next/link";
import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/shared/Avatar";

const fmt = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export default async function ReceptionCustomersPage() {
  const tenant = await getTenantContext();
  const supabase = await createClient();

  // Fetch Customers scoped strictly to tenant.lodgeId
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .eq("lodge_id", tenant.lodgeId)
    .order("name", { ascending: true });

  const custList: any[] = customers || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Customer Directory</h1>
          <p className="text-gray-500 text-sm mt-1">
            Registered guests and visit history for <span className="font-semibold text-gray-800">{tenant.lodgeName}</span> ({custList.length} total).
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">ID Proof</th>
                <th className="px-5 py-3.5 text-center">Visits</th>
                <th className="px-5 py-3.5">Total Spent</th>
                <th className="px-5 py-3.5">Outstanding</th>
                <th className="px-5 py-3.5">Last Stay</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {custList.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} size="sm" />
                      <div>
                        <div className="font-semibold text-gray-900">{c.name}</div>
                        {c.address && <div className="text-xs text-gray-400 truncate max-w-xs">{c.address}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-gray-800 font-medium">{c.mobile}</div>
                    {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-600">
                    {c.id_type ? `${c.id_type}: ${c.id_number || "—"}` : "—"}
                  </td>
                  <td className="px-5 py-4 text-center font-semibold text-gray-700">
                    {c.visits}
                  </td>
                  <td className="px-5 py-4 font-bold text-gray-900">
                    {fmt(Number(c.total_spent))}
                  </td>
                  <td className="px-5 py-4">
                    <span className={Number(c.outstanding) > 0 ? "font-bold text-red-600" : "text-gray-400"}>
                      {Number(c.outstanding) > 0 ? fmt(Number(c.outstanding)) : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {c.last_stay || "Recent"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/reception/customers/${c.id}`}
                        className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Profile
                      </Link>
                      <Link
                        href={`/reception/reservations/new`}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold hover:bg-blue-100 transition-colors"
                      >
                        Book Room
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {custList.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400">
                    No customers found for this lodge.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
