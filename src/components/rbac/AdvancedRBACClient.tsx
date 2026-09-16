"use client";

import { useState, useTransition } from "react";
import {
  ShieldCheck,
  Shield,
  Key,
  Users,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Trash2,
  FileCheck,
  Search,
  Check,
  X,
  History,
  Lock,
  Sparkles,
} from "lucide-react";
import type {
  RBACData,
  RoleDefinition,
  PermissionCategory,
  AuditLogEntry,
} from "@/types/rbac";
import {
  saveCustomRoleAction,
  deleteRoleAction,
  assignStaffRoleAction,
} from "@/app/actions/rbac";

interface AdvancedRBACClientProps {
  data: RBACData;
}

export function AdvancedRBACClient({ data }: { data: RBACData }) {
  const { roles: initialRoles, permissionCategories, staffAssignments, recentAuditLogs, lodgeName } = data;

  const [roles, setRoles] = useState<RoleDefinition[]>(initialRoles);
  const [activeTab, setActiveTab] = useState<"matrix" | "roles" | "audit">("matrix");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRolePerms, setSelectedRolePerms] = useState<Set<string>>(new Set());
  const [auditSearch, setAuditSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleTogglePerm = (key: string) => {
    setSelectedRolePerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleCreateRole = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const roleName = fd.get("name") as string;
    const description = fd.get("description") as string;
    const permsArray = Array.from(selectedRolePerms);
    fd.append("permissions", JSON.stringify(permsArray));

    startTransition(async () => {
      const res = await saveCustomRoleAction(fd);
      if (res.success) {
        const newRole: RoleDefinition = {
          id: res.roleId || "custom-" + Date.now(),
          name: roleName,
          description,
          isSystemRole: false,
          permissions: permsArray,
          userCount: 0,
        };
        setRoles((prev) => [...prev, newRole]);
        setShowCreateModal(false);
        setSelectedRolePerms(new Set());
        setFeedback(`Custom role "${roleName}" created with ${permsArray.length} permissions.`);
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback(res.error || "Failed to create role");
        setTimeout(() => setFeedback(null), 4000);
      }
    });
  };

  const handleDeleteRole = (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete role "${roleName}"?`)) return;

    const fd = new FormData();
    fd.append("role_id", roleId);

    startTransition(async () => {
      const res = await deleteRoleAction(fd);
      if (res.success) {
        setRoles((prev) => prev.filter((r) => r.id !== roleId));
        setFeedback(`Role "${roleName}" was removed.`);
        setTimeout(() => setFeedback(null), 3000);
      }
    });
  };

  const filteredAuditLogs = recentAuditLogs.filter((log) => {
    const s = auditSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(s) ||
      log.userEmail.toLowerCase().includes(s) ||
      log.resourceType.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0b1437] to-[#1c2966] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/20">
              Enterprise Access Control
            </span>
            <span className="text-xs text-gray-300 font-medium">&bull; Granular RBAC Matrix</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Role-Based Access Control (RBAC)</h1>
          <p className="text-xs text-gray-300">
            Define custom staff roles, inspect the multidimensional permission matrix, and monitor security access audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Custom Role</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Segmented Tabs */}
      <div className="border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`pb-3 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "matrix"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Permissions Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`pb-3 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "roles"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Roles &amp; Staff ({roles.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`pb-3 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "audit"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Security Audit Log</span>
          </button>
        </div>
      </div>

      {/* TAB 1: VISUAL PERMISSIONS MATRIX */}
      {activeTab === "matrix" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Enterprise Permission Matrix</h3>
            <p className="text-[11px] text-gray-500">
              Cross-cutting role capabilities and security boundaries across all LodgeOS functional areas.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-700 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 min-w-[240px]">Permission Area</th>
                  {roles.map((r) => (
                    <th key={r.id} className="py-3 px-3 text-center min-w-[110px]">
                      <div>{r.name.split("/")[0]}</div>
                      {r.isSystemRole && (
                        <span className="text-[9px] font-normal text-gray-400 lowercase">system</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {permissionCategories.map((cat) => (
                  <tr key={cat.id} className="contents">
                    {/* Category Section Header */}
                    <tr className="bg-slate-50 border-t border-b border-gray-200">
                      <td colSpan={roles.length + 1} className="py-2 px-4 font-black text-xs text-gray-900 flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </td>
                    </tr>

                    {/* Permissions in Category */}
                    {cat.permissions.map((perm) => (
                      <tr key={perm.key} className="hover:bg-blue-50/20 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-gray-900">{perm.label}</div>
                          <div className="text-[10px] text-gray-500">{perm.description}</div>
                        </td>
                        {roles.map((r) => {
                          const hasPermission = r.permissions.includes(perm.key);
                          return (
                            <td key={r.id} className="py-2.5 px-3 text-center">
                              {hasPermission ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="inline-block w-2 h-0.5 bg-gray-200 rounded"></span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & STAFF PROFILES */}
      {activeTab === "roles" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-gray-900">{r.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        r.isSystemRole ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {r.isSystemRole ? "System Role" : "Custom Role"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{r.description}</p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-mono text-[11px]">
                    {r.permissions.length} permissions active
                  </span>
                  {!r.isSystemRole && (
                    <button
                      onClick={() => handleDeleteRole(r.id, r.name)}
                      disabled={isPending}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Delete custom role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Current Staff Assignments */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Current Staff Role Assignments</h3>
              <p className="text-[11px] text-gray-500">Lodge members and their granted functional roles</p>
            </div>

            <div className="divide-y divide-gray-100">
              {staffAssignments.map((s) => (
                <div key={s.userId} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      {s.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{s.fullName}</div>
                      <div className="text-[10px] text-gray-500">{s.email}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    {s.assignedRoleName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY AUDIT LOG */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Administrative Security Trail</h3>
              <p className="text-[11px] text-gray-500">Immutable ledger of sensitive role and authorization events</p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit trail..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-52"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor / Email</th>
                  <th className="py-2.5 px-3">Security Action</th>
                  <th className="py-2.5 px-3">Target Resource</th>
                  <th className="py-2.5 px-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No security events match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : "Just now"}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">{log.userEmail}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 capitalize font-mono text-[11px]">
                        {log.resourceType} {log.resourceId ? `(#${log.resourceId.slice(0, 8)})` : ""}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 text-[10px] font-mono">
                        {log.metadata ? JSON.stringify(log.metadata) : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM ROLE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-[#0b1437] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm">Create Custom Staff Role</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Role Title *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Night Auditor, Senior Concierge"
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Role Description</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Briefly outline responsibilities and security access scope..."
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Permission Checkboxes grouped by category */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-gray-900">
                  Select Permitted Capabilities ({selectedRolePerms.size} selected)
                </div>

                <div className="space-y-4 border border-gray-200 rounded-xl p-4 bg-gray-50/50 max-h-60 overflow-y-auto">
                  {permissionCategories.map((cat) => (
                    <div key={cat.id} className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 border-b border-gray-200 pb-1">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cat.permissions.map((p) => {
                          const isChecked = selectedRolePerms.has(p.key);
                          return (
                            <label
                              key={p.key}
                              className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? "bg-blue-50 border-blue-200 text-blue-950 font-semibold"
                                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePerm(p.key)}
                                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div>
                                <div>{p.label}</div>
                                <div className="text-[10px] text-gray-500 font-normal">{p.description}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {isPending ? "Creating..." : "Save Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
