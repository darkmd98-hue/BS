"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, ShieldCheck, ArrowRight, User, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { registerLodgeAction } from "@/app/actions/auth";

export function RegistrationForm() {
  const router = useRouter();

  const [lodgeName, setLodgeName] = useState("");
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
    <div className="w-full max-w-[640px] mx-auto flex flex-col items-center gap-8">
      {/* Branding Header */}
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-stone-200/60 text-stone-800 text-xs font-semibold uppercase tracking-wider">
          <Building2 className="w-4 h-4 text-lodge-700" />
          <span>LodgeOS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 font-serif">
          Register Your Lodge
        </h1>
        <p className="text-sm text-stone-600 max-w-md">
          Join the premier platform for boutique hospitality management. Experience calm control over your operations.
        </p>
      </header>

      {/* Registration Card */}
      <div className="w-full bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <form className="flex flex-col p-8 md:p-10 gap-8" onSubmit={handleSubmit}>
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="font-bold block mb-0.5">Registration Error</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Section: Lodge Details */}
          <section className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
              <Building2 className="w-5 h-5 text-lodge-700" />
              <h2 className="text-base font-bold text-stone-900">Lodge Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5" htmlFor="lodge_name">
                  Lodge Name
                </label>
                <input
                  id="lodge_name"
                  name="lodge_name"
                  type="text"
                  required
                  value={lodgeName}
                  onChange={(e) => setLodgeName(e.target.value)}
                  placeholder="e.g. Hill View Heritage Lodge"
                  disabled={isLoading}
                  className="block w-full rounded-lg px-4 py-2.5 text-sm text-stone-900 bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-lodge-700 focus:border-lodge-700 transition-colors disabled:opacity-50"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5" htmlFor="address">
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
                  className="block w-full rounded-lg px-4 py-2.5 text-sm text-stone-900 bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-lodge-700 focus:border-lodge-700 transition-colors disabled:opacity-50"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5" htmlFor="rooms">
                  Number of Rooms
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
                  className="block w-full rounded-lg px-4 py-2.5 text-sm text-stone-900 bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-lodge-700 focus:border-lodge-700 transition-colors disabled:opacity-50"
                />
              </div>
            </div>
          </section>

          {/* Section: Owner Account */}
          <section className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
              <User className="w-5 h-5 text-lodge-700" />
              <h2 className="text-base font-bold text-stone-900">Owner Account</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5" htmlFor="owner_name">
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
                  className="block w-full rounded-lg px-4 py-2.5 text-sm text-stone-900 bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-lodge-700 focus:border-lodge-700 transition-colors disabled:opacity-50"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5" htmlFor="email">
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
                  className="block w-full rounded-lg px-4 py-2.5 text-sm text-stone-900 bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-lodge-700 focus:border-lodge-700 transition-colors disabled:opacity-50"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5" htmlFor="password">
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
                  className="block w-full rounded-lg px-4 py-2.5 text-sm text-stone-900 bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-lodge-700 focus:border-lodge-700 transition-colors disabled:opacity-50"
                />
              </div>
            </div>
          </section>

          {/* Trust Indicator Panel */}
          <div className="bg-stone-50 rounded-xl p-4 flex items-start gap-3.5 border border-stone-200">
            <ShieldCheck className="w-5 h-5 text-lodge-800 shrink-0 mt-0.5" />
            <p className="text-xs text-stone-600 leading-relaxed">
              <strong className="text-stone-900 font-bold block mb-0.5">Dedicated Tenant Isolation</strong>
              Your lodge&apos;s data is secured with database-level Row Level Security, ensuring complete privacy and isolation from other platform users.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3.5">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-lodge-700 hover:bg-lodge-800 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Provisioning Lodge Tenant...</span>
                </>
              ) : (
                <>
                  <span>Register Lodge &amp; Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <Link
              href="/login"
              className="text-center text-xs font-medium text-stone-500 hover:text-lodge-800 transition-colors"
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
