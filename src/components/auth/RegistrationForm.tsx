"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, ShieldCheck, ArrowRight, User, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { registerLodgeAction } from "@/app/actions/auth";

export function RegistrationForm() {
  const router = useRouter();

  const [lodgeName, setLodgeName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [address, setAddress] = useState("");
  const [rooms, setRooms] = useState(18);
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await registerLodgeAction({
        lodgeName,
        subdomain: subdomain || undefined,
        address,
        roomCount: rooms,
        fullName: ownerName,
        email,
        password,
      });

      if (!result.success) {
        setErrorMessage(result.error || "Registration failed. Please check your inputs.");
        setIsLoading(false);
        return;
      }

      // Success -> Redirect to install-link screen
      router.push(result.redirectUrl || "/install");
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[580px] mx-auto flex flex-col items-center gap-7">
      {/* Branding Header */}
      <header className="flex flex-col items-center gap-2.5 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-[#0b1437] text-xs font-semibold uppercase tracking-wider">
          <Building2 className="w-4 h-4 text-[#0b1437]" />
          <span>LodgeOS Cloud</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-sans">
          Register Your Lodge
        </h1>
        <p className="text-xs text-gray-500 max-w-md">
          Join the hospitality platform built for speed, multi-tenant isolation, and front desk clarity.
        </p>
      </header>

      {/* Registration Card */}
      <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <form className="flex flex-col p-6 sm:p-8 gap-6" onSubmit={handleSubmit}>
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="font-bold block mb-0.5">Registration Error</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Section: Lodge Details */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <Building2 className="w-4 h-4 text-[#0b1437]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Lodge Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1" htmlFor="lodge_name">
                  Lodge Name
                </label>
                <input
                  id="lodge_name"
                  name="lodge_name"
                  type="text"
                  required
                  value={lodgeName}
                  onChange={(e) => {
                    const name = e.target.value;
                    setLodgeName(name);
                    if (!subdomain) {
                      setSubdomain(name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20));
                    }
                  }}
                  placeholder="e.g. Hill View Heritage Lodge"
                  disabled={isLoading}
                  className="block w-full rounded-lg px-3.5 py-2 text-sm text-gray-900 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-[#0b1437] transition-colors disabled:opacity-50"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400" htmlFor="subdomain">
                    Subdomain / Property Slug
                  </label>
                  <span className="text-[11px] text-gray-400">Used for staff login URL</span>
                </div>
                <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-50 focus-within:border-[#0b1437]">
                  <input
                    id="subdomain"
                    name="subdomain"
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="e.g. hillview"
                    disabled={isLoading}
                    className="block w-full px-3.5 py-2 text-sm text-gray-900 bg-transparent focus:outline-none disabled:opacity-50 font-mono"
                  />
                  <span className="px-3 py-2 bg-gray-50 text-xs text-gray-500 font-medium border-l border-gray-200 flex items-center shrink-0">
                    .localhost:3000
                  </span>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1" htmlFor="address">
                  Primary Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Main Road, Sringeri, Karnataka"
                  disabled={isLoading}
                  className="block w-full rounded-lg px-3.5 py-2 text-sm text-gray-900 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-[#0b1437] transition-colors disabled:opacity-50"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1" htmlFor="rooms">
                  Initial Room Count
                </label>
                <input
                  id="rooms"
                  name="rooms"
                  type="number"
                  min="1"
                  value={rooms}
                  onChange={(e) => setRooms(Number(e.target.value))}
                  required
                  disabled={isLoading}
                  className="block w-full rounded-lg px-3.5 py-2 text-sm text-gray-900 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-[#0b1437] transition-colors disabled:opacity-50"
                />
              </div>
            </div>
          </section>

          {/* Section: Owner Account */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <User className="w-4 h-4 text-[#0b1437]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Owner Account</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1" htmlFor="owner_name">
                  Full Name
                </label>
                <input
                  id="owner_name"
                  name="owner_name"
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  disabled={isLoading}
                  className="block w-full rounded-lg px-3.5 py-2 text-sm text-gray-900 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-[#0b1437] transition-colors disabled:opacity-50"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@example.com"
                  disabled={isLoading}
                  className="block w-full rounded-lg px-3.5 py-2 text-sm text-gray-900 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-[#0b1437] transition-colors disabled:opacity-50"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isLoading}
                  className="block w-full rounded-lg px-3.5 py-2 text-sm text-gray-900 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-[#0b1437] transition-colors disabled:opacity-50"
                />
              </div>
            </div>
          </section>

          {/* Trust Indicator Panel */}
          <div className="bg-gray-50 rounded-xl p-3.5 flex items-start gap-3 border border-gray-100">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong className="text-gray-800 font-bold block mb-0.5">Database-Level Tenant Isolation</strong>
              Your property runs in an isolated partition protected by PostgreSQL Row Level Security (RLS).
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#0b1437] hover:bg-[#162268] disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Provisioning Lodge Tenant...</span>
                </>
              ) : (
                <>
                  <span>Register Lodge &amp; Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <Link
              href="/login"
              className="text-center text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>

      <footer className="text-center pb-6 text-xs text-stone-400">
        &copy; {new Date().getFullYear()} LodgeOS. Secure Hospitality Management.
      </footer>
    </div>
  );
}
