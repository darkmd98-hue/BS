import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge, RoomStatus } from "@/components/shared/StatusBadge";
import { PayBadge } from "@/components/shared/PayBadge";
import { Avatar } from "@/components/shared/Avatar";

const fmt = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export default async function RoomStayDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getTenantContext();
  const supabase = await createClient();

  // 1. Fetch Room Scoped to Current Lodge
  const { data: roomData, error: roomError } = await (supabase as any)
    .from("rooms")
    .select("*")
    .eq("id", id)
    .eq("lodge_id", tenant.lodgeId)
    .single();

  const room: any = roomData;

  if (roomError || !room) {
    notFound();
  }

  // 2. Fetch Active or Latest Reservation for this Room
  let { data: reservationData } = await (supabase as any)
    .from("reservations")
    .select(`
      *,
      customers (*)
    `)
    .eq("room_id", room.id)
    .eq("lodge_id", tenant.lodgeId)
    .in("status", ["checked-in", "checked_in", "today"])
    .order("check_in", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!reservationData) {
    const { data: fallbackRes } = await (supabase as any)
      .from("reservations")
      .select(`
        *,
        customers (*)
      `)
      .eq("room_id", room.id)
      .eq("lodge_id", tenant.lodgeId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    reservationData = fallbackRes;
  }

  const reservation: any = reservationData;

  // 3. Fetch Bill if Reservation exists
  let bill: any = null;
  let payments: any[] = [];
  if (reservation) {
    const { data: billData } = await (supabase as any)
      .from("bills")
      .select("*")
      .eq("reservation_id", reservation.id)
      .eq("lodge_id", tenant.lodgeId)
      .maybeSingle();

    bill = billData;

    if (bill) {
      const { data: paymentsData } = await (supabase as any)
        .from("payments")
        .select("*")
        .eq("bill_id", bill.id)
        .eq("lodge_id", tenant.lodgeId)
        .order("paid_at", { ascending: false });
      payments = paymentsData || [];
    }
  }

  const customer = reservation?.customers as any;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Status Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/reception/rooms"
            className="text-gray-400 hover:text-gray-700 text-sm font-medium transition-colors"
          >
            ← Back to Rooms
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-2xl font-bold text-gray-900">
            Room {room.room_number} Stay &amp; Billing
          </h1>
          <StatusBadge status={room.status as RoomStatus} />
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/reception/reservations/new?room_id=${room.id}`}
            className="px-4 py-2 bg-[#0b1437] text-white rounded-lg text-sm font-semibold hover:bg-[#162268] transition-colors shadow-sm"
          >
            + New Booking for Room
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Room Specs + Active Guest Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Room Details Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              Room Specifications
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400 text-xs block">Room Type</span>
                <span className="font-semibold text-gray-800">{room.room_type}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block">Bed Type</span>
                <span className="font-semibold text-gray-800">{room.bed_type}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block">Capacity</span>
                <span className="font-semibold text-gray-800">{room.capacity} Persons</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block">Daily Rent</span>
                <span className="font-semibold text-gray-800">{fmt(Number(room.rent))}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block">Extra Bed Charge</span>
                <span className="font-semibold text-gray-800">{fmt(Number(room.extra_bed_charge))}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block">Extra Person Charge</span>
                <span className="font-semibold text-gray-800">{fmt(Number(room.extra_person_charge))}</span>
              </div>
            </div>
          </div>

          {/* Current / Last Reservation Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              Current / Most Recent Stay
            </h2>
            {reservation ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar name={customer?.name || "Guest"} size="md" />
                  <div>
                    <div className="font-bold text-gray-900">{customer?.name || "Guest"}</div>
                    <div className="text-xs text-gray-500">
                      {customer?.mobile} {customer?.email ? `· ${customer.email}` : ""}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl text-xs">
                  <div>
                    <span className="text-gray-400 block">Check-in</span>
                    <span className="font-bold text-gray-800">{reservation.check_in}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Check-out</span>
                    <span className="font-bold text-gray-800">{reservation.check_out}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Guests</span>
                    <span className="font-bold text-gray-800">{reservation.guests}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Advance</span>
                    <span className="font-bold text-emerald-700">{fmt(Number(reservation.advance))}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-sm py-4 text-center">
                No reservation history recorded for this room yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Bill & Payments */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">Billing &amp; Folio</h2>
              <div className="flex items-center gap-2">
                {bill && (
                  <>
                    <Link
                      href={`/reception/billing/${bill.id}/print`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-md transition-colors"
                    >
                      Print Invoice
                    </Link>
                    <PayBadge status={bill.payment_status} />
                  </>
                )}
              </div>
            </div>

            {bill ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Net Amount</span>
                  <span className="font-bold text-gray-900">{fmt(Number(bill.net_amount))}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Total Received</span>
                  <span className="font-bold text-emerald-700">{fmt(Number(bill.received))}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold">
                  <span>Balance Due</span>
                  <span className={Number(bill.balance) > 0 ? "text-red-600" : "text-emerald-700"}>
                    {fmt(Number(bill.balance))}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Payment Receipts ({payments.length})
                  </h3>
                  <div className="space-y-2">
                    {payments.map((p) => (
                      <div key={p.id} className="flex justify-between text-xs bg-gray-50 p-2.5 rounded-lg">
                        <span className="text-gray-600">{p.method} ({new Date(p.paid_at).toLocaleDateString("en-IN")})</span>
                        <span className="font-bold text-gray-900">{fmt(Number(p.amount))}</span>
                      </div>
                    ))}
                    {payments.length === 0 && (
                      <div className="text-xs text-gray-400">No payment receipts logged.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-sm py-4 text-center">
                No active bill for this room.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
