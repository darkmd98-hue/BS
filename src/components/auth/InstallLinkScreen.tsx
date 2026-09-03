"use client";

import Link from "next/link";
import { Download, CheckCircle2, Monitor, Rocket, ArrowRight, ShieldCheck } from "lucide-react";

export function InstallLinkScreen() {
  const downloadUrl = process.env.NEXT_PUBLIC_TAURI_RELEASES_URL || "https://github.com/your-org/lodge-saas/releases/latest";

  return (
    <div className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Header & Hero Section */}
      <div className="col-span-1 md:col-span-12 text-center mb-4 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-serif text-2xl font-bold text-stone-900">LodgeOS</span>
          <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Lodge Successfully Registered</span>
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 font-serif mb-3">
          Welcome to LodgeOS — Download Your Client App
        </h1>
        <p className="text-base text-stone-600 max-w-2xl mx-auto">
          Your lodge account is live. Download the lightweight desktop client to start managing your reception desk.
        </p>
      </div>

      {/* Download Card (Bento Style) */}
      <div className="col-span-1 md:col-span-7 bg-white rounded-2xl border border-stone-200 p-8 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden group">
        <div className="w-16 h-16 bg-lodge-700 text-white rounded-2xl flex items-center justify-center mb-5 shadow-md">
          <Monitor className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Desktop App</h2>
        <p className="text-sm text-stone-600 mb-6 max-w-sm">
          Optimized for high-speed reception workflows on Windows machines.
        </p>
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-lodge-700 text-white text-sm font-semibold px-8 py-3.5 rounded-xl hover:bg-lodge-800 transition-colors duration-200 flex items-center gap-2 w-full sm:w-auto justify-center shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Download Desktop App (Windows)</span>
        </a>
        <p className="text-xs text-stone-400 mt-4">v1.0.0 via GitHub Releases</p>
      </div>

      {/* Setup Guide Card (Bento Style) */}
      <div className="col-span-1 md:col-span-5 bg-stone-50 rounded-2xl border border-stone-200 p-8 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-6 border-b border-stone-200 pb-4">
            <Rocket className="w-5 h-5 text-lodge-700" />
            <h3 className="text-base font-bold text-stone-900">Quick Start Guide</h3>
          </div>
          <ul className="space-y-5">
            <li className="flex gap-3.5 items-start">
              <div className="w-7 h-7 rounded-full bg-lodge-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                1
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Download &amp; install</h4>
                <p className="text-xs text-stone-600 mt-0.5">Run the installer on your reception PC.</p>
              </div>
            </li>
            <li className="flex gap-3.5 items-start">
              <div className="w-7 h-7 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-bold shrink-0">
                2
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Sign in</h4>
                <p className="text-xs text-stone-600 mt-0.5">Use the admin credentials you just created.</p>
              </div>
            </li>
            <li className="flex gap-3.5 items-start">
              <div className="w-7 h-7 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-bold shrink-0">
                3
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Add rooms &amp; staff</h4>
                <p className="text-xs text-stone-600 mt-0.5">Configure your lodge layout via the admin menu.</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="pt-6 mt-6 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cloud Sync Active</span>
          </div>
        </div>
      </div>

      {/* Secondary Action */}
      <div className="col-span-1 md:col-span-12 text-center mt-4">
        <Link
          href="/admin"
          className="text-xs font-semibold text-lodge-700 hover:text-lodge-800 inline-flex items-center gap-1 group"
        >
          <span>Or continue to Web Admin Portal</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
