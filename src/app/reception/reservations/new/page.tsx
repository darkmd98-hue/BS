import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { sanitizeText } from "@/lib/sanitize";

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

    const name = sanitizeText(formData.get("name"));
    const rawMobile = sanitizeText(formData.get("mobile"));
    const mobile = rawMobile.replace(/[\s\-()]/g, "");
    const email = sanitizeText(formData.get("email")) || null;
    const roomId = formData.get("room_id") as string;
    const checkIn = formData.get("check_in") as string;
    const checkOut = formData.get("check_out") as string;
    const guests = Math.max(1, Math.min(50, parseInt((formData.get("guests") as string) || "1", 10)));
    const advance = Math.max(0, Math.min(100_000_000, parseFloat((formData.get("advance") as string) || "0")));
    const specialRequest = sanitizeText(formData.get("special_request")) || null;

    if (!roomId) {
      throw new Error("Please select a room.");
    }
    if (!name || !mobile) {
      throw new Error("Guest name and mobile number are required.");
    }
    if (!/^\+?[0-9]{10,15}$/.test(mobile)) {
      throw new Error("Please enter a valid mobile number (10 to 15 digits).");
    }
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      throw new Error("Check-out date must be after check-in date.");
    }

    // 1. Create or Find Customer
    let customerId = "";
    const { data: existingCustomer } = await (serverSupabase as any)
      .from("customers")
      .select("id, visits")
      .eq("lodge_id", tenantCtx.lodgeId)
      .eq("mobile", mobile)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
      await (serverSupabase as any)
        .from("customers")
        .update({
          visits: (existingCustomer.visits || 1) + 1,
          last_stay: checkIn,
        })
        .eq("id", customerId)
        .eq("lodge_id", tenantCtx.lodgeId);
    } else {
      const { data: newCust, error: custErr } = await (serverSupabase as any)
        .from("customers")
        .insert({
          lodge_id: tenantCtx.lodgeId,
          name,
          mobile,
          email,
          visits: 1,
          last_stay: checkIn,
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

    if (resErr) {
      if (resErr.code === '23P01') {
        throw new Error("This room is already booked for the selected dates. Please choose different dates or another room.");
      }
      throw new Error(`Failed to create reservation: ${resErr.message}`);
    }
    if (!newRes) {
      throw new Error("Failed to create reservation: No data returned.");
    }

    try {
      // 3. Mark room as reserved
      await (serverSupabase as any)
        .from("rooms")
        .update({ status: "reserved" })
        .eq("id", roomId)
        .eq("lodge_id", tenantCtx.lodgeId);

      // 4. Calculate stay totals & create Bill and Payment record
      const { data: roomData } = await (serverSupabase as any)
        .from("rooms")
        .select("rent")
        .eq("id", roomId)
        .eq("lodge_id", tenantCtx.lodgeId)
        .single();

      const rent = Math.max(0, Math.min(10_000_000, Number(roomData?.rent || 0)));
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const diffDays = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / 86400000);
      const nights = Math.max(1, Math.min(365, diffDays));
      const netAmount = Math.round(rent * nights * 100) / 100;
      const advanceAmount = Math.round(Math.min(netAmount, Number(advance) || 0) * 100) / 100;

      const { data: billData, error: billErr } = await (serverSupabase as any)
        .from("bills")
        .insert({
          lodge_id: tenantCtx.lodgeId,
          reservation_id: newRes.id,
          net_amount: netAmount,
          received: advanceAmount,
          balance: Math.max(0, netAmount - advanceAmount),
          payment_status: advanceAmount >= netAmount ? "paid" : advanceAmount > 0 ? "partial" : "unpaid",
        })
        .select("id")
        .single();

      if (billErr) {
        throw new Error(`Failed to create bill: ${billErr.message}`);
      }

      if (advanceAmount > 0 && billData) {
        await (serverSupabase as any).from("payments").insert({
          lodge_id: tenantCtx.lodgeId,
          bill_id: billData.id,
          amount: advanceAmount,
          method: "Cash",
          paid_at: new Date().toISOString(),
        });
      }
    } catch (postResErr: any) {
      // Rollback reservation on cascade step failure
      await (serverSupabase as any)
        .from("reservations")
        .delete()
        .eq("id", newRes.id)
        .eq("lodge_id", tenantCtx.lodgeId);
      throw postResErr;
    }

    revalidatePath("/reception/reservations");
    revalidatePath("/reception/billing");
    revalidatePath("/reception/rooms");
    revalidatePath("/reception");
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

      <form action={createReservationAction} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
        {/* Customer Information */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">
            Guest Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="guest_name" className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Guest Name *
              </label>
              <input
                id="guest_name"
                name="name"
                required
                placeholder="Full Name"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label htmlFor="guest_mobile" className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Mobile Number *
              </label>
              <input
                id="guest_mobile"
                name="mobile"
                type="tel"
                required
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="guest_email" className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <input
                id="guest_email"
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
              <label htmlFor="select_room" className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Select Room *
              </label>
              {roomList.length === 0 ? (
                <div className="text-sm text-red-600 p-2.5 bg-red-50 rounded-lg border border-red-200">
                  No rooms available. Please add rooms in Admin Portal first.
                </div>
              ) : (
                <select
                  id="select_room"
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
              )}
            </div>
            <div>
              <label htmlFor="guests_count" className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Guests Count
              </label>
              <input
                id="guests_count"
                name="guests"
                type="number"
                min="1"
                defaultValue="1"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label htmlFor="check_in_date" className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Check-in Date *
              </label>
              <input
                id="check_in_date"
                name="check_in"
                type="date"
                required
                defaultValue={todayStr}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label htmlFor="check_out_date" className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Check-out Date *
              </label>
              <input
                id="check_out_date"
                name="check_out"
                type="date"
                required
                defaultValue={tomorrowStr}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label htmlFor="advance_paid" className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Advance Paid (₹)
              </label>
              <input
                id="advance_paid"
                name="advance"
                type="number"
                min="0"
                defaultValue="0"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="special_requests" className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Special Requests
              </label>
              <textarea
                id="special_requests"
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
            disabled={roomList.length === 0}
            className="flex-1 py-2.5 bg-[#0b1437] text-white rounded-xl font-bold text-sm hover:bg-[#162268] transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Reservation
          </button>
        </div>
      </form>
    </div>
  );
}
