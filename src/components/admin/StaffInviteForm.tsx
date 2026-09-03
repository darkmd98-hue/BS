"use client";

import { useState } from "react";
import { Users, UserPlus, Mail, Shield, Trash2, X, CheckCircle2 } from "lucide-react";
import type { UserRole } from "@/types/database";

interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

const INITIAL_STAFF: StaffMember[] = [
  { id: "1", fullName: "Ramesh Kumar (Owner)", email: "owner@hillview.com", role: "admin", createdAt: "2026-08-01" },
  { id: "2", fullName: "Kavita Rao", email: "kavita@hillview.com", role: "reception", createdAt: "2026-08-05" },
  { id: "3", fullName: "Suresh Gowda", email: "suresh@hillview.com", role: "reception", createdAt: "2026-08-10" },
];

export function StaffInviteForm() {
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("reception");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const newStaff: StaffMember = {
      id: Date.now().toString(),
      fullName: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setStaff((prev) => [...prev, newStaff]);
    setInviteName("");
    setInviteEmail("");
    setIsInviteModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-serif">Staff &amp; Access Management</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Invite reception staff and manage role permissions strictly within your lodge boundary.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-lodge-700 hover:bg-lodge-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Reception Staff</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 uppercase tracking-wider">
                <th className="py-3.5 px-5 font-semibold">Staff Member</th>
                <th className="py-3.5 px-5 font-semibold">Email</th>
                <th className="py-3.5 px-5 font-semibold">Role</th>
                <th className="py-3.5 px-5 font-semibold">Joined Date</th>
                <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 font-bold flex items-center justify-center text-xs">
                        {s.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-stone-900">{s.fullName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-stone-600">{s.email}</td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        s.role === "admin"
                          ? "bg-lodge-100 text-lodge-800 border border-lodge-200"
                          : "bg-blue-50 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {s.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-stone-500">{s.createdAt}</td>
                  <td className="py-3.5 px-5 text-right">
                    {s.role !== "admin" && (
                      <button
                        type="button"
                        onClick={() => setStaff((prev) => prev.filter((item) => item.id !== s.id))}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove staff access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-lg font-bold text-stone-900 font-serif">Invite Staff Member</h3>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleInvite}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Ramesh Gowda"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-lodge-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="staff@example.com"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-lodge-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Role Assignment
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-lodge-700"
                >
                  <option value="reception">Reception Desk (Operational)</option>
                  <option value="admin">Admin / Manager (Full Access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-lodge-700 hover:bg-lodge-800 text-white text-xs font-semibold shadow-sm cursor-pointer"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
