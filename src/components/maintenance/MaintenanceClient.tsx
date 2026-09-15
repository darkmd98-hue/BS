"use client";

import { useState, useTransition } from "react";
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  User,
  Home,
  ArrowRight,
  Loader2,
  X,
  Calendar,
  Layers,
} from "lucide-react";
import type {
  MaintenanceTicket,
  MaintenanceRoomOption,
  MaintenanceStaffOption,
  IssueType,
  Priority,
  TicketStatus,
} from "@/lib/maintenance";
import {
  createMaintenanceTicketAction,
  updateTicketStatusAction,
  assignTicketAction,
} from "@/app/actions/maintenance";

const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  ac_heating: "AC / Heating",
  plumbing: "Plumbing",
  electrical: "Electrical",
  structural: "Structural",
  furnishings: "Furnishings",
  appliances: "Appliances",
  other: "General / Other",
};

const PRIORITY_COLORS: Record<Priority, { label: string; badge: string; border: string }> = {
  urgent: { label: "Urgent", badge: "bg-red-50 text-red-700 border-red-200", border: "border-l-red-500" },
  high: { label: "High", badge: "bg-orange-50 text-orange-700 border-orange-200", border: "border-l-orange-500" },
  medium: { label: "Medium", badge: "bg-amber-50 text-amber-700 border-amber-200", border: "border-l-amber-400" },
  low: { label: "Low", badge: "bg-blue-50 text-blue-700 border-blue-200", border: "border-l-blue-400" },
};

export function MaintenanceClient({
  tickets: initialTickets,
  rooms,
  staff,
}: {
  tickets: MaintenanceTicket[];
  rooms: MaintenanceRoomOption[];
  staff: MaintenanceStaffOption[];
}) {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(initialTickets);
  const [activeTab, setActiveTab] = useState<"kanban" | "history">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedRoomHistory, setSelectedRoomHistory] = useState<string>("all");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState("");

  // Filtering
  const filteredTickets = tickets.filter((t) => {
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (typeFilter !== "all" && t.issue_type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchRoom = t.room?.room_number.toLowerCase().includes(q);
      const matchReported = t.reported_by_name?.toLowerCase().includes(q);
      if (!matchDesc && !matchRoom && !matchReported) return false;
    }
    return true;
  });

  const openTickets = filteredTickets.filter((t) => t.status === "open");
  const inProgressTickets = filteredTickets.filter((t) => t.status === "in_progress");
  const resolvedTickets = filteredTickets.filter((t) => t.status === "resolved");

  // Summary Metrics
  const urgentCount = tickets.filter((t) => t.status !== "resolved" && (t.priority === "urgent" || t.priority === "high")).length;
  const activeCount = tickets.filter((t) => t.status !== "resolved").length;
  const resolvedTodayCount = tickets.filter(
    (t) => t.status === "resolved" && t.resolved_at && new Date(t.resolved_at).toDateString() === new Date().toDateString()
  ).length;

  // Actions
  const handleStatusChange = (ticketId: string, newStatus: TicketStatus, notes?: string) => {
    startTransition(async () => {
      const res = await updateTicketStatusAction(ticketId, newStatus, notes);
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) => {
            if (t.id === ticketId) {
              return {
                ...t,
                status: newStatus,
                resolved_at: newStatus === "resolved" ? new Date().toISOString() : null,
                resolution_notes: notes ?? t.resolution_notes,
              };
            }
            return t;
          })
        );
        if (resolvingTicketId === ticketId) {
          setResolvingTicketId(null);
          setResolutionNotes("");
        }
      } else {
        alert(res.error || "Failed to update status");
      }
    });
  };

  const handleAssignStaff = (ticketId: string, staffId: string) => {
    const selectedStaff = staff.find((s) => s.id === staffId);
    const staffName = selectedStaff ? selectedStaff.full_name : null;
    startTransition(async () => {
      const res = await assignTicketAction(ticketId, staffId || null, staffName);
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, assigned_to_user_id: staffId || null, assigned_to_name: staffName } : t))
        );
      } else {
        alert(res.error || "Failed to assign staff");
      }
    });
  };

  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await createMaintenanceTicketAction(formData);
      if (res.success) {
        setIsCreateModalOpen(false);
        form.reset();
        window.location.reload(); // refresh to get full relations
      } else {
        setFormError(res.error || "Failed to create ticket");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Open Tickets</p>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{activeCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">{openTickets.length} new, {inProgressTickets.length} in progress</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Urgent & High Priority</p>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-600 mt-2">{urgentCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">Requires immediate attention</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Resolved Today</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{resolvedTodayCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total resolved: {tickets.filter((t) => t.status === "resolved").length}</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("kanban")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                activeTab === "kanban" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                activeTab === "history" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Room History
            </button>
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets, rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Issue Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Issue Types</option>
            {Object.entries(ISSUE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0b1437] text-white rounded-lg text-xs font-semibold hover:bg-[#162268] transition-colors shadow-xs ml-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Report Issue
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Open Column */}
          <div className="flex flex-col bg-gray-50/70 rounded-xl p-4 border border-gray-100 min-h-[500px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="font-bold text-gray-900 text-sm">Open</h3>
              </div>
              <span className="px-2 py-0.5 text-xs font-bold bg-gray-200/70 text-gray-700 rounded-full">
                {openTickets.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {openTickets.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">No open tickets</div>
              ) : (
                openTickets.map((t) => (
                  <TicketCard
                    key={t.id}
                    ticket={t}
                    staff={staff}
                    onStatusChange={handleStatusChange}
                    onAssignStaff={handleAssignStaff}
                    onResolveClick={(id) => setResolvingTicketId(id)}
                    isPending={isPending}
                  />
                ))
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="flex flex-col bg-gray-50/70 rounded-xl p-4 border border-gray-100 min-h-[500px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="font-bold text-gray-900 text-sm">In Progress</h3>
              </div>
              <span className="px-2 py-0.5 text-xs font-bold bg-gray-200/70 text-gray-700 rounded-full">
                {inProgressTickets.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {inProgressTickets.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">No tickets in progress</div>
              ) : (
                inProgressTickets.map((t) => (
                  <TicketCard
                    key={t.id}
                    ticket={t}
                    staff={staff}
                    onStatusChange={handleStatusChange}
                    onAssignStaff={handleAssignStaff}
                    onResolveClick={(id) => setResolvingTicketId(id)}
                    isPending={isPending}
                  />
                ))
              )}
            </div>
          </div>

          {/* Resolved Column */}
          <div className="flex flex-col bg-gray-50/70 rounded-xl p-4 border border-gray-100 min-h-[500px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-gray-900 text-sm">Resolved</h3>
              </div>
              <span className="px-2 py-0.5 text-xs font-bold bg-gray-200/70 text-gray-700 rounded-full">
                {resolvedTickets.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {resolvedTickets.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">No resolved tickets</div>
              ) : (
                resolvedTickets.map((t) => (
                  <TicketCard
                    key={t.id}
                    ticket={t}
                    staff={staff}
                    onStatusChange={handleStatusChange}
                    onAssignStaff={handleAssignStaff}
                    onResolveClick={(id) => setResolvingTicketId(id)}
                    isPending={isPending}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Room History View */
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Room Maintenance Log</h3>
              <p className="text-xs text-gray-500 mt-0.5">Filter complete maintenance history by individual room</p>
            </div>
            <select
              value={selectedRoomHistory}
              onChange={(e) => setSelectedRoomHistory(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Rooms ({rooms.length})</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.room_number} ({r.room_type})
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4">Issue</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tickets
                  .filter((t) => selectedRoomHistory === "all" || t.room_id === selectedRoomHistory)
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {t.room ? `Room ${t.room.room_number}` : <span className="text-gray-400 font-normal">General Facility</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-800">{ISSUE_TYPE_LABELS[t.issue_type]}</div>
                        <div className="text-gray-500 text-[11px] truncate max-w-xs mt-0.5">{t.description}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${PRIORITY_COLORS[t.priority].badge}`}>
                          {PRIORITY_COLORS[t.priority].label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            t.status === "resolved"
                              ? "bg-emerald-50 text-emerald-700"
                              : t.status === "in_progress"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {t.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{t.assigned_to_name || "—"}</td>
                      <td className="py-3.5 px-4 text-gray-500 text-[11px] max-w-xs truncate">
                        {t.resolution_notes ? (
                          <span>{t.resolution_notes}</span>
                        ) : t.resolved_at ? (
                          <span className="text-emerald-600">Resolved</span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report Issue Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Report Maintenance Issue</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 mt-4">
              {formError && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="maint_roomId" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Room Affected
                  </label>
                  <select
                    id="maint_roomId"
                    name="roomId"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                  >
                    <option value="">General Facility / Common Area</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.room_number} ({r.room_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="maint_issueType" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Issue Category *
                  </label>
                  <select
                    id="maint_issueType"
                    name="issueType"
                    required
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                  >
                    {Object.entries(ISSUE_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="maint_priority" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Priority Level *
                  </label>
                  <select
                    id="maint_priority"
                    name="priority"
                    defaultValue="medium"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                  >
                    <option value="low">Low (Minor upkeep)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="high">High (Affects guest comfort)</option>
                    <option value="urgent">Urgent (Immediate fix / Room blocked)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="maint_assignedTo" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Assign Staff Member
                  </label>
                  <select
                    id="maint_assignedTo"
                    name="assignedToUserId"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800"
                  >
                    <option value="">Unassigned</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="maint_description" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Description of Problem *
                </label>
                <textarea
                  id="maint_description"
                  name="description"
                  required
                  rows={3}
                  placeholder="e.g. AC unit leaking water over desk; fan making buzzing noise."
                  className="w-full text-xs border border-gray-200 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-[#0b1437] text-white rounded-lg text-xs font-semibold hover:bg-[#162268] transition-colors shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolution Notes Modal */}
      {resolvingTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">Resolve Maintenance Ticket</h3>
              <button onClick={() => setResolvingTicketId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 mt-4">
              <p className="text-xs text-gray-500">
                Provide notes on the repairs made before closing this ticket and releasing any blocked room.
              </p>
              <div>
                <label htmlFor="maint_resNotes" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Resolution Summary
                </label>
                <textarea
                  id="maint_resNotes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Replaced AC condensation drain tube and tested for 30 minutes. All clear."
                  rows={3}
                  className="w-full text-xs border border-gray-200 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-800 resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setResolvingTicketId(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleStatusChange(resolvingTicketId, "resolved", resolutionNotes)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Single Ticket Card ────────────────────────────────────────────────────────
function TicketCard({
  ticket,
  staff,
  onStatusChange,
  onAssignStaff,
  onResolveClick,
  isPending,
}: {
  ticket: MaintenanceTicket;
  staff: MaintenanceStaffOption[];
  onStatusChange: (id: string, status: TicketStatus, notes?: string) => void;
  onAssignStaff: (id: string, staffId: string) => void;
  onResolveClick: (id: string) => void;
  isPending: boolean;
}) {
  const priorityConfig = PRIORITY_COLORS[ticket.priority];

  return (
    <div className={`bg-white rounded-xl border border-gray-200/70 p-4 shadow-xs border-l-4 ${priorityConfig.border} transition-all space-y-3`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {ticket.room ? (
              <span className="font-bold text-gray-900 text-xs bg-gray-100 px-2 py-0.5 rounded-md">
                Room {ticket.room.room_number}
              </span>
            ) : (
              <span className="font-bold text-gray-500 text-[11px] bg-gray-100 px-2 py-0.5 rounded-md">
                General
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityConfig.badge}`}>
              {priorityConfig.label}
            </span>
          </div>
          <p className="text-xs font-bold text-gray-800 mt-1.5">{ISSUE_TYPE_LABELS[ticket.issue_type]}</p>
        </div>
        <span className="text-[10px] text-gray-400 whitespace-nowrap">
          {new Date(ticket.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
        </span>
      </div>

      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
        {ticket.description}
      </p>

      {ticket.resolution_notes && (
        <div className="p-2 bg-emerald-50/70 border border-emerald-100 rounded-lg text-[11px] text-emerald-800">
          <span className="font-bold">Fix: </span>
          {ticket.resolution_notes}
        </div>
      )}

      {/* Staff assignment & Reported by */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3 text-gray-400" />
          <select
            value={ticket.assigned_to_user_id || ""}
            onChange={(e) => onAssignStaff(ticket.id, e.target.value)}
            disabled={isPending || ticket.status === "resolved"}
            className="text-[11px] bg-transparent border-0 text-gray-600 font-medium hover:underline focus:outline-none cursor-pointer disabled:cursor-default"
          >
            <option value="">Assign staff...</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </div>
        <span className="truncate max-w-[100px]" title={`Reported by ${ticket.reported_by_name || "staff"}`}>
          {ticket.reported_by_name?.split(" ")[0] || "Staff"}
        </span>
      </div>

      {/* Transition Buttons */}
      <div className="flex items-center justify-between gap-1 pt-1">
        {ticket.status === "open" && (
          <button
            onClick={() => onStatusChange(ticket.id, "in_progress")}
            disabled={isPending}
            className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Start Work <ArrowRight className="w-3 h-3" />
          </button>
        )}

        {ticket.status === "in_progress" && (
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={() => onStatusChange(ticket.id, "open")}
              disabled={isPending}
              className="px-2.5 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={() => onResolveClick(ticket.id)}
              disabled={isPending}
              className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Resolve
            </button>
          </div>
        )}

        {ticket.status === "resolved" && (
          <button
            onClick={() => onStatusChange(ticket.id, "in_progress")}
            disabled={isPending}
            className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Reopen Ticket
          </button>
        )}
      </div>
    </div>
  );
}
