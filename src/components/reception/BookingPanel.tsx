"use client";

import { User, Phone, MapPin, Calendar, CreditCard, X, Edit, LogOut, CheckCircle2, AlertCircle } from "lucide-react";
import { BookingForm } from "./BookingForm";
import type { RoomCardData } from "./RoomCard";

interface BookingPanelProps {
  room: RoomCardData;
  onClose: () => void;
  onCheckOut?: (room: RoomCardData) => void;
}

export function BookingPanel({ room, onClose, onCheckOut }: BookingPanelProps) {
  const isAvailable = room.status === "available";

  if (isAvailable) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl rounded-2xl border border-stone-200">
          <BookingForm room={room} onClose={onClose} />
        </div>
      </div>
    );
  }

  // Occupied Room State (Converted from 05-booking-panel-occupied-room.html)
  const total = room.totalAmount || 5000;
  const advance = room.advanceAmount || 2000;
  const balance = Math.max(0, total - advance);

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-stone-200 bg-stone-50/80">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-stone-900 font-serif">
                Room {room.roomNumber}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold uppercase tracking-wider border border-rose-200">
                Occupied
              </span>
            </div>
            <p className="text-xs text-stone-600 flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-stone-400" />
              <span>{room.guestName || "Anand Sharma"}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Guest Profile Card */}
            <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-lodge-800 flex items-center gap-2 border-b border-stone-100 pb-2.5">
                <User className="w-4 h-4 text-lodge-700" />
                <span>Guest Details</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-stone-400 block text-[11px]">Full Name</span>
                  <span className="font-bold text-stone-900 text-sm">{room.guestName || "Anand Sharma"}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-stone-400 block text-[11px]">Phone</span>
                    <span className="font-semibold text-stone-800">{room.guestPhone || "+91 98765 43210"}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[11px]">Address</span>
                    <span className="font-semibold text-stone-800">Bangalore, KA</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-lg border border-stone-100 mt-2">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase">Check-in</span>
                    <span className="font-semibold text-stone-900">{room.checkIn || "Aug 21, 2:00 PM"}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase">Expected Out</span>
                    <span className="font-semibold text-stone-900">{room.checkOut || "Aug 23, 11:00 AM"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-lodge-800 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-lodge-700" />
                    <span>Financial Summary</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Partial Payment
                  </span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-stone-50">
                    <span className="text-stone-500">Total Bill Amount</span>
                    <span className="font-bold text-stone-900">₹{total.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-50">
                    <span className="text-stone-500">Advance Paid</span>
                    <span className="font-semibold text-emerald-700">₹{advance.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-lodge-50/70 px-3 rounded-lg border border-lodge-100 mt-2">
                    <span className="font-bold text-lodge-900">Balance Due</span>
                    <span className="font-extrabold text-lodge-900 text-sm">
                      ₹{balance.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Booking</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                if (onCheckOut) onCheckOut(room);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-lodge-700 hover:bg-lodge-800 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Check Out &amp; Settle Balance</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
