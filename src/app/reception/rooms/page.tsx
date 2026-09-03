import React from "react";
import Link from "next/link";
import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { RoomGrid } from "@/components/reception/RoomGrid";

export default async function ReceptionRoomsPage() {
  const tenant = await getTenantContext();
  const supabase = await createClient();

  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .eq("lodge_id", tenant.lodgeId)
    .order("room_number", { ascending: true });

  const roomList: any[] = (rooms as any[]) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Room Booking & Status</h1>
          <p className="text-gray-500 text-sm mt-1">
            Realtime room inventory for <span className="font-semibold text-gray-800">{tenant.lodgeName}</span> ({roomList.length} rooms total).
          </p>
        </div>
        <Link
          href="/reception/reservations/new"
          className="px-4 py-2 bg-[#0b1437] text-white rounded-lg text-sm font-semibold hover:bg-[#162268] transition-colors shadow-xs"
        >
          + New Walk-in / Booking
        </Link>
      </div>

      <RoomGrid rooms={roomList} />
    </div>
  );
}
