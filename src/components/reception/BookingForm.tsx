"use client";

import { useState } from "react";
import { User, Phone, MapPin, Calendar, CreditCard, X, Check } from "lucide-react";
import type { RoomCardData } from "./RoomCard";

interface BookingFormProps {
  room: RoomCardData;
  onClose: () => void;
  onSubmit?: (data: any) => void;
}

export function BookingForm({ room, onClose, onSubmit }: BookingFormProps) {
  const [totalAmount, setTotalAmount] = useState<number>(room.ratePerNight * 2);
  const [advanceAmount, setAdvanceAmount] = useState<number>(1000);
  const balanceDue = Math.max(0, totalAmount - advanceAmount);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-stone-200 bg-stone-50/80 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-stone-900 font-serif">
            New Guest Booking — Room {room.roomNumber}
          </h2>
          <span className="text-xs text-stone-500 font-medium">(Floor {room.floor})</span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Available
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Body */}
      <form
        className="p-6 overflow-y-auto space-y-6 flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          if (onSubmit) onSubmit({});
          onClose();
        }}
      >
        {/* Guest Details */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-lodge-800 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-lodge-700" />
            <span>Guest Details</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Guest Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Anand Sharma"
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-lodge-700 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Mobile Phone Number
              </label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-lodge-700 focus:bg-white transition-colors"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                ID / Home Address
              </label>
              <textarea
                rows={2}
                placeholder="ID number, city, or address..."
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-lodge-700 focus:bg-white transition-colors resize-none"
              />
            </div>
          </div>
        </section>

        {/* Stay Duration */}
        <section className="pt-4 border-t border-stone-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-lodge-800 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-lodge-700" />
            <span>Stay Duration</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Check-In Date &amp; Time
              </label>
              <input
                type="datetime-local"
                defaultValue="2026-08-22T14:00"
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-lodge-700 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Check-Out Date &amp; Time
              </label>
              <input
                type="datetime-local"
                defaultValue="2026-08-24T11:00"
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-lodge-700 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Billing Calculation */}
        <section className="pt-4 border-t border-stone-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-lodge-800 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-lodge-700" />
            <span>Billing Summary</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Total Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2 text-sm font-semibold text-stone-900 focus:outline-none focus:border-lodge-700 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Advance Paid (₹)
              </label>
              <input
                type="number"
                min="0"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2 text-sm font-semibold text-stone-900 focus:outline-none focus:border-lodge-700 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Balance Due (₹)
              </label>
              <div className="w-full bg-lodge-50 border border-lodge-200 rounded-lg px-3.5 py-2 text-sm font-bold text-lodge-800">
                ₹{balanceDue.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-lodge-700 hover:bg-lodge-800 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Confirm &amp; Book Room
          </button>
        </div>
      </form>
    </div>
  );
}
