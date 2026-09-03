"use client";

import { useState } from "react";
import { Search, Plus, Sparkles, Filter } from "lucide-react";
import { RoomCard, type RoomCardData } from "./RoomCard";
import { BookingPanel } from "./BookingPanel";

const MOCK_ROOMS: RoomCardData[] = [
  // First Floor
  { id: "101", roomNumber: "101", floor: 1, type: "King Suite", status: "available", ratePerNight: 2500 },
  {
    id: "102",
    roomNumber: "102",
    floor: 1,
    type: "Deluxe Double",
    status: "booked",
    ratePerNight: 2200,
    guestName: "Anand Sharma",
    guestPhone: "+91 98765 43210",
    checkIn: "Aug 21, 2:00 PM",
    checkOut: "Aug 23, 11:00 AM",
    advanceAmount: 2000,
    totalAmount: 5000,
  },
  {
    id: "103",
    roomNumber: "103",
    floor: 1,
    type: "Standard Single",
    status: "booked",
    ratePerNight: 1500,
    guestName: "Priya Rao",
    guestPhone: "+91 98450 11223",
    checkIn: "Aug 22, 1:00 PM",
    checkOut: "Aug 24, 10:00 AM",
    advanceAmount: 1500,
    totalAmount: 3000,
  },
  { id: "104", roomNumber: "104", floor: 1, type: "Deluxe Double", status: "available", ratePerNight: 2200 },
  // Second Floor
  {
    id: "201",
    roomNumber: "201",
    floor: 2,
    type: "Family Cottage",
    status: "booked",
    ratePerNight: 3500,
    guestName: "Vikram Mehta",
    guestPhone: "+91 99123 44556",
    checkIn: "Aug 20, 3:00 PM",
    checkOut: "Aug 25, 11:00 AM",
    advanceAmount: 4000,
    totalAmount: 9000,
  },
  { id: "202", roomNumber: "202", floor: 2, type: "Executive Suite", status: "available", ratePerNight: 3000 },
  { id: "203", roomNumber: "203", floor: 2, type: "Standard Single", status: "maintenance", ratePerNight: 1500 },
  { id: "204", roomNumber: "204", floor: 2, type: "King Suite", status: "available", ratePerNight: 2500 },
];

export function RoomGrid() {
  const [rooms, setRooms] = useState<RoomCardData[]>(MOCK_ROOMS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "available" | "booked" | "maintenance">("all");
  const [selectedRoom, setSelectedRoom] = useState<RoomCardData | null>(null);

  const availableCount = rooms.filter((r) => r.status === "available").length;
  const bookedCount = rooms.filter((r) => r.status === "booked").length;
  const maintenanceCount = rooms.filter((r) => r.status === "maintenance").length;

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.guestName && r.guestName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = activeFilter === "all" || r.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const floor1Rooms = filteredRooms.filter((r) => r.floor === 1);
  const floor2Rooms = filteredRooms.filter((r) => r.floor === 2);

  return (
    <div className="space-y-6">
      {/* Top Controls & Status Pill Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search room or guest..."
              className="pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-lodge-700 w-60 bg-stone-50"
            />
          </div>

          <div className="flex items-center gap-1.5 pl-2 border-l border-stone-200">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeFilter === "all"
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              All ({rooms.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("available")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeFilter === "available"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Available ({availableCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("booked")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeFilter === "booked"
                  ? "bg-rose-600 text-white"
                  : "bg-rose-50 text-rose-800 border border-rose-200/80 hover:bg-rose-100"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Booked ({bookedCount})</span>
            </button>
            {maintenanceCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter("maintenance")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeFilter === "maintenance"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Maintenance ({maintenanceCount})</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const firstAvail = rooms.find((r) => r.status === "available");
              if (firstAvail) setSelectedRoom(firstAvail);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-lodge-700 hover:bg-lodge-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Walk-in Booking</span>
          </button>
        </div>
      </div>

      {/* Floor 1 Section */}
      {floor1Rooms.length > 0 && (
        <section className="space-y-3">
          <div className="border-b border-stone-200 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">
              First Floor Wing
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {floor1Rooms.map((room) => (
              <RoomCard key={room.id} room={room} onClick={setSelectedRoom} />
            ))}
          </div>
        </section>
      )}

      {/* Floor 2 Section */}
      {floor2Rooms.length > 0 && (
        <section className="space-y-3 pt-2">
          <div className="border-b border-stone-200 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">
              Second Floor Wing
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {floor2Rooms.map((room) => (
              <RoomCard key={room.id} room={room} onClick={setSelectedRoom} />
            ))}
          </div>
        </section>
      )}

      {/* Booking Panel Modal */}
      {selectedRoom && (
        <BookingPanel
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onCheckOut={(r) => {
            setRooms((prev) =>
              prev.map((item) =>
                item.id === r.id ? { ...item, status: "available", guestName: undefined } : item
              )
            );
          }}
        />
      )}
    </div>
  );
}
