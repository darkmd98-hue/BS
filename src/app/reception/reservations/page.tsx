import React from "react";
import Link from "next/link";
import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/shared/Avatar";

const fmt = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const STATUS_BADGES: Record<string, { bg: string; text: string }> = {
  upcoming: { bg: "bg-blue-50", text: "text-blue-700" },
  checked_in: { bg: "bg-emerald-50", text: "text-emerald-700" },
  checked_out: { bg: "bg-gray-100", text: "text-gray-500" },
  cancelled: { bg: "bg-red-50", text: "text-red-600" },
};

export default async function ReservationsListPage() {
  const tenant = await getTenantContext();
  const supabase = await createClient();

  // Fetch reservations with joins
  const { data: reservations } = await supabase
    .from("reservations")
    .select(`
      *,
      customers ( name, mobile, email ),
      rooms ( room_number, room_type, bed_type )
    `)
    .eq("lodge_id", tenant.lodgeId)
    .order("created_at", { ascending: false });

  const resList: any[] = (reservations as any[]) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Reservations</h1>
          <p className="text-gray-500 text-sm mt-1">
            All customer bookings and reservations for <span className="font-semibold text-gray-800">{tenant.lodgeName}</span> ({resList.length} total).
          </p>
        </div>
        <Link
          href="/reception/reservations/new"
          className="px-4 py-2 bg-[#0b1437] text-white rounded-lg text-sm font-semibold hover:bg-[#162268] transition-colors shadow-xs"
        >
          + New Reservation
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Guest</th>
                <th className="px-5 py-3.5">Room</th>
                <th className="px-5 py-3.5">Check-in</th>
                <th className="px-5 py-3.5">Check-out</th>
                <th className="px-5 py-3.5 text-center">Guests</th>
                <th className="px-5 py-3.5">Advance</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {resList.map((r) => {
                const customer = r.customers as any;
                const room = r.rooms as any;
                const badge = STATUS_BADGES[r.status] || STATUS_BADGES.upcoming;

                return (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={customer?.name || "Guest"} size="sm" />
                        <div>
                          <div className="font-semibold text-gray-900">{customer?.name || "Guest"}</div>
                          <div className="text-xs text-gray-400">{customer?.mobile || "No phone"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-800">
                      Room {room?.room_number || "—"}
                      <span className="block text-xs font-normal text-gray-400">{room?.room_type}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{r.check_in}</td>
                    <td className="px-5 py-4 text-gray-600">{r.check_out}</td>
                    <td className="px-5 py-4 text-center font-semibold text-gray-700">{r.guests}</td>
                    <td className="px-5 py-4 font-bold text-gray-900">{fmt(Number(r.advance))}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${badge.bg} ${badge.text}`}>
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/reception/rooms/${r.room_id}`}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold hover:bg-blue-100 transition-colors"
                      >
                        View Stay
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {resList.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400">
                    No reservations recorded for this lodge yet.
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
