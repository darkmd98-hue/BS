"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface HeaderProps {
  lodgeName: string;
  userName?: string;
  userRole?: string;
  onSearchSelect?: (destination: string) => void;
}

export function Header({
  lodgeName,
  userName = "Staff User",
  userRole = "Reception",
  onSearchSelect,
}: HeaderProps) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(true);
  const [showNotifs, setShowNotifs] = useState(false);
  const router = useRouter();

  const NOTIFS = [
    { icon: "⏰", text: "Room 102 checkout due in 30 minutes", time: "10 min ago", unread: true },
    { icon: "💰", text: "Room 205 payment pending", time: "25 min ago", unread: true },
    { icon: "📋", text: "Upcoming check-in scheduled today", time: "1 hr ago", unread: true },
    { icon: "✅", text: "Room 108 maintenance completed", time: "2 hr ago", unread: false },
  ];

  const initials = userName
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 shrink-0 z-30 relative">
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none" aria-hidden="true">
          🔍
        </span>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Search rooms, guests, bills..."
          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-gray-800 placeholder-gray-400"
        />
        {open && q.length > 1 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="px-4 py-3 text-xs text-gray-400 border-b border-gray-50">
              Quick Navigation
            </div>
            <button
              onMouseDown={() => {
                setQ("");
                if (onSearchSelect) onSearchSelect("/reception/rooms");
                else router.push("/reception");
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-left transition-colors"
            >
              <span className="text-base" aria-hidden="true">🛏</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">Rooms & Status</div>
                <div className="text-xs text-gray-400 truncate">View room booking grid</div>
              </div>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors text-base cursor-pointer"
            aria-label="Notifications"
          >
            <span aria-hidden="true">🔔</span>
            {notifs && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                <button
                  onClick={() => setNotifs(false)}
                  className="text-xs text-blue-600 font-medium hover:text-blue-800 cursor-pointer"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {NOTIFS.map((n, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 ${
                      n.unread ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <span className="text-lg shrink-0 mt-0.5" aria-hidden="true">{n.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-gray-800 leading-snug">{n.text}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{n.time}</p>
                    </div>
                    {n.unread && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100 ml-1">
          <div className="w-8 h-8 bg-[#0b1437] rounded-full flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
          <div className="hidden sm:block">
            <div className="text-[13px] font-semibold text-gray-800 leading-none">{userName}</div>
            <div className="text-[11px] text-gray-400 mt-0.5 capitalize">{userRole}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

