"use client";

import Link from "next/link";
import { Building2, LogIn, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";

export function StaffLoginForm() {
  return (
    <div className="w-full max-w-[440px] mx-auto flex flex-col items-center gap-7">
      {/* Header */}
      <header className="flex flex-col items-center gap-2.5 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#0b1437] text-white flex items-center justify-center shadow-sm text-lg font-bold">
          🏨
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-display">
          Sign In to LodgeOS
        </h1>
        <p className="text-xs text-gray-500 max-w-sm">
          Access your lodge management administration portal or front desk terminal.
        </p>
      </header>

      {/* Login Form Card */}
      <div className="w-full bg-white py-8 px-6 sm:px-8 rounded-2xl border border-gray-100 shadow-xs">
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5" htmlFor="login_email">
              Email Address
            </label>
            <input
              id="login_email"
              type="email"
              required
              placeholder="staff@yourlodge.com"
              className="block w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#0b1437] focus:ring-2 focus:ring-blue-50 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5" htmlFor="login_password">
              Password
            </label>
            <input
              id="login_password"
              type="password"
              required
              placeholder="••••••••••••"
              className="block w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#0b1437] focus:ring-2 focus:ring-blue-50 focus:outline-none transition-colors"
            />
          </div>

          {/* Quick Route Portals */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center py-2.5 px-3 border border-gray-200 text-gray-800 hover:bg-gray-50 rounded-xl text-xs font-semibold transition-colors"
            >
              <span>Admin Portal</span>
            </Link>
            <Link
              href="/reception"
              className="inline-flex items-center justify-center py-2.5 px-3 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-colors"
            >
              <span>Front Desk</span>
            </Link>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#0b1437] hover:bg-[#162268] transition-colors cursor-pointer mt-1"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            Register a new property?{" "}
            <Link href="/register" className="font-semibold text-[#0b1437] hover:underline">
              Create Lodge Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
