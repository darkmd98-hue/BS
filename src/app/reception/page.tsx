import Link from "next/link";
import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/shared/Avatar";
import { fmt, formatDate } from "@/lib/format";

export default async function ReceptionDashboardPage() {
  const tenant = await getTenantContext();
  const supabase = await createClient();

  // 1. Fetch Rooms for Lodge
  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .eq("lodge_id", tenant.lodgeId);

  const allRooms: any[] = (rooms as any[]) || [];
  const totalRooms = allRooms.length;
  const availableRooms = allRooms.filter((r) => r.status === "available").length;
  const occupiedRooms = allRooms.filter((r) => r.status === "occupied").length;
  const reservedRooms = allRooms.filter((r) => r.status === "reserved").length;
  const cleaningRooms = allRooms.filter((r) => r.status === "cleaning").length;

  // 2. Fetch Reservations for Today
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: reservations } = await supabase
    .from("reservations")
    .select(`
      id,
      room_id,
      check_in,
      check_out,
      guests,
      advance,
      status,
      rooms ( room_number, room_type, bed_type ),
      customers ( name, mobile )
    `)
    .eq("lodge_id", tenant.lodgeId)
    .order("created_at", { ascending: false })
    .limit(100);

  const allRes: any[] = (reservations as any[]) || [];
  const checkIns = allRes
    .filter((r) => (r.check_in === todayStr || r.status === "upcoming") && r.status !== "checked_out" && r.status !== "cancelled")
    .slice(0, 5);
  const checkOuts = allRes
    .filter((r) => r.check_out === todayStr && (r.status === "checked_in" || r.status === "checked-in"))
    .slice(0, 5);

  // 3. Fetch Bills & Payments
  const { data: bills } = await supabase
    .from("bills")
    .select("*")
    .eq("lodge_id", tenant.lodgeId)
    .order("created_at", { ascending: false })
    .limit(200);

  const allBills: any[] = (bills as any[]) || [];
  const totalBilled = allBills.reduce((acc, b) => acc + (Number(b.net_amount) || 0), 0);
  const totalCollected = allBills.reduce((acc, b) => acc + (Number(b.received) || 0), 0);
  const totalOutstanding = allBills.reduce((acc, b) => acc + (Number(b.balance) || 0), 0);

  const STATS = [
    { label: "Total Rooms", value: String(totalRooms), sub: "Lodge capacity", icon: "🏨", ibg: "bg-blue-100", bd: "border-blue-50" },
    { label: "Available", value: String(availableRooms), sub: "Ready to book", icon: "✅", ibg: "bg-emerald-100", bd: "border-emerald-50" },
    { label: "Occupied", value: String(occupiedRooms), sub: totalRooms ? `${Math.round((occupiedRooms / totalRooms) * 100)}% occupancy` : "0% occupancy", icon: "🔴", ibg: "bg-red-100", bd: "border-red-50" },
    { label: "Reserved", value: String(reservedRooms), sub: "Upcoming stays", icon: "📋", ibg: "bg-amber-100", bd: "border-amber-50" },
    { label: "Cleaning", value: String(cleaningRooms), sub: "In progress", icon: "🧹", ibg: "bg-sky-100", bd: "border-sky-50" },
    { label: "Total Collected", value: fmt(totalCollected), sub: `${allBills.length} bills generated`, icon: "💰", ibg: "bg-violet-100", bd: "border-violet-50", big: true },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title row */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Reception Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Realtime operations overview for <span className="font-semibold text-gray-800">{tenant.lodgeName}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/reception/reservations/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0b1437] text-white rounded-lg text-sm font-semibold hover:bg-[#162268] transition-colors shadow-sm"
          >
            + New Reservation
          </Link>
          <Link
            href="/reception/rooms"
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            View Room Grid
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATS.map((s) => (
          <div key={s.label} className={`bg-white rounded-xl border ${s.bd} p-4 shadow-sm hover:shadow-md transition-shadow`}>
            <div className={`w-9 h-9 ${s.ibg} rounded-xl flex items-center justify-center text-lg mb-3`}>
              {s.icon}
            </div>
            <div className={`font-bold text-gray-900 leading-none ${s.big ? "text-xl" : "text-2xl"}`}>
              {s.value}
            </div>
            <div className="text-[11px] text-gray-400 font-medium mt-2">{s.label}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Check-ins & Check-outs Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's Check-ins */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900 text-sm">Today's Check-ins & Arrivals</h2>
              <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                {checkIns.length}
              </span>
            </div>
            <Link href="/reception/reservations" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {checkIns.map((c) => {
              const customerName = (c.customers as any)?.name || "Guest";
              const roomNumber = (c.rooms as any)?.room_number || "—";
              const roomType = (c.rooms as any)?.room_type || "";
              return (
                <div key={c.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/60 transition-colors">
                  <Avatar name={customerName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-gray-900 truncate">{customerName}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                      Room {roomNumber} {roomType ? `· ${roomType}` : ""}
                    </div>
                  </div>
                  <div className="text-right shrink-0 mr-2">
                    <div className="text-[12px] font-medium text-gray-700">{c.check_in}</div>
                    <div className="text-[10px] text-gray-400 capitalize">{c.status}</div>
                  </div>
                  <Link
                    href={c.room_id ? `/reception/rooms/${c.room_id}` : `/reception/reservations`}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shrink-0"
                  >
                    View Stay
                  </Link>
                </div>
              );
            })}
            {checkIns.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">No arrivals recorded today.</div>
            )}
          </div>
        </div>

        {/* Today's Check-outs */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900 text-sm">Active Stays & Check-outs</h2>
              <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                {checkOuts.length}
              </span>
            </div>
            <Link href="/reception/billing" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              View Bills →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {checkOuts.map((c) => {
              const customerName = (c.customers as any)?.name || "Guest";
              const roomNumber = (c.rooms as any)?.room_number || "—";
              return (
                <div key={c.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/60 transition-colors">
                  <Avatar name={customerName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-gray-900 truncate">{customerName}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                      Room {roomNumber} · Out: {c.check_out}
                    </div>
                  </div>
                  <Link
                    href="/reception/billing"
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors shrink-0"
                  >
                    Billing
                  </Link>
                </div>
              );
            })}
            {checkOuts.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">No check-outs recorded today.</div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue & Billing Overview Strip */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Financial Summary (Scoped to {tenant.lodgeName})</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="text-xs text-gray-500 font-medium">Total Billed</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{fmt(totalBilled)}</div>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50/60">
            <div className="text-xs text-emerald-700 font-medium">Total Collected</div>
            <div className="text-xl font-bold text-emerald-800 mt-1">{fmt(totalCollected)}</div>
          </div>
          <div className="p-4 rounded-xl bg-amber-50/60">
            <div className="text-xs text-amber-700 font-medium">Outstanding Balance</div>
            <div className="text-xl font-bold text-amber-800 mt-1">{fmt(totalOutstanding)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
