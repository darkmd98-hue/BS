"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, LogIn, LogOut, BedDouble } from "lucide-react";

interface DayData {
  dayNumber: number;
  isCurrentMonth: boolean;
  occupancyPercent?: number;
  checkInsCount?: number;
  checkOutsCount?: number;
  bookings?: { guestName: string; roomNumber: string; status: "active" | "departing" }[];
}

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState("August 2026");

  // Sample days for August 2026
  const days: DayData[] = [
    { dayNumber: 26, isCurrentMonth: false },
    { dayNumber: 27, isCurrentMonth: false },
    { dayNumber: 28, isCurrentMonth: false },
    { dayNumber: 29, isCurrentMonth: false },
    { dayNumber: 30, isCurrentMonth: false },
    { dayNumber: 31, isCurrentMonth: false },
    { dayNumber: 1, isCurrentMonth: true, occupancyPercent: 60, checkInsCount: 2 },
    { dayNumber: 2, isCurrentMonth: true, occupancyPercent: 70, checkInsCount: 3, checkOutsCount: 1 },
    { dayNumber: 3, isCurrentMonth: true, occupancyPercent: 85, checkInsCount: 4 },
    { dayNumber: 4, isCurrentMonth: true, occupancyPercent: 80, checkOutsCount: 2 },
    { dayNumber: 5, isCurrentMonth: true, occupancyPercent: 65 },
    { dayNumber: 6, isCurrentMonth: true, occupancyPercent: 50, checkOutsCount: 3 },
    { dayNumber: 7, isCurrentMonth: true, occupancyPercent: 75, checkInsCount: 5 },
    { dayNumber: 8, isCurrentMonth: true, occupancyPercent: 90, checkInsCount: 2 },
    { dayNumber: 9, isCurrentMonth: true, occupancyPercent: 80, checkOutsCount: 1 },
    { dayNumber: 10, isCurrentMonth: true, occupancyPercent: 70 },
    { dayNumber: 11, isCurrentMonth: true, occupancyPercent: 65 },
    { dayNumber: 12, isCurrentMonth: true, occupancyPercent: 60 },
    { dayNumber: 13, isCurrentMonth: true, occupancyPercent: 75, checkInsCount: 3 },
    { dayNumber: 14, isCurrentMonth: true, occupancyPercent: 85, checkInsCount: 2 },
    { dayNumber: 15, isCurrentMonth: true, occupancyPercent: 95, checkInsCount: 4 },
    { dayNumber: 16, isCurrentMonth: true, occupancyPercent: 85, checkOutsCount: 2 },
    { dayNumber: 17, isCurrentMonth: true, occupancyPercent: 75 },
    { dayNumber: 18, isCurrentMonth: true, occupancyPercent: 70, checkOutsCount: 1 },
    { dayNumber: 19, isCurrentMonth: true, occupancyPercent: 65 },
    { dayNumber: 20, isCurrentMonth: true, occupancyPercent: 78, checkInsCount: 3 },
    { dayNumber: 21, isCurrentMonth: true, occupancyPercent: 82, checkInsCount: 2 },
    {
      dayNumber: 22,
      isCurrentMonth: true,
      occupancyPercent: 78,
      checkInsCount: 3,
      checkOutsCount: 2,
      bookings: [
        { guestName: "Anand Sharma", roomNumber: "102", status: "active" },
        { guestName: "Priya Rao", roomNumber: "103", status: "active" },
      ],
    },
    { dayNumber: 23, isCurrentMonth: true, occupancyPercent: 70, checkOutsCount: 2 },
    { dayNumber: 24, isCurrentMonth: true, occupancyPercent: 60, checkOutsCount: 1 },
    { dayNumber: 25, isCurrentMonth: true, occupancyPercent: 55, checkOutsCount: 1 },
    { dayNumber: 26, isCurrentMonth: true, occupancyPercent: 65, checkInsCount: 2 },
    { dayNumber: 27, isCurrentMonth: true, occupancyPercent: 70, checkInsCount: 1 },
    { dayNumber: 28, isCurrentMonth: true, occupancyPercent: 85, checkInsCount: 4 },
    { dayNumber: 29, isCurrentMonth: true, occupancyPercent: 90, checkInsCount: 2 },
    { dayNumber: 30, isCurrentMonth: true, occupancyPercent: 80, checkOutsCount: 3 },
    { dayNumber: 31, isCurrentMonth: true, occupancyPercent: 65, checkOutsCount: 2 },
  ];

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-bold text-stone-900 font-serif min-w-[140px] text-center">
              {currentMonth}
            </h2>
            <button
              type="button"
              className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs text-stone-500 pl-3 border-l border-stone-200">
            Scoped to: Hill View Heritage Lodge
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-stone-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Check-in</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Check-out</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-lodge-700" />
            <span>High Occupancy</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Calendar + Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-stone-500 uppercase tracking-wider mb-2">
            {weekdays.map((day) => (
              <div key={day} className="py-1.5">
                {day}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day, idx) => {
              const isToday = day.isCurrentMonth && day.dayNumber === 22;
              return (
                <div
                  key={idx}
                  className={`min-h-[78px] p-2 rounded-xl border text-xs flex flex-col justify-between transition-all select-none ${
                    !day.isCurrentMonth
                      ? "bg-stone-50/50 border-stone-100 text-stone-300"
                      : isToday
                      ? "bg-lodge-50/70 border-lodge-600 ring-1 ring-lodge-600"
                      : "bg-white border-stone-200/80 hover:border-stone-400"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-bold ${
                        isToday
                          ? "w-5 h-5 rounded-full bg-lodge-700 text-white flex items-center justify-center text-[10px]"
                          : day.isCurrentMonth
                          ? "text-stone-900"
                          : "text-stone-300"
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {day.occupancyPercent && (
                      <span className="text-[10px] text-stone-400 font-medium">
                        {day.occupancyPercent}%
                      </span>
                    )}
                  </div>

                  {/* Indicators */}
                  <div className="space-y-1 mt-1">
                    {day.checkInsCount && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">{day.checkInsCount} in</span>
                      </div>
                    )}
                    {day.checkOutsCount && (
                      <div className="flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50 px-1 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        <span className="truncate">{day.checkOutsCount} out</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Today's Arrivals / Departures (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Arrivals Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2 border-b border-stone-100 pb-2.5">
              <LogIn className="w-4 h-4 text-emerald-600" />
              <span>Today&apos;s Expected Arrivals (3)</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-stone-900">Dr. Rajesh Iyer</p>
                  <p className="text-[11px] text-stone-400">Room 101 &bull; 2 Nights</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  2:00 PM
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-stone-900">Pooja Hegde</p>
                  <p className="text-[11px] text-stone-400">Room 104 &bull; 1 Night</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  4:30 PM
                </span>
              </div>
            </div>
          </div>

          {/* Departures Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-2 border-b border-stone-100 pb-2.5">
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Today&apos;s Departures (2)</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-stone-900">Anand Sharma</p>
                  <p className="text-[11px] text-stone-400">Room 102 &bull; Due: ₹3,000</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                  11:00 AM
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
