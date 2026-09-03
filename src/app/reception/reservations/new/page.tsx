import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";

export default async function CreateReservationPage({
  searchParams,
}: {
  searchParams: Promise<{ room_id?: string }>;
}) {
  const { room_id: selectedRoomId } = await searchParams;
  const tenant = await getTenantContext();
  const supabase = await createClient();

  // Fetch Available or All Rooms for this Lodge
  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .eq("lodge_id", tenant.lodgeId)
    .order("room_number", { ascending: true });

  const roomList: any[] = (rooms as any[]) || [];

  // Server Action to create Customer and Reservation
  async function createReservationAction(formData: FormData) {
    "use server";
    const tenantCtx = await getTenantContext();
    const serverSupabase = await createClient();

    const name = formData.get("name") as string;
    const mobile = formData.get("mobile") as string;
    const email = (formData.get("email") as string) || null;
    const roomId = formData.get("room_id") as string;
    const checkIn = formData.get("check_in") as string;
    const checkOut = formData.get("check_out") as string;
    const guests = parseInt((formData.get("guests") as string) || "1", 10);
    const advance = parseFloat((formData.get("advance") as string) || "0");
    const specialRequest = (formData.get("special_request") as string) || null;

    // 1. Create or Find Customer
    let customerId = "";
    const { data: existingCustomer } = await (serverSupabase as any)
      .from("customers")
      .select("id")
      .eq("lodge_id", tenantCtx.lodgeId)
      .eq("mobile", mobile)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCust, error: custErr } = await (serverSupabase as any)
        .from("customers")
        .insert({
          lodge_id: tenantCtx.lodgeId,
          name,
          mobile,
          email,
          visits: 1,
        })
        .select("id")
        .single();

      if (custErr || !newCust) {
        throw new Error(`Failed to create customer: ${custErr?.message}`);
      }
      customerId = newCust.id;
    }

    // 2. Insert Reservation
    const { data: newRes, error: resErr } = await (serverSupabase as any)
      .from("reservations")
      .insert({
        lodge_id: tenantCtx.lodgeId,
        customer_id: customerId,
        room_id: roomId,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        advance,
        status: "upcoming",
        special_request: specialRequest,
      })
      .select("id")
      .single();

    if (resErr || !newRes) {
      throw new Error(`Failed to create reservation: ${resErr?.message}`);
    }

    // 3. Mark room as reserved if needed
    await (serverSupabase as any)
      .from("rooms")
      .update({ status: "reserved" })
      .eq("id", roomId)
      .eq("lodge_id", tenantCtx.lodgeId);

    redirect("/reception/reservations");
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/reception/reservations"
          className="text-gray-400 hover:text-gray-700 text-sm font-medium"
        >
          ← Back to Reservations
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">New Reservation</h1>
      </div>

      <form action={createReservationAction} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-6">
        {/* Customer Information */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">
            Guest Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Guest Name *
              </label>
              <input
                name="name"
                required
                placeholder="Full Name"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Mobile Number *
              </label>
              <input
                name="mobile"
                type="tel"
                required
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                placeholder="guest@example.com"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {/* Stay Details */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">
            Reservation &amp; Room Assignment
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Select Room *
              </label>
              <select
                name="room_id"
                required
                defaultValue={selectedRoomId || ""}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {roomList.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.room_number} — {r.room_type} ({r.bed_type} Bed, ₹{r.rent}/night)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Guests Count
              </label>
              <input
                name="guests"
                type="number"
                min="1"
                defaultValue="1"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Check-in Date *
              </label>
              <input
                name="check_in"
                type="date"
                required
                defaultValue={todayStr}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Check-out Date *
              </label>
              <input
                name="check_out"
                type="date"
                required
                defaultValue={tomorrowStr}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Advance Paid (₹)
              </label>
              <input
                name="advance"
                type="number"
                min="0"
                defaultValue="0"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Special Requests
              </label>
              <textarea
                name="special_request"
                rows={2}
                placeholder="Late arrival, extra pillows, etc."
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-3 border-t border-gray-100">
          <Link
            href="/reception/reservations"
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold text-center text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="flex-1 py-2.5 bg-[#0b1437] text-white rounded-xl font-bold text-sm hover:bg-[#162268] transition-colors shadow-xs cursor-pointer"
          >
            Confirm Reservation
          </button>
        </div>
      </form>
    </div>
  );
}
