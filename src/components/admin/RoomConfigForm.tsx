"use client";

import { useState } from "react";
import { BedDouble, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, X } from "lucide-react";
import type { RoomStatus } from "@/types/database";

interface ConfigRoom {
  id: string;
  roomNumber: string;
  floor: number;
  type: string;
  ratePerNight: number;
  status: RoomStatus;
}

const INITIAL_ROOM_INVENTORY: ConfigRoom[] = [
  { id: "1", roomNumber: "101", floor: 1, type: "King Suite", ratePerNight: 2500, status: "available" },
  { id: "2", roomNumber: "102", floor: 1, type: "Deluxe Double", ratePerNight: 2200, status: "booked" },
  { id: "3", roomNumber: "103", floor: 1, type: "Standard Single", ratePerNight: 1500, status: "booked" },
  { id: "4", roomNumber: "104", floor: 1, type: "Deluxe Double", ratePerNight: 2200, status: "available" },
  { id: "5", roomNumber: "201", floor: 2, type: "Family Cottage", ratePerNight: 3500, status: "booked" },
  { id: "6", roomNumber: "202", floor: 2, type: "Executive Suite", ratePerNight: 3000, status: "available" },
  { id: "7", roomNumber: "203", floor: 2, type: "Standard Single", ratePerNight: 1500, status: "maintenance" },
  { id: "8", roomNumber: "204", floor: 2, type: "King Suite", ratePerNight: 2500, status: "available" },
];

export function RoomConfigForm() {
  const [rooms, setRooms] = useState<ConfigRoom[]>(INITIAL_ROOM_INVENTORY);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newFloor, setNewFloor] = useState(1);
  const [newType, setNewType] = useState("Deluxe Double");
  const [newRate, setNewRate] = useState(2000);

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim()) return;

    const newRoom: ConfigRoom = {
      id: Date.now().toString(),
      roomNumber: newRoomNumber.trim(),
      floor: newFloor,
      type: newType,
      ratePerNight: newRate,
      status: "available",
    };

    setRooms((prev) => [...prev, newRoom]);
    setNewRoomNumber("");
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-serif">Room Inventory Configuration</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage room numbers, types, nightly rates, and floor arrangements for this lodge.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-lodge-700 hover:bg-lodge-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Room</span>
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 uppercase tracking-wider">
                <th className="py-3.5 px-5 font-semibold">Room Number</th>
                <th className="py-3.5 px-5 font-semibold">Category / Type</th>
                <th className="py-3.5 px-5 font-semibold">Floor</th>
                <th className="py-3.5 px-5 font-semibold">Nightly Rate</th>
                <th className="py-3.5 px-5 font-semibold">Status</th>
                <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {rooms.map((r) => (
                <tr key={r.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-stone-900 text-sm">
                    {r.roomNumber}
                  </td>
                  <td className="py-3.5 px-5 font-medium">{r.type}</td>
                  <td className="py-3.5 px-5 text-stone-500">Floor {r.floor}</td>
                  <td className="py-3.5 px-5 font-bold text-stone-900">
                    ₹{r.ratePerNight.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        r.status === "available"
                          ? "bg-emerald-100 text-emerald-800"
                          : r.status === "booked"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Edit room"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRooms((prev) => prev.filter((item) => item.id !== r.id))}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete room"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Room Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-lg font-bold text-stone-900 font-serif">Add New Room</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleAddRoom}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Room Number
                </label>
                <input
                  type="text"
                  required
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  placeholder="e.g. 301"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-lodge-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Floor Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newFloor}
                    onChange={(e) => setNewFloor(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-lodge-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Nightly Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newRate}
                    onChange={(e) => setNewRate(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-lodge-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Room Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-lodge-700"
                >
                  <option value="King Suite">King Suite</option>
                  <option value="Executive Suite">Executive Suite</option>
                  <option value="Deluxe Double">Deluxe Double</option>
                  <option value="Standard Single">Standard Single</option>
                  <option value="Family Cottage">Family Cottage</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-lodge-700 hover:bg-lodge-800 text-white text-xs font-semibold shadow-sm cursor-pointer"
                >
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
