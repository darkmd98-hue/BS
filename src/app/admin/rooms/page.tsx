import Link from "next/link";
import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { revalidatePath } from "next/cache";

export default async function AdminRoomsPage() {
  const tenant = await getTenantContext();
  const supabase = await createClient();

  // Fetch Rooms scoped strictly to tenant.lodgeId
  const { data: rooms } = await (supabase as any)
    .from("rooms")
    .select("*")
    .eq("lodge_id", tenant.lodgeId)
    .order("room_number", { ascending: true });

  const roomList: any[] = rooms || [];

  // Server action to delete room
  async function deleteRoomAction(formData: FormData) {
    "use server";
    const tenantCtx = await getTenantContext();
    if (tenantCtx.role !== 'admin') {
      throw new Error('Unauthorized');
    }
    const serverSupabase = await createClient();
    const roomId = formData.get("roomId") as string;

    if (!roomId) return;

    const { error } = await (serverSupabase as any)
      .from("rooms")
      .delete()
      .eq("id", roomId)
      .eq("lodge_id", tenantCtx.lodgeId);

    if (error) {
      if (error.code === '23503') {
        // FK violation — soft-fail
        return; // silently fail, room stays
      }
      console.error('Delete room error:', error.message);
      return;
    }

    revalidatePath("/admin/rooms");
  }

  // Server action to toggle maintenance/cleaning/available status
  async function updateRoomStatusAction(formData: FormData) {
    "use server";
    const tenantCtx = await getTenantContext();
    if (tenantCtx.role !== 'admin') {
      throw new Error('Unauthorized');
    }
    const serverSupabase = await createClient();
    const roomId = formData.get("roomId") as string;
    const newStatus = formData.get("status") as string;

    if (!roomId || !newStatus) return;

    const { error } = await (serverSupabase as any)
      .from("rooms")
      .update({ status: newStatus })
      .eq("id", roomId)
      .eq("lodge_id", tenantCtx.lodgeId);

    if (error) {
      console.error('Update room status error:', error.message);
      return;
    }

    revalidatePath("/admin/rooms");
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-sans text-[26px] font-bold text-gray-900">Room Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            {roomList.length} rooms configured for <span className="font-semibold text-gray-800">{tenant.lodgeName}</span>
          </p>
        </div>
        <Link
          href="/admin/rooms/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0b1437] text-white rounded-lg text-sm font-semibold hover:bg-[#162268] transition-colors shadow-sm"
        >
          + Add Room
        </Link>
      </div>

      {/* Rooms Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Room No.</th>
                <th className="px-4 py-3.5">Floor</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Bed Type</th>
                <th className="px-4 py-3.5 text-center">Capacity</th>
                <th className="px-4 py-3.5">Rent / Night</th>
                <th className="px-4 py-3.5">Extra Person</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {roomList.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/reception/rooms/${r.id}`}
                      className="font-sans font-bold text-gray-900 text-[15px] hover:text-blue-600 transition-colors"
                    >
                      Room {r.room_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 font-medium">
                    {r.floor ? `Floor ${r.floor}` : "Ground"}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                        r.room_type === "AC"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {r.room_type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">{r.bed_type}</td>
                  <td className="px-4 py-3.5 text-center text-gray-600 font-semibold">
                    {r.capacity} guests
                  </td>
                  <td className="px-4 py-3.5 font-bold text-gray-900">
                    ₹{Number(r.rent).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3.5 text-gray-500">
                    +₹{Number(r.extra_person_charge || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <form action={updateRoomStatusAction} className="inline-flex items-center gap-1">
                        <input type="hidden" name="roomId" value={r.id} />
                        <select
                          name="status"
                          defaultValue={r.status}
                          aria-label={`Status for room ${r.room_number}`}
                          className="text-xs bg-gray-50 border border-gray-200 rounded px-1.5 py-1 text-gray-700 focus:outline-none focus:border-blue-400"
                        >
                          <option value="available">Available</option>
                          <option value="occupied">Occupied</option>
                          <option value="reserved">Reserved</option>
                          <option value="cleaning">Cleaning</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                        <button
                          type="submit"
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded font-medium transition-colors"
                        >
                          Set
                        </button>
                      </form>
                      <form action={deleteRoomAction} className="inline">
                        <input type="hidden" name="roomId" value={r.id} />
                        <button
                          type="submit"
                          className="px-2 py-1 rounded bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {roomList.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 text-sm">
                    No rooms configured yet for this lodge. Click &quot;+ Add Room&quot; to begin.
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
