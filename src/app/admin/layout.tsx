import Link from "next/link";
import {
  Building2,
  LayoutDashboard,
  BedDouble,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ShieldAlert,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-stone-100/70 text-stone-900 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-stone-900 text-stone-300 flex flex-col border-r border-stone-800">
        {/* Lodge Branding */}
        <div className="h-16 flex items-center px-6 border-b border-stone-800 space-x-3">
          <div className="w-9 h-9 rounded-lg bg-lodge-600 text-white flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white tracking-tight block">
              Hill View Lodge
            </span>
            <span className="text-[10px] text-stone-400 uppercase tracking-widest block font-medium">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <Link
            href="/admin"
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-white bg-stone-800/80 hover:bg-stone-800 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-lodge-400" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/admin/rooms"
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800/50 transition-colors"
          >
            <BedDouble className="w-4 h-4 text-stone-400" />
            <span>Room Management</span>
          </Link>
          <Link
            href="/admin/staff"
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800/50 transition-colors"
          >
            <Users className="w-4 h-4 text-stone-400" />
            <span>Staff &amp; Access</span>
          </Link>
          <Link
            href="/admin/reports"
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800/50 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-stone-400" />
            <span>Revenue &amp; Reports</span>
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800/50 transition-colors"
          >
            <Settings className="w-4 h-4 text-stone-400" />
            <span>Lodge Settings</span>
          </Link>
        </nav>

        {/* Switch to Reception / Tenant info */}
        <div className="p-4 border-t border-stone-800 space-y-3">
          <Link
            href="/reception"
            className="block text-center py-2 px-3 rounded-lg bg-lodge-700 hover:bg-lodge-800 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            Switch to Reception View
          </Link>

          <div className="flex items-center justify-between pt-2 text-[11px] text-stone-400">
            <div className="flex items-center space-x-2 truncate">
              <div className="w-6 h-6 rounded-full bg-stone-700 flex items-center justify-center text-white text-[10px] font-bold">
                AD
              </div>
              <span className="truncate">Owner (Admin)</span>
            </div>
            <Link href="/login" className="text-stone-400 hover:text-rose-400" title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-8">
          <div className="flex items-center space-x-3">
            <h1 className="text-base font-semibold text-stone-900">Admin Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Cloud Sync
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <span className="text-xs text-stone-500 block">Current Tenant Scope</span>
              <span className="text-xs font-bold text-stone-800">Hill View Lodge (ID: #4092)</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
