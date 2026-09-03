import React from "react";
import { notFound } from "next/navigation";
import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { PrintPageClient } from "./PrintPageClient";

const fmt = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export default async function PrintInvoicePage({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  const { billId } = await params;
  const tenant = await getTenantContext();
  const supabase = await createClient();

  // 1. Fetch Bill — strictly scoped to this lodge
  const { data: billData, error: billError } = await (supabase as any)
    .from("bills")
    .select(`
      *,
      reservations (
        *,
        customers ( * ),
        rooms ( room_number, room_type, bed_type, capacity )
      )
    `)
    .eq("id", billId)
    .eq("lodge_id", tenant.lodgeId)
    .single();

  if (billError || !billData) {
    notFound();
  }

  const bill: any = billData;
  const reservation: any = bill.reservations;
  const customer: any = reservation?.customers;
  const room: any = reservation?.rooms;

  // 2. Fetch Payment receipts for this bill
  const { data: paymentsData } = await (supabase as any)
    .from("payments")
    .select("*")
    .eq("bill_id", billId)
    .eq("lodge_id", tenant.lodgeId)
    .order("paid_at", { ascending: true });

  const payments: any[] = paymentsData || [];

  // Compute nights
  const nights =
    reservation?.check_in && reservation?.check_out
      ? Math.max(
          1,
          Math.round(
            (new Date(reservation.check_out).getTime() -
              new Date(reservation.check_in).getTime()) /
              86400000
          )
        )
      : 1;

  const rentTotal = nights * (Number(reservation?.advance || 0) > 0 ? 0 : 0);
  const paymentStatusLabel: Record<string, string> = {
    paid: "PAID IN FULL",
    partial: "PARTIALLY PAID",
    pending: "PAYMENT PENDING",
    unpaid: "UNPAID",
  };

  return (
    <>
      {/* Print-trigger button (hidden when printing) */}
      <PrintPageClient />

      {/* Print Stylesheet */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { box-shadow: none !important; border: none !important; max-width: 100% !important; margin: 0 !important; }
        }
        @media screen {
          body { background: #f4f6fc; }
        }
      `}</style>

      {/* Invoice Page */}
      <div className="print-page max-w-2xl mx-auto my-12 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Invoice Header */}
        <div className="bg-[#0b1437] text-white px-8 pt-8 pb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-1">
                Tax Invoice
              </div>
              <h1 className="text-2xl font-bold">{tenant.lodgeName}</h1>
              <p className="text-blue-200 text-sm mt-1">Hotel & Lodging Services</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-300 font-bold uppercase tracking-wider mb-1">
                Invoice No.
              </div>
              <div className="font-mono text-sm font-bold text-white">
                #{bill.id.slice(0, 8).toUpperCase()}
              </div>
              <div className="text-xs text-blue-300 mt-2">
                {new Date(bill.created_at).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bill To / Stay Info */}
        <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-gray-100">
          {/* Customer */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Bill To
            </div>
            <div className="text-lg font-bold text-gray-900">{customer?.name || "Guest"}</div>
            {customer?.mobile && (
              <div className="text-sm text-gray-600 mt-0.5">{customer.mobile}</div>
            )}
            {customer?.email && (
              <div className="text-xs text-gray-400 mt-0.5">{customer.email}</div>
            )}
            {customer?.address && (
              <div className="text-xs text-gray-500 mt-1">{customer.address}</div>
            )}
            {customer?.id_type && (
              <div className="text-xs text-gray-400 mt-1">
                {customer.id_type}: {customer.id_number || "—"}
              </div>
            )}
          </div>

          {/* Stay Details */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Stay Details
            </div>
            <div className="space-y-1.5 text-sm text-gray-700">
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 shrink-0">Room</span>
                <span className="font-semibold">
                  {room?.room_number || "—"}{" "}
                  <span className="font-normal text-gray-500 text-xs">({room?.room_type})</span>
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 shrink-0">Check-in</span>
                <span className="font-semibold">{reservation?.check_in || "—"}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 shrink-0">Check-out</span>
                <span className="font-semibold">{reservation?.check_out || "—"}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 shrink-0">Duration</span>
                <span className="font-semibold">{nights} Night{nights !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 shrink-0">Guests</span>
                <span className="font-semibold">{reservation?.guests || 1} Person{(reservation?.guests || 1) !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Charges */}
        <div className="px-8 py-5 border-b border-gray-100">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
            Charges
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 font-bold uppercase tracking-wider">
                <th className="text-left pb-2">Description</th>
                <th className="text-right pb-2">Qty</th>
                <th className="text-right pb-2">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr>
                <td className="py-2.5 text-gray-800">
                  Room {room?.room_number} — {room?.room_type} ({room?.bed_type})
                </td>
                <td className="py-2.5 text-right text-gray-600">{nights}N</td>
                <td className="py-2.5 text-right font-semibold text-gray-900">
                  {fmt(Number(bill.net_amount))}
                </td>
              </tr>
              {Number(reservation?.advance || 0) > 0 && (
                <tr>
                  <td className="py-2.5 text-emerald-700">Advance Payment Received</td>
                  <td className="py-2.5 text-right text-gray-600">—</td>
                  <td className="py-2.5 text-right font-semibold text-emerald-700">
                    −{fmt(Number(reservation.advance))}
                  </td>
                </tr>
              )}
              {reservation?.special_request && (
                <tr>
                  <td className="py-2.5 text-xs text-gray-400" colSpan={3}>
                    Special Request: {reservation.special_request}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-8 py-5 bg-gray-50/60 border-b border-gray-100">
          <div className="space-y-2 text-sm max-w-xs ml-auto">
            <div className="flex justify-between text-gray-600">
              <span>Gross Amount</span>
              <span className="font-semibold text-gray-900">{fmt(Number(bill.net_amount))}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total Payments Received</span>
              <span className="font-semibold text-emerald-700">{fmt(Number(bill.received))}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2 mt-2">
              <span className="text-gray-900">Balance Due</span>
              <span className={Number(bill.balance) > 0 ? "text-red-600" : "text-emerald-700"}>
                {fmt(Number(bill.balance))}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History */}
        {payments.length > 0 && (
          <div className="px-8 py-5 border-b border-gray-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
              Payment Receipts
            </div>
            <div className="space-y-1.5">
              {payments.map((p: any) => (
                <div key={p.id} className="flex justify-between text-xs text-gray-700 bg-white border border-gray-100 p-2.5 rounded-lg">
                  <span>
                    {p.method}{" "}
                    <span className="text-gray-400">
                      · {new Date(p.paid_at).toLocaleDateString("en-IN")}
                    </span>
                  </span>
                  <span className="font-bold text-gray-900">{fmt(Number(p.amount))}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-5 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-gray-400">
            Thank you for staying at{" "}
            <span className="font-semibold text-gray-600">{tenant.lodgeName}</span>. We look forward
            to welcoming you again.
          </div>
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
              bill.payment_status === "paid"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : bill.payment_status === "partial"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}
          >
            {paymentStatusLabel[bill.payment_status] || "PENDING"}
          </div>
        </div>

        {/* Print-only footer */}
        <div className="px-8 pb-6 text-xs text-gray-400 border-t border-gray-100 pt-4">
          Powered by LodgeOS · {tenant.lodgeName} · Generated{" "}
          {new Date().toLocaleString("en-IN")}
        </div>
      </div>
    </>
  );
}
