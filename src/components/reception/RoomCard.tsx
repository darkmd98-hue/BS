"use client";

import { CheckCircle2, AlertCircle, Wrench, User, Calendar } from "lucide-react";
import type { RoomStatus } from "@/types/database";

export interface RoomCardData {
  id: string;
  roomNumber: string;
  floor: number;
  type: string;
  status: RoomStatus;
  ratePerNight: number;
  guestName?: string;
  guestPhone?: string;
  checkIn?: string;
  checkOut?: string;
  advanceAmount?: number;
  totalAmount?: number;
}

interface RoomCardProps {
  room: RoomCardData;
  onClick: (room: RoomCardData) => void;
}

export function RoomCard({ room, onClick }: RoomCardProps) {
  const isAvailable = room.status === "available";
  const isBooked = room.status === "booked";
  const isMaintenance = room.status === "maintenance";

  return (
    <div
      onClick={() => onClick(room)}
      className={`rounded-2xl border transition-all duration-200 cursor-pointer select-none p-5 flex flex-col justify-between h-56 relative overflow-hidden group shadow-xs hover:shadow-md ${
        isAvailable
          ? "bg-white border-emerald-200/80 hover:border-emerald-400 border-l-4 border-l-emerald-500"
          : isBooked
          ? "bg-white border-rose-200/80 hover:border-rose-400 border-l-4 border-l-rose-500"
          : "bg-stone-50 border-amber-200/80 hover:border-amber-400 border-l-4 border-l-amber-500"
      }`}
    >
      {/* Top row: Room number & Status badge */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-2xl font-extrabold text-stone-900 font-serif tracking-tight">
            {room.roomNumber}
          </span>
          <p className="text-xs text-stone-500 font-medium mt-0.5">{room.type}</p>
        </div>

        <span
          className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 ${
            isAvailable
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : isBooked
              ? "bg-rose-50 text-rose-800 border border-rose-200"
              : "bg-amber-50 text-amber-800 border border-amber-200"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isAvailable ? "bg-emerald-500" : isBooked ? "bg-rose-500" : "bg-amber-500"
            }`}
          />
          <span>{room.status}</span>
        </span>
      </div>

      {/* Middle content: Guest details or Booking prompt */}
      <div className="my-auto py-2">
        {isBooked ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-900">
              <User className="w-3.5 h-3.5 text-stone-400" />
              <span className="truncate">{room.guestName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>Out: {room.checkOut}</span>
            </div>
          </div>
        ) : isAvailable ? (
          <div className="text-left">
            <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-100">
              Click to Book &rarr;
            </span>
            <p className="text-[11px] text-stone-400 mt-1">₹{room.ratePerNight} / night</p>
          </div>
        ) : (
          <div className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-amber-600" />
            <span>Under Maintenance</span>
          </div>
        )}
      </div>

      {/* Footer info: Floor and financial state */}
      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
        <span>Floor {room.floor}</span>
        {isBooked && room.totalAmount && (
          <span className="font-bold text-stone-800">
            ₹{room.totalAmount.toLocaleString("en-IN")}
          </span>
        )}
      </div>
    </div>
  );
}
