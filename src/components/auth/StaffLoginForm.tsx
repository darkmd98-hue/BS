"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, ArrowRight } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export function StaffLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.refresh();
    router.push("/admin");
  };

  return (
    <div className="w-full max-w-[440px] mx-auto flex flex-col items-center gap-7">
      {/* Header */}
      <header className="flex flex-col items-center gap-2.5 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#0b1437] text-white flex items-center justify-center shadow-sm text-lg font-bold">
          🏨
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-sans">
          Staff Portal Sign In
        </h1>
        <p className="text-xs text-gray-500 max-w-sm">
          Access your lodge management administration portal or front desk terminal.
        </p>
      </header>

      {/* Login Form Card */}
      <div className="w-full bg-white py-8 px-6 sm:px-8 rounded-2xl border border-gray-100 shadow-sm">
        <form className="space-y-4" onSubmit={handleLogin}>
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          )}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5" htmlFor="login_email">
              Email Address
            </label>
            <input
              id="login_email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            disabled={loading}
            className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-[#0b1437] hover:bg-[#162268] transition-colors cursor-pointer mt-1 disabled:opacity-70"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? "Signing in..." : "Sign In"}</span>
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
