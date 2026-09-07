import Link from "next/link";
import { Building2, ShieldCheck, Zap, ArrowRight, UserPlus, LogIn } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-stone-50 via-lodge-50/30 to-stone-100">
      {/* Header */}
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-lodge-700 text-white flex items-center justify-center font-bold text-xl shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-stone-800">LodgeOS</span>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-lodge-700 hover:bg-lodge-800 rounded-lg shadow-sm transition-all"
            >
              Register Lodge
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-lodge-100/80 border border-lodge-200 text-lodge-800 text-xs font-semibold uppercase tracking-wider mb-6 mx-auto">
          <ShieldCheck className="w-4 h-4 text-lodge-700" />
          <span>Multi-Tenant Cloud Hospitality Platform</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-stone-900 tracking-tight leading-tight">
          Effortless Room Bookings &amp; Guest Billing for Modern Lodges
        </h1>
        <p className="mt-6 text-lg text-stone-600 max-w-2xl mx-auto">
          Self-serve onboarding for lodge owners. Instant room dashboard, fast reception check-in, real-time occupancy, and automated billing calculation — with strict tenant data isolation.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 text-base font-medium rounded-xl text-white bg-lodge-700 hover:bg-lodge-800 shadow-md hover:shadow-lg transition-all"
          >
            <UserPlus className="w-5 h-5" />
            <span>Register Your Lodge</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 text-base font-medium rounded-xl text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 shadow-sm transition-all"
          >
            <LogIn className="w-5 h-5 text-stone-500" />
            <span>Staff / Admin Login</span>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-900 text-sm">Instant Room Dashboard</h3>
            <p className="mt-1 text-xs text-stone-500 leading-relaxed">
              At-a-glance occupancy status with rapid 2-minute booking and checkout flow.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-900 text-sm">Tenant Isolation by RLS</h3>
            <p className="mt-1 text-xs text-stone-500 leading-relaxed">
              Database-level Row Level Security guarantees complete privacy across all lodges.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-lodge-100 text-lodge-800 flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-900 text-sm">Desktop App Packaging</h3>
            <p className="mt-1 text-xs text-stone-500 leading-relaxed">
              Native desktop experience distributed via GitHub Releases for easy staff deployment. <Link href="/install" className="text-lodge-700 font-medium hover:underline">Download App &rarr;</Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500">
        <p>&copy; {new Date().getFullYear()} LodgeOS SaaS Platform. Multi-Tenant Architecture.</p>
      </footer>
    </div>
  );
}
