"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Play, Trash2 } from "lucide-react";
import type { RoomCleaningState, CleaningLogEntry } from "@/lib/housekeeping";
import {
  startCleaningAction,
  markRoomCleanAction,
  bulkMarkCleanAction,
} from "@/app/actions/housekeeping";

// ─── Status badge ─────────────────────────────────────────────────────────────
function CleaningBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    needs_cleaning: { label: "Needs Cleaning", cls: "bg-amber-100 text-amber-800 border-amber-200" },
    in_progress:    { label: "In Progress",    cls: "bg-blue-100 text-blue-800 border-blue-200" },
    clean:          { label: "Clean",           cls: "bg-green-100 text-green-700 border-green-200" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

// ─── Room card ────────────────────────────────────────────────────────────────
function RoomCard({
  room,
  selected,
  onSelect,
}: {
  room: RoomCleaningState;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(room.cleaning_status);
  const [error, setError] = useState("");

  const handleStart = () => {
    startTransition(async () => {
      setError("");
      const res = await startCleaningAction(room.id);
      if (res.success) setLocalStatus("in_progress");
      else setError(res.error ?? "Error");
    });
  };

  const handleDone = () => {
    startTransition(async () => {
      setError("");
      const res = await markRoomCleanAction(room.id);
      if (res.success) setLocalStatus("clean");
      else setError(res.error ?? "Error");
    });
  };

  if (localStatus === "clean") return null; // hide after marked clean

  return (
    <div className={`bg-white rounded-xl border p-4 flex items-center gap-4 transition-all ${selected ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-100"}`}>
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect(room.id)}
        className="w-4 h-4 accent-[#0b1437] cursor-pointer"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-900 text-sm">Room {room.room_number}</span>
          {room.floor != null && (
            <span className="text-xs text-gray-400">Floor {room.floor}</span>
          )}
          <span className="text-xs text-gray-400">{room.room_type}</span>
          <CleaningBadge status={localStatus} />
        </div>
        {room.cleaning_staff_assigned && (
          <p className="text-xs text-gray-500 mt-0.5">Assigned: {room.cleaning_staff_assigned}</p>
        )}
        {room.last_cleaned_at && (
          <p className="text-xs text-gray-400 mt-0.5">
            Last cleaned: {new Date(room.last_cleaned_at).toLocaleString()}
          </p>
        )}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        {localStatus === "needs_cleaning" && (
          <button
            onClick={handleStart}
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            Start
          </button>
        )}
        {(localStatus === "in_progress" || localStatus === "needs_cleaning") && (
          <button
            onClick={handleDone}
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            Mark Clean
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────
export function HousekeepingClient({
  rooms,
  log,
}: {
  rooms: RoomCleaningState[];
  log: CleaningLogEntry[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkPending, startBulkTransition] = useTransition();
  const [bulkError, setBulkError] = useState("");
  const [activeTab, setActiveTab] = useState<"queue" | "log">("queue");

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === rooms.length) setSelected(new Set());
    else setSelected(new Set(rooms.map((r) => r.id)));
  };

  const handleBulkClean = () => {
    if (!selected.size) return;
    startBulkTransition(async () => {
      setBulkError("");
      const res = await bulkMarkCleanAction(Array.from(selected));
      if (res.success) setSelected(new Set());
      else setBulkError(res.error ?? "Bulk action failed");
    });
  };

  const queueCount = rooms.length;
  const inProgressCount = rooms.filter((r) => r.cleaning_status === "in_progress").length;

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "In Queue", value: queueCount, color: "text-amber-600" },
          { label: "In Progress", value: inProgressCount, color: "text-blue-600" },
          { label: "Logged Today", value: log.filter((e) => e.completed_at && new Date(e.completed_at).toDateString() === new Date().toDateString()).length, color: "text-green-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["queue", "log"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold transition-colors capitalize ${
              activeTab === tab
                ? "border-b-2 border-[#0b1437] text-[#0b1437]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "queue" ? `Cleaning Queue (${queueCount})` : `History (${log.length})`}
          </button>
        ))}
      </div>

      {/* Cleaning Queue */}
      {activeTab === "queue" && (
        <div className="space-y-3">
          {rooms.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
              <p className="font-semibold text-gray-600">All rooms are clean!</p>
              <p className="text-sm mt-1">No rooms currently need cleaning.</p>
            </div>
          ) : (
            <>
              {/* Bulk action bar */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selected.size > 0 && selected.size === rooms.length}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-[#0b1437]"
                  />
                  Select all ({rooms.length})
                </label>
                {selected.size > 0 && (
                  <button
                    onClick={handleBulkClean}
                    disabled={bulkPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {bulkPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    Mark {selected.size} Clean
                  </button>
                )}
              </div>
              {bulkError && (
                <p className="text-sm text-red-600 px-1">{bulkError}</p>
              )}
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  selected={selected.has(room.id)}
                  onSelect={toggleSelect}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Cleaning Log */}
      {activeTab === "log" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {log.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No cleaning history yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Room", "Cleaned By", "Started", "Completed", "Duration", "Notes"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {log.map((entry) => {
                  const duration =
                    entry.started_at && entry.completed_at
                      ? Math.round(
                          (new Date(entry.completed_at).getTime() -
                            new Date(entry.started_at).getTime()) /
                            60000
                        ) + " min"
                      : "—";
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {entry.room?.room_number ? `Room ${entry.room.room_number}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{entry.cleaned_by_name || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {entry.started_at ? new Date(entry.started_at).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {entry.completed_at ? new Date(entry.completed_at).toLocaleString() : (
                          <span className="text-blue-500 font-medium">In progress</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{duration}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">
                        {entry.notes || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

