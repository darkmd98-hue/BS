import Link from "next/link";
import {
  Building2,
  Grid,
  Calendar,
  CreditCard,
  BookOpen,
  LogOut,
  ShieldCheck,
} from "lucide-react";

export default function ReceptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-stone-100/80 text-stone-900 font-sans">
      {/* Top Reception Bar */}
      <header className="h-16 bg-white border-b border-stone-200 sticky top-0 z-40 px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-lodge-700 text-white flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-stone-900 tracking-tight leading-tight block">
                Hill View Lodge
              </span>
              <span className="text-[10px] text-stone-500 uppercase tracking-widest block font-semibold">
                Reception Desk
              </span>
            </div>
          </div>

          {/* Navigation tabs */}
          <nav className="flex items-center space-x-1 pl-4 border-l border-stone-200">
            <Link
              href="/reception"
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-lodge-800 bg-lodge-50 border border-lodge-200/60 transition-colors"
            >
              <Grid className="w-4 h-4 text-lodge-700" />
              <span>Room Grid</span>
            </Link>
            <Link
              href="/reception/bookings"
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-stone-400" />
              <span>Bookings</span>
            </Link>
            <Link
              href="/reception/calendar"
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
            >
              <Calendar className="w-4 h-4 text-stone-400" />
              <span>Calendar</span>
            </Link>
            <Link
              href="/reception/billing"
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
            >
              <CreditCard className="w-4 h-4 text-stone-400" />
              <span>Billing</span>
            </Link>
          </nav>
        </div>

        {/* Right Info & Actions */}
        <div className="flex items-center space-x-4">
          <Link
            href="/admin"
            className="text-xs font-medium text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors"
          >
            Admin Portal
          </Link>

          <div className="flex items-center space-x-2 text-xs text-stone-600 pl-3 border-l border-stone-200">
            <span className="font-semibold text-stone-800">Staff User</span>
            <Link href="/login" className="text-stone-400 hover:text-rose-600" title="Logout">
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Reception Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}
