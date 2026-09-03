"use client";

import Link from "next/link";
import { Download, CheckCircle2, Monitor, Rocket, ArrowRight, ShieldCheck } from "lucide-react";

export function InstallLinkScreen() {
  const downloadUrl =
    process.env.NEXT_PUBLIC_TAURI_RELEASES_URL ||
    "https://github.com/darkmd98-hue/BS/releases/latest";

  return (
    <div className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Header & Hero Section */}
      <div className="col-span-1 md:col-span-12 text-center mb-2 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-3">
          <span className="font-display text-2xl font-bold text-gray-900">LodgeOS</span>
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Lodge Successfully Registered</span>
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 font-display mb-2">
          Download Your Front Desk Client
        </h1>
        <p className="text-sm text-gray-500 max-w-xl mx-auto">
          Your property partition is live. Download the Windows desktop terminal or launch the web administration portal.
        </p>
      </div>

      {/* Download Card (Bento Style) */}
      <div className="col-span-1 md:col-span-7 bg-white rounded-2xl border border-gray-100 p-8 shadow-xs flex flex-col justify-center items-center text-center relative overflow-hidden group">
        <div className="w-16 h-16 bg-[#0b1437] text-white rounded-2xl flex items-center justify-center mb-5 shadow-xs">
          <Monitor className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1.5 font-display">Desktop Client App</h2>
        <p className="text-xs text-gray-500 mb-6 max-w-sm">
          Optimized for offline resilience and rapid front-desk reception workflows.
        </p>
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#0b1437] text-white text-xs font-bold px-7 py-3 rounded-xl hover:bg-[#162268] transition-colors duration-200 flex items-center gap-2 w-full sm:w-auto justify-center shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Download Desktop App (Windows)</span>
        </a>
        <p className="text-[11px] text-gray-400 mt-4">v0.1.0-beta via GitHub Releases</p>
      </div>

      {/* Setup Guide Card (Bento Style) */}
      <div className="col-span-1 md:col-span-5 bg-gray-50/70 rounded-2xl border border-gray-100 p-8 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-6 border-b border-gray-200/60 pb-3.5">
            <Rocket className="w-4 h-4 text-[#0b1437]" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Quick Start Guide</h3>
          </div>
          <ul className="space-y-4">
            <li className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[#0b1437] text-white flex items-center justify-center text-xs font-bold shrink-0">
                1
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Install Terminal</h4>
                <p className="text-xs text-gray-500 mt-0.5">Run the lightweight client on your reception desk PC.</p>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold shrink-0">
                2
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Sign In</h4>
                <p className="text-xs text-gray-500 mt-0.5">Use the admin credentials you just created.</p>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold shrink-0">
                3
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Configure Rooms</h4>
                <p className="text-xs text-gray-500 mt-0.5">Set room inventory and invite receptionist staff.</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="pt-5 mt-5 border-t border-gray-200/60 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>PostgreSQL RLS Active</span>
          </div>
        </div>
      </div>

      {/* Secondary Action */}
      <div className="col-span-1 md:col-span-12 text-center mt-2">
        <Link
          href="/admin"
          className="text-xs font-semibold text-[#0b1437] hover:text-[#162268] inline-flex items-center gap-1 group"
        >
          <span>Or continue to Web Admin Portal</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
