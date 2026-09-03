"use client";

import { useState } from "react";
import { BookOpen, Search, Filter, Calendar, User, CreditCard } from "lucide-react";

interface BookingLogItem {
  id: string;
  bookingRef: string;
  roomNumber: string;
  guestName: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  status: "active" | "checked_out" | "cancelled";
  totalAmount: number;
  advanceAmount: number;
  paymentStatus: "settled" | "partial" | "pending";
}

const MOCK_BOOKINGS: BookingLogItem[] = [
  {
    id: "1",
    bookingRef: "BK-8821",
    roomNumber: "201",
    guestName: "Vikram Mehta",
    phone: "+91 99123 44556",
    checkIn: "2026-08-20",
    checkOut: "2026-08-25",
    status: "active",
    totalAmount: 9000,
    advanceAmount: 4000,
    paymentStatus: "partial",
  },
  {
    id: "2",
    bookingRef: "BK-8820",
    roomNumber: "102",
    guestName: "Anand Sharma",
    phone: "+91 98765 43210",
    checkIn: "2026-08-21",
    checkOut: "2026-08-23",
    status: "active",
    totalAmount: 5000,
    advanceAmount: 2000,
    paymentStatus: "partial",
  },
  {
    id: "3",
    bookingRef: "BK-8819",
    roomNumber: "103",
    guestName: "Priya Rao",
    phone: "+91 98450 11223",
    checkIn: "2026-08-22",
    checkOut: "2026-08-24",
    status: "active",
    totalAmount: 3000,
    advanceAmount: 1500,
    paymentStatus: "partial",
  },
  {
    id: "4",
    bookingRef: "BK-8815",
    roomNumber: "101",
    guestName: "Sunil Hegde",
    phone: "+91 97412 33445",
    checkIn: "2026-08-18",
    checkOut: "2026-08-20",
    status: "checked_out",
    totalAmount: 4500,
    advanceAmount: 4500,
    paymentStatus: "settled",
  },
];

export default function ReceptionBookingsPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_BOOKINGS.filter(
    (b) =>
      b.guestName.toLowerCase().includes(search.toLowerCase()) ||
      b.roomNumber.includes(search) ||
      b.bookingRef.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 font-serif">Lodge Bookings Log</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Complete record of active, upcoming, and checked-out stays for this property.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking ref, guest, room..."
            className="pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-lodge-700 w-64 bg-stone-50"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 uppercase tracking-wider">
                <th className="py-3.5 px-5 font-semibold">Ref #</th>
                <th className="py-3.5 px-5 font-semibold">Room</th>
                <th className="py-3.5 px-5 font-semibold">Guest</th>
                <th className="py-3.5 px-5 font-semibold">Stay Dates</th>
                <th className="py-3.5 px-5 font-semibold">Status</th>
                <th className="py-3.5 px-5 font-semibold">Total Bill</th>
                <th className="py-3.5 px-5 font-semibold">Balance Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filtered.map((b) => {
                const balance = Math.max(0, b.totalAmount - b.advanceAmount);
                return (
                  <tr key={b.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-stone-900">{b.bookingRef}</td>
                    <td className="py-3.5 px-5 font-bold text-lodge-800">Room {b.roomNumber}</td>
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-stone-900">{b.guestName}</p>
                      <p className="text-[11px] text-stone-400">{b.phone}</p>
                    </td>
                    <td className="py-3.5 px-5 text-stone-600">
                      {b.checkIn} &rarr; {b.checkOut}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          b.status === "active"
                            ? "bg-rose-100 text-rose-800"
                            : b.status === "checked_out"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-stone-900">
                      ₹{b.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-lodge-800">
                      ₹{balance.toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
