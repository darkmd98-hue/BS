import Link from "next/link";
import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { PayBadge } from "@/components/shared/PayBadge";
import { Avatar } from "@/components/shared/Avatar";

const fmt = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export default async function ReceptionBillingPage() {
  const tenant = await getTenantContext();
  const supabase = await createClient();

  // Fetch Bills joined to Reservations and Customers
  const { data: bills } = await supabase
    .from("bills")
    .select(`
      *,
      reservations (
        id,
        check_in,
        check_out,
        rooms ( room_number ),
        customers ( name, mobile )
      )
    `)
    .eq("lodge_id", tenant.lodgeId)
    .order("created_at", { ascending: false });

  const billList: any[] = bills || [];

  const totals = {
    billed: billList.reduce((acc, b) => acc + (Number(b.net_amount) || 0), 0),
    collected: billList.reduce((acc, b) => acc + (Number(b.received) || 0), 0),
    outstanding: billList.reduce((acc, b) => acc + (Number(b.balance) || 0), 0),
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Bills &amp; Payments</h1>
        <p className="text-gray-500 text-sm mt-1">
          Financial transactions and folio ledger for <span className="font-semibold text-gray-800">{tenant.lodgeName}</span> ({billList.length} total bills).
        </p>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">
            Total Billed
          </div>
          <div className="text-2xl font-bold text-gray-900">{fmt(totals.billed)}</div>
        </div>
        <div className="bg-emerald-50/60 rounded-xl border border-emerald-100 p-4 shadow-sm">
          <div className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider mb-1.5">
            Total Collected
          </div>
          <div className="text-2xl font-bold text-emerald-800">{fmt(totals.collected)}</div>
        </div>
        <div className="bg-red-50/60 rounded-xl border border-red-100 p-4 shadow-sm">
          <div className="text-[11px] text-red-600 font-bold uppercase tracking-wider mb-1.5">
            Outstanding Balance
          </div>
          <div className="text-2xl font-bold text-red-700">{fmt(totals.outstanding)}</div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Bill ID</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Room</th>
                <th className="px-5 py-3.5">Stay Dates</th>
                <th className="px-5 py-3.5">Net Amount</th>
                <th className="px-5 py-3.5">Received</th>
                <th className="px-5 py-3.5">Balance</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {billList.map((b) => {
                const res = b.reservations as any;
                const customer = res?.customers;
                const room = res?.rooms;

                return (
                  <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-gray-600">
                      #{(b.id || "").slice(0, 8)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={customer?.name || "Guest"} size="sm" />
                        <div>
                          <div className="font-semibold text-gray-900">{customer?.name || "Guest"}</div>
                          <div className="text-xs text-gray-400">{customer?.mobile || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-800">
                      Room {room?.room_number || "—"}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {res?.check_in} → {res?.check_out}
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-900">{fmt(Number(b.net_amount))}</td>
                    <td className="px-5 py-4 font-semibold text-emerald-700">{fmt(Number(b.received))}</td>
                    <td className="px-5 py-4">
                      <span className={Number(b.balance) > 0 ? "font-bold text-red-600" : "text-gray-400"}>
                        {Number(b.balance) > 0 ? fmt(Number(b.balance)) : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <PayBadge status={b.payment_status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/reception/billing/${b.id}/print`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Print Invoice
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {billList.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-gray-400">
                    No billing records found for this lodge.
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
