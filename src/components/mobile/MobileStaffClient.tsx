"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Sparkles,
  Wrench,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  Shield,
  Layers,
  Camera,
  Check,
  Search,
  User,
  ArrowRight,
} from "lucide-react";
import type {
  MobileStaffData,
  MobileRoomTask,
  MobileMaintenanceTicket,
  OfflineSyncItem,
} from "@/types/mobile";
import {
  quickUpdateRoomStatusAction,
  syncMobileTasksAction,
} from "@/app/actions/mobile";

interface MobileStaffClientProps {
  data: MobileStaffData;
}

export function MobileStaffClient({ data }: { data: MobileStaffData }) {
  const { lodgeName, lodgeSubdomain, staffUser, cleaningQueue, maintenanceTickets, metrics } = data;

  const [activeTab, setActiveTab] = useState<"housekeeping" | "maintenance" | "scanner">("housekeeping");
  const [rooms, setRooms] = useState<MobileRoomTask[]>(cleaningQueue);
  const [tickets, setTickets] = useState<MobileMaintenanceTicket[]>(maintenanceTickets);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineSyncItem[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Scanner demo state
  const [scannerCode, setScannerCode] = useState("");
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  // Load offline queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("lodgeos_mobile_offline_queue");
      if (stored) {
        setOfflineQueue(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save offline queue
  const saveQueue = (newQueue: OfflineSyncItem[]) => {
    setOfflineQueue(newQueue);
    try {
      localStorage.setItem("lodgeos_mobile_offline_queue", JSON.stringify(newQueue));
    } catch {
      // ignore
    }
  };

  // Mark room cleaned
  const handleMarkClean = (roomId: string, roomNumber: string) => {
    // Optimistic UI
    setRooms((prev) => prev.filter((r) => r.id !== roomId));

    if (isSimulatedOffline) {
      const offlineItem: OfflineSyncItem = {
        id: "offline-" + Date.now(),
        type: "MARK_ROOM_CLEANED",
        targetId: roomId,
        payload: { roomNumber },
        timestamp: new Date().toISOString(),
      };
      const updated = [...offlineQueue, offlineItem];
      saveQueue(updated);
      setFeedback(`[Offline Queue] Room ${roomNumber} marked clean. Will sync when online.`);
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    const fd = new FormData();
    fd.append("room_id", roomId);
    fd.append("status", "available");

    startTransition(async () => {
      const res = await quickUpdateRoomStatusAction(fd);
      if (res.success) {
        setFeedback(`Room ${roomNumber} cleaned & set to Available!`);
        setTimeout(() => setFeedback(null), 3000);
      }
    });
  };

  // Resolve maintenance ticket
  const handleResolveTicket = (ticketId: string, roomNumber: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));

    if (isSimulatedOffline) {
      const offlineItem: OfflineSyncItem = {
        id: "offline-" + Date.now(),
        type: "RESOLVE_TICKET",
        targetId: ticketId,
        payload: { roomNumber, notes: "Resolved via mobile staff companion" },
        timestamp: new Date().toISOString(),
      };
      const updated = [...offlineQueue, offlineItem];
      saveQueue(updated);
      setFeedback(`[Offline Queue] Maintenance for ${roomNumber} queued for sync.`);
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    setFeedback(`Maintenance for ${roomNumber} marked resolved.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Sync offline queue to server
  const handleSyncOffline = () => {
    if (offlineQueue.length === 0) {
      setFeedback("All mobile tasks are already up to date.");
      setTimeout(() => setFeedback(null), 2500);
      return;
    }

    const fd = new FormData();
    fd.append("items", JSON.stringify(offlineQueue));

    startTransition(async () => {
      const res = await syncMobileTasksAction(fd);
      if (res.success) {
        setFeedback(`Successfully synced ${res.syncedCount} offline task(s) to lodge server!`);
        saveQueue([]);
        setTimeout(() => setFeedback(null), 4000);
      }
    });
  };

  // QR Scanner lookup simulation
  const handleScanLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerCode.trim()) return;
    setScannedResult(`Verified Guest Pass: Reservation #${scannerCode.toUpperCase()} for Room 102. Check-in active.`);
  };

  return (
    <div className="max-w-md mx-auto min-h-[90vh] bg-gray-50 flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-gray-200">
      {/* Top Mobile App Header */}
      <header className="bg-[#0b1437] text-white px-5 py-4 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-xs text-white shadow-sm">
              {lodgeSubdomain.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight">{lodgeName}</h1>
              <div className="text-[10px] text-gray-400 flex items-center gap-1.5 font-medium">
                <span className="capitalize">{staffUser.role} Portal</span>
                <span>&bull;</span>
                <span className="text-gray-300">{staffUser.name}</span>
              </div>
            </div>
          </div>

          {/* Connection Status Pill */}
          <button
            onClick={() => setIsSimulatedOffline(!isSimulatedOffline)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
              isSimulatedOffline
                ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
            }`}
            title="Click to toggle simulated offline mode (basement Wi-Fi deadzone)"
          >
            {isSimulatedOffline ? <WifiOff className="w-3 h-3 text-amber-400" /> : <Wifi className="w-3 h-3 text-emerald-400" />}
            <span>{isSimulatedOffline ? "Offline Mode" : "Live Sync"}</span>
          </button>
        </div>

        {/* Offline notice bar if items queued */}
        {offlineQueue.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-2 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{offlineQueue.length} task(s) cached locally</span>
            </div>
            <button
              onClick={handleSyncOffline}
              disabled={isPending || isSimulatedOffline}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold shadow-xs disabled:opacity-40"
            >
              {isPending ? "Syncing..." : "Sync Now"}
            </button>
          </div>
        )}
      </header>

      {/* Feedback Toast */}
      {feedback && (
        <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Quick Action Metrics Chips */}
      <div className="p-4 grid grid-cols-3 gap-2 bg-white border-b border-gray-200/80 shrink-0">
        <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 text-center">
          <div className="text-[10px] font-bold text-blue-900 uppercase">To Clean</div>
          <div className="text-lg font-black text-blue-950">{rooms.filter((r) => r.status === "cleaning").length}</div>
        </div>
        <div className="bg-red-50/60 p-2.5 rounded-xl border border-red-100 text-center">
          <div className="text-[10px] font-bold text-red-900 uppercase">Fixes</div>
          <div className="text-lg font-black text-red-950">{tickets.length}</div>
        </div>
        <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 text-center">
          <div className="text-[10px] font-bold text-emerald-900 uppercase">Total Tasks</div>
          <div className="text-lg font-black text-emerald-950">{rooms.length + tickets.length}</div>
        </div>
      </div>

      {/* Main Content View */}
      <main className="flex-1 p-4 overflow-y-auto space-y-3">
        {/* TAB 1: HOUSEKEEPING */}
        {activeTab === "housekeeping" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500 px-1 font-semibold">
              <span>Cleaning &amp; Turnover Queue</span>
              <span>{rooms.length} rooms listed</span>
            </div>

            {rooms.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-gray-800">All Rooms Are Clean!</h4>
                <p className="text-xs text-gray-500">No rooms currently waiting in the cleaning queue.</p>
              </div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-base font-black text-gray-900">Room {room.roomNumber}</span>
                      <span className="text-xs text-gray-500 block">{room.roomType} {room.floor ? `• Floor ${room.floor}` : ""}</span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        room.status === "cleaning"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {room.status}
                    </span>
                  </div>

                  <div className="pt-1 flex items-center justify-between gap-2 border-t border-gray-100">
                    <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {room.lastCleanedAt ? new Date(room.lastCleanedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Needs service"}
                    </span>
                    <button
                      onClick={() => handleMarkClean(room.id, room.roomNumber)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Cleaned</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: MAINTENANCE */}
        {activeTab === "maintenance" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500 px-1 font-semibold">
              <span>Maintenance &amp; Repairs</span>
              <span>{tickets.length} open tickets</span>
            </div>

            {tickets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-gray-800">No Open Tickets</h4>
                <p className="text-xs text-gray-500">All fixtures and room systems are operating smoothly.</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-900">{ticket.roomNumber}</span>
                      <span className="text-[10px] text-gray-500 uppercase font-mono">({ticket.issueType})</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        ticket.priority === "urgent"
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : ticket.priority === "high"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700">{ticket.description}</p>

                  <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                    <span className="text-[10px] text-gray-400 font-mono">{ticket.createdAt?.slice(0, 10)}</span>
                    <button
                      onClick={() => handleResolveTicket(ticket.id, ticket.roomNumber)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                    >
                      <span>Mark Resolved</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: QR CHECK-IN SCANNER */}
        {activeTab === "scanner" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-xs">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Guest Pass &amp; Keycard Scanner</h3>
              <p className="text-xs text-gray-500">Scan QR pass or enter reservation reference</p>
            </div>

            <form onSubmit={handleScanLookup} className="space-y-3">
              <input
                type="text"
                value={scannerCode}
                onChange={(e) => setScannerCode(e.target.value)}
                placeholder="Enter booking reference (e.g. RES-491)"
                className="w-full text-xs font-mono border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Verify Guest Pass</span>
              </button>
            </form>

            {scannedResult && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium rounded-xl space-y-1">
                <div className="font-bold flex items-center gap-1 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Scan Result Verified</span>
                </div>
                <p className="text-[11px] text-emerald-700">{scannedResult}</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Touch Navigation Bar */}
      <nav className="bg-white border-t border-gray-200 px-4 py-2.5 flex items-center justify-around shrink-0 select-none">
        <button
          onClick={() => setActiveTab("housekeeping")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === "housekeeping" ? "text-blue-600 font-bold" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px]">Turnover</span>
        </button>

        <button
          onClick={() => setActiveTab("maintenance")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === "maintenance" ? "text-blue-600 font-bold" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span className="text-[10px]">Repairs</span>
        </button>

        <button
          onClick={() => setActiveTab("scanner")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === "scanner" ? "text-blue-600 font-bold" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span className="text-[10px]">Scanner</span>
        </button>

        <button
          onClick={handleSyncOffline}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Manual sync"
        >
          <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin text-blue-600" : ""}`} />
          <span className="text-[10px]">Sync</span>
        </button>
      </nav>
    </div>
  );
}

