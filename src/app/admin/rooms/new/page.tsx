import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";

export default async function AddRoomPage() {
  const tenant = await getTenantContext();

  async function createRoomAction(formData: FormData) {
    "use server";
    const tenantCtx = await getTenantContext();
    const serverSupabase = await createClient();

    const roomNumber = (formData.get("roomNumber") as string)?.trim();
    const floor = Number(formData.get("floor")) || null;
    const roomType = (formData.get("roomType") as string) || "AC";
    const bedType = (formData.get("bedType") as string) || "Double Bed";
    const capacity = Number(formData.get("capacity")) || 2;
    const rent = Number(formData.get("rent")) || 1500;
    const extraPerson = Number(formData.get("extraPerson")) || 0;
    const extraBed = Number(formData.get("extraBed")) || 0;
    const status = (formData.get("status") as string) || "available";

    // Gather amenities
    const amenities = formData.getAll("amenities") as string[];

    if (!roomNumber) {
      throw new Error("Room number is required");
    }

    const { error } = await (serverSupabase as any).from("rooms").insert({
      lodge_id: tenantCtx.lodgeId,
      room_number: roomNumber,
      floor: floor,
      room_type: roomType,
      bed_type: bedType,
      capacity: capacity,
      rent: rent,
      extra_person_charge: extraPerson,
      extra_bed_charge: extraBed,
      status: status,
      amenities: amenities,
    });

    if (error) {
      throw new Error(`Failed to create room: ${error.message}`);
    }

    redirect("/admin/rooms");
  }

  const ALL_AMENITIES = [
    "Wi-Fi",
    "TV",
    "Attached Bathroom",
    "Hot Water",
    "AC",
    "Parking",
    "Balcony",
    "Refrigerator",
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/rooms"
          className="text-gray-400 hover:text-gray-700 text-sm font-medium transition-colors"
        >
          ← Back to Rooms
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="font-display text-[22px] font-bold text-gray-900">
          Add New Room — {tenant.lodgeName}
        </h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-xs">
        <form action={createRoomAction} className="space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="font-display font-semibold text-gray-800 mb-3.5 pb-2 border-b border-gray-100 text-sm">
              Basic Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">
                  Room Number *
                </label>
                <input
                  type="text"
                  name="roomNumber"
                  required
                  placeholder="e.g. 101, 204"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">
                  Floor
                </label>
                <input
                  type="number"
                  name="floor"
                  placeholder="e.g. 1, 2, 3"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h2 className="font-display font-semibold text-gray-800 mb-3.5 pb-2 border-b border-gray-100 text-sm">
              Pricing Details
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">
                  Rent / Night (₹) *
                </label>
                <input
                  type="number"
                  name="rent"
                  required
                  defaultValue={1500}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">
                  Extra Person (₹)
                </label>
                <input
                  type="number"
                  name="extraPerson"
                  defaultValue={300}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">
                  Extra Bed (₹)
                </label>
                <input
                  type="number"
                  name="extraBed"
                  defaultValue={500}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Room Configuration */}
          <div>
            <h2 className="font-display font-semibold text-gray-800 mb-3.5 pb-2 border-b border-gray-100 text-sm">
              Configuration & Capacity
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">
                  Room Type
                </label>
                <select
                  name="roomType"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-800"
                >
                  <option value="AC">AC</option>
                  <option value="Non-AC">Non-AC</option>
                  <option value="Deluxe">Deluxe</option>
                  <option value="Suite">Suite</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">
                  Bed Type
                </label>
                <select
                  name="bedType"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-800"
                >
                  <option value="Single Bed">Single Bed</option>
                  <option value="Double Bed">Double Bed</option>
                  <option value="Triple Bed">Triple Bed</option>
                  <option value="King Bed">King Bed</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">
                  Capacity (Persons)
                </label>
                <input
                  type="number"
                  name="capacity"
                  defaultValue={2}
                  min={1}
                  max={10}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h2 className="font-display font-semibold text-gray-800 mb-3.5 pb-2 border-b border-gray-100 text-sm">
              Amenities
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ALL_AMENITIES.map((am) => (
                <label
                  key={am}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 text-xs text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    name="amenities"
                    value={am}
                    defaultChecked={["Wi-Fi", "TV", "Attached Bathroom"].includes(am)}
                    className="accent-[#0b1437] rounded"
                  />
                  <span>{am}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Initial Status */}
          <div>
            <h2 className="font-display font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100 text-sm">
              Initial Status
            </h2>
            <div className="flex gap-4">
              {(["available", "cleaning", "maintenance"] as const).map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 capitalize">
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    defaultChecked={s === "available"}
                    className="accent-[#0b1437]"
                  />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Link
              href="/admin/rooms"
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 text-center text-sm transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#0b1437] text-white rounded-xl font-bold hover:bg-[#162268] text-sm transition-colors shadow-xs"
            >
              Save Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

