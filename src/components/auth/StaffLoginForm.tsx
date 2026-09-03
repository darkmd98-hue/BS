"use client";

import Link from "next/link";
import { Building2, LogIn, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";

export function StaffLoginForm() {
  return (
    <div className="w-full max-w-[480px] mx-auto flex flex-col items-center gap-8">
      {/* Header */}
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-lodge-700 text-white flex items-center justify-center shadow-sm">
          <Building2 className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 font-serif">
          Sign In to LodgeOS
        </h1>
        <p className="text-xs text-stone-600 max-w-sm">
          Access your lodge management dashboard or reception terminal.
        </p>
      </header>

      {/* Login Form Card */}
      <div className="w-full bg-white py-8 px-6 sm:px-8 rounded-2xl border border-stone-200 shadow-sm">
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5" htmlFor="login_email">
              Email Address
            </label>
            <input
              id="login_email"
              type="email"
              required
              placeholder="staff@example.com"
              className="block w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-lodge-700 focus:ring-1 focus:ring-lodge-700 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5" htmlFor="login_password">
              Password
            </label>
            <input
              id="login_password"
              type="password"
              required
              placeholder="••••••••••••"
              className="block w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-lodge-700 focus:ring-1 focus:ring-lodge-700 focus:outline-none transition-colors"
            />
          </div>

          {/* Quick Route Demos for Phase 0 */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center space-x-1.5 py-2 px-3 border border-lodge-600 text-lodge-800 hover:bg-lodge-50 rounded-xl text-xs font-semibold transition-colors"
            >
              <span>Admin Portal</span>
            </Link>
            <Link
              href="/reception"
              className="inline-flex items-center justify-center space-x-1.5 py-2 px-3 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-semibold transition-colors"
            >
              <span>Reception Desk</span>
            </Link>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-lodge-700 hover:bg-lodge-800 transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-stone-100 text-center">
          <p className="text-xs text-stone-500">
            New lodge owner?{" "}
            <Link href="/register" className="font-semibold text-lodge-700 hover:underline">
              Register Your Lodge
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
