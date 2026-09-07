"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge, RoomStatus } from "@/components/shared/StatusBadge";
import type { Room } from "@/types/database";

const fmt = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const STATUS_CFG: Record<string, { bar: string }> = {
  available:   { bar: "bg-emerald-500" },
  occupied:    { bar: "bg-red-500" },
  reserved:    { bar: "bg-amber-400" },
  cleaning:    { bar: "bg-sky-500" },
  maintenance: { bar: "bg-slate-400" },
};

export function RoomCard({ room }: { room: Room }) {
  const cfg = STATUS_CFG[room.status] || STATUS_CFG.available;

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group overflow-hidden flex flex-col">
      <div className={`h-1.5 ${cfg.bar}`} />
      <div className="p-3.5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2.5">
          <div>
            <div className="font-bold text-[22px] text-gray-900 leading-none group-hover:text-[#0b1437] transition-colors">
              {room.room_number}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Floor {room.floor ?? 1}</div>
          </div>
          <StatusBadge status={room.status as RoomStatus} />
        </div>

        <div className="space-y-1 mb-3 flex-1 text-[12px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <span>🌡</span>
            <span>{room.room_type} · {room.bed_type} Bed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>👤</span>
            <span>{room.capacity} Guest{room.capacity > 1 ? "s" : ""} max</span>
          </div>
        </div>

        {room.cleaning_staff && (
          <div className="bg-sky-50 rounded-lg p-2 mb-2.5 text-[11px] border border-sky-100">
            <div className="font-semibold text-sky-800">Cleaning Staff</div>
            <div className="text-sky-600 mt-0.5 truncate">{room.cleaning_staff}</div>
          </div>
        )}

        {room.maintenance_issue && (
          <div className="bg-slate-100 rounded-lg p-2 mb-2.5 text-[11px] border border-slate-200">
            <div className="font-semibold text-slate-700 truncate">{room.maintenance_issue}</div>
            {room.maintenance_priority && (
              <div className="text-slate-500 mt-0.5">Priority: {room.maintenance_priority}</div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <div>
            <span className="font-bold text-[#0b1437] text-[15px]">{fmt(Number(room.rent))}</span>
            <span className="text-[10px] text-gray-400">/night</span>
          </div>
          <Link
            href={`/reception/rooms/${room.id}`}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
              room.status === "available"
                ? "bg-[#0b1437] text-white hover:bg-[#162268]"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {room.status === "available" ? "Book Now" : "Details"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function RoomGrid({ rooms }: { rooms: Room[] }) {
  const [statusF, setStatusF] = useState<string>("all");
  const [typeF, setTypeF] = useState<string>("all");
  const [q, setQ] = useState("");

  const visible = rooms.filter((r) => {
    if (statusF !== "all" && r.status !== statusF) return false;
    if (typeF !== "all" && r.room_type !== typeF) return false;
    if (q && !r.room_number.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const counts: Record<string, number> = { all: rooms.length };
  rooms.forEach((r) => {
    counts[r.status] = (counts[r.status] || 0) + 1;
  });

  return (
    <div className="space-y-5">
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap gap-2.5 items-center">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Room number..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white w-48 text-gray-800"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-0.5 bg-gray-100/80 rounded-lg p-1 border border-gray-200">
          {["all", "available", "occupied", "reserved", "cleaning", "maintenance"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusF(f)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                statusF === f
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f === "all" ? `All (${counts.all || 0})` : `${f} (${counts[f] || 0})`}
            </button>
          ))}
        </div>

        {/* Room Type Tabs */}
        <div className="flex gap-0.5 bg-gray-100/80 rounded-lg p-1 border border-gray-200">
          {["all", "AC", "Non-AC", "Suite"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeF(t)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                typeF === t
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of rooms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
        {visible.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
        {visible.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-gray-100">
            <div className="text-4xl mb-3">🏨</div>
            <div className="text-gray-700 font-semibold text-base">No rooms match your filter</div>
            <button
              onClick={() => {
                setStatusF("all");
                setTypeF("all");
                setQ("");
              }}
              className="mt-3 text-blue-600 text-xs font-semibold hover:text-blue-800"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

