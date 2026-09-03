import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/shared/Avatar";
import { PayBadge } from "@/components/shared/PayBadge";

const fmt = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const RES_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  upcoming:    { bg: "bg-blue-50",    text: "text-blue-700",    label: "Upcoming"    },
  checked_in:  { bg: "bg-emerald-50", text: "text-emerald-700", label: "Checked In"  },
  checked_out: { bg: "bg-gray-100",   text: "text-gray-500",    label: "Checked Out" },
  cancelled:   { bg: "bg-red-50",     text: "text-red-600",     label: "Cancelled"   },
};

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getTenantContext();
  const supabase = await createClient();

  // 1. Fetch Customer — must belong to this lodge (RLS + explicit filter)
  const { data: customerData, error: custError } = await (supabase as any)
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("lodge_id", tenant.lodgeId)
    .single();

  if (custError || !customerData) {
    notFound();
  }

  const customer: any = customerData;

  // 2. Fetch all Reservations for this customer at this lodge, joined to rooms and bills
  const { data: reservationsData } = await (supabase as any)
    .from("reservations")
    .select(`
      *,
      rooms ( room_number, room_type, bed_type ),
      bills ( id, net_amount, received, balance, payment_status )
    `)
    .eq("customer_id", id)
    .eq("lodge_id", tenant.lodgeId)
    .order("created_at", { ascending: false });

  const reservations: any[] = reservationsData || [];

  // 3. Compute live totals from actual reservation data
  // bills comes back as an array from PostgREST even with unique(reservation_id)
  const liveTotalSpent = reservations.reduce((acc: number, r: any) => {
    const bill = Array.isArray(r.bills) ? r.bills[0] : r.bills;
    return acc + Number(bill?.received || 0);
  }, 0);
  const liveOutstanding = reservations.reduce((acc: number, r: any) => {
    const bill = Array.isArray(r.bills) ? r.bills[0] : r.bills;
    return acc + Number(bill?.balance || 0);
  }, 0);


  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/reception/customers"
            className="text-gray-400 hover:text-gray-700 text-sm font-medium transition-colors"
          >
            ← Back to Customers
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
        </div>
        <Link
          href={`/reception/reservations/new`}
          className="px-4 py-2 bg-[#0b1437] text-white rounded-lg text-sm font-semibold hover:bg-[#162268] transition-colors shadow-xs"
        >
          + Book Room for Customer
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Customer Info Card */}
        <div className="lg:col-span-1 space-y-5">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
            <div className="flex flex-col items-center text-center gap-3 pb-5 border-b border-gray-100">
              <Avatar name={customer.name} size="lg" />
              <div>
                <div className="text-xl font-bold text-gray-900">{customer.name}</div>
                <div className="text-sm text-gray-500 mt-0.5">{customer.mobile}</div>
                {customer.email && (
                  <div className="text-xs text-gray-400 mt-0.5">{customer.email}</div>
                )}
              </div>
            </div>

            <div className="pt-5 space-y-3 text-sm">
              {customer.address && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                    Address
                  </span>
                  <span className="text-gray-700">{customer.address}</span>
                </div>
              )}
              {customer.id_type && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                    ID Proof
                  </span>
                  <span className="text-gray-700 font-mono text-xs">
                    {customer.id_type}: {customer.id_number || "—"}
                  </span>
                </div>
              )}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                  First Visit
                </span>
                <span className="text-gray-700">
                  {customer.created_at
                    ? new Date(customer.created_at).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs text-center">
              <div className="text-2xl font-bold text-gray-900">{reservations.length}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">
                Total Stays
              </div>
            </div>
            <div className="bg-emerald-50/80 rounded-xl border border-emerald-100 p-4 shadow-xs text-center">
              <div className="text-xl font-bold text-emerald-800">{fmt(liveTotalSpent)}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mt-0.5">
                Collected
              </div>
            </div>
            {liveOutstanding > 0 && (
              <div className="col-span-2 bg-red-50/70 rounded-xl border border-red-100 p-4 shadow-xs text-center">
                <div className="text-xl font-bold text-red-700">{fmt(liveOutstanding)}</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-red-400 mt-0.5">
                  Outstanding Balance
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Stay History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-bold text-gray-900">Stay History</h2>
            <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded-full">
              {reservations.length}
            </span>
          </div>

          {reservations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-xs">
              No reservations found for this customer at {tenant.lodgeName}.
            </div>
          ) : (
            reservations.map((r: any) => {
              const room = r.rooms as any;
              const bill = Array.isArray(r.bills) ? r.bills[0] : (r.bills as any);
              const badge = RES_BADGES[r.status] || RES_BADGES.upcoming;
              const nights =
                r.check_in && r.check_out
                  ? Math.max(
                      1,
                      Math.round(
                        (new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) /
                          86400000
                      )
                    )
                  : "—";

              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4"
                >
                  {/* Reservation Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-gray-400">
                        #{r.id.slice(0, 8)}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    {bill && (
                      <div className="flex items-center gap-2">
                        <PayBadge status={bill.payment_status} />
                        <Link
                          href={`/reception/billing/${bill.id}/print`}
                          className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-semibold hover:bg-gray-200 transition-colors"
                          target="_blank"
                        >
                          Print Invoice
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Stay Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl">
                    <div>
                      <span className="text-gray-400 block mb-0.5">Room</span>
                      <span className="font-bold text-gray-900">
                        {room?.room_number || "—"}{" "}
                        <span className="font-normal text-gray-500">{room?.room_type}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Check-in</span>
                      <span className="font-bold text-gray-900">{r.check_in || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Check-out</span>
                      <span className="font-bold text-gray-900">{r.check_out || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Nights / Guests</span>
                      <span className="font-bold text-gray-900">
                        {nights}N / {r.guests}G
                      </span>
                    </div>
                  </div>

                  {/* Bill Summary */}
                  {bill ? (
                    <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-gray-100 text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400">
                          Billed:{" "}
                          <span className="font-bold text-gray-900">{fmt(Number(bill.net_amount))}</span>
                        </span>
                        <span className="text-gray-400">
                          Received:{" "}
                          <span className="font-bold text-emerald-700">{fmt(Number(bill.received))}</span>
                        </span>
                        {Number(bill.balance) > 0 && (
                          <span className="text-gray-400">
                            Due:{" "}
                            <span className="font-bold text-red-600">{fmt(Number(bill.balance))}</span>
                          </span>
                        )}
                      </div>
                      {r.advance > 0 && (
                        <span className="text-xs text-gray-400">
                          Advance paid: <span className="font-semibold">{fmt(Number(r.advance))}</span>
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                      No bill generated for this stay.
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
