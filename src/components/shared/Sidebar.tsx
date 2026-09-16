"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export interface SidebarProps {
  lodgeName: string;
  subdomain: string;
  userName?: string;
  userRole?: "admin" | "reception";
  portalType: "admin" | "reception";
}

const ADMIN_NAV: NavGroup[] = [
  {
    group: "Main",
    items: [
      { id: "dashboard",     label: "Dashboard",       href: "/admin",                icon: "⊞" },
      { id: "rooms",         label: "Room Management", href: "/admin/rooms",           icon: "🏨" },
      { id: "staff",         label: "Users & Staff",   href: "/admin/staff",           icon: "👥" },
    ],
  },
  {
    group: "Operations",
    items: [
      { id: "housekeeping",  label: "Housekeeping",    href: "/admin/housekeeping",    icon: "🧹" },
      { id: "maintenance",   label: "Maintenance",     href: "/admin/maintenance",     icon: "🔧" },
      { id: "channels",      label: "Channel Manager", href: "/admin/channels",        icon: "🌐" },
    ],
  },
  {
    group: "Analytics",
    items: [
      { id: "reports",       label: "Reports",         href: "/admin/reports",         icon: "📊" },
      { id: "bi",            label: "Advanced BI & P&L", href: "/admin/bi",             icon: "📈" },
      { id: "multi-property", label: "Multi-Property", href: "/admin/multi-property", icon: "🏢" },
    ],
  },
  {
    group: "Config",
    items: [
      { id: "settings",      label: "Settings",        href: "/admin/settings",        icon: "⚙️" },
      { id: "roles",         label: "Roles & RBAC",    href: "/admin/roles",           icon: "🛡️" },
      { id: "payments",      label: "Payment Gateways", href: "/admin/payments",       icon: "💳" },
      { id: "notifications", label: "Notifications",   href: "/admin/notifications",   icon: "🔔" },
    ],
  },
  {
    group: "Shortcuts",
    items: [
      { id: "reception-desk", label: "Front Desk View", href: "/reception",            icon: "🛏" },
      { id: "mobile-staff",   label: "Mobile Companion", href: "/mobile",              icon: "📱" },
    ],
  },
];


const RECEPTION_NAV: NavGroup[] = [
  {
    group: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/reception", icon: "⊞" },
      { id: "room-booking", label: "Room Booking", href: "/reception/rooms", icon: "🛏" },
      { id: "reservations", label: "Reservations", href: "/reception/reservations", icon: "📋" },
      { id: "billing", label: "Bills & Payments", href: "/reception/billing", icon: "₹" },
      { id: "customers", label: "Customers", href: "/reception/customers", icon: "👥" },
      { id: "mobile-staff", label: "Mobile Companion", href: "/mobile", icon: "📱" },
    ],
  },
];

export function Sidebar({
  lodgeName,
  subdomain,
  userName = "Staff User",
  userRole = "admin",
  portalType,
}: SidebarProps) {
  const pathname = usePathname();
  const navGroups = portalType === "admin" ? ADMIN_NAV : RECEPTION_NAV;

  const lodgeInitials = lodgeName
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "LP";

  const userInitials = userName
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <aside className="w-[240px] bg-[#0b1437] flex flex-col h-full shrink-0 select-none">
      {/* Lodge Branding Logo & Property Switcher */}
      <div className="px-5 py-3.5 border-b border-white/8 space-y-2.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
            {lodgeInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-white font-bold text-sm leading-none truncate" title={lodgeName}>
              {lodgeName}
            </div>
            <div className="text-blue-300/80 text-[11px] mt-0.5 truncate">
              {subdomain}.lodge
            </div>
          </div>
        </div>

        {portalType === "admin" && (
          <Link
            href="/admin/multi-property"
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/6 hover:bg-white/10 text-blue-200/80 hover:text-white text-[11px] font-medium transition-colors border border-white/6"
            title="Switch property or view enterprise portfolio"
          >
            <span className="flex items-center gap-1.5 truncate">
              <span className="text-xs">🏢</span>
              <span className="truncate">Switch Property</span>
            </span>
            <span className="text-[10px] text-blue-300/60 font-mono">▾</span>
          </Link>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {navGroups.map((g) => (
          <div key={g.group} className="mb-3">
            <div className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-400/60">
              {g.group}
            </div>
            {g.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" && item.href !== "/reception" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all text-left mb-0.5 ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-blue-100/60 hover:bg-white/6 hover:text-blue-100"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-r-full" />
                  )}
                  <span className="text-[15px] w-5 text-center opacity-80">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User profile footer */}
      <div className="px-4 py-3.5 border-t border-white/8">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
            {userInitials}
          </div>
          <div className="min-w-0">
            <div className="text-white text-[13px] font-semibold truncate">{userName}</div>
            <div className="text-blue-300/60 text-[11px] capitalize">{userRole}</div>
          </div>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-blue-300/60 hover:text-blue-200 hover:bg-white/6 text-[12px] transition-colors cursor-pointer"
          >
            <span>↩</span> Logout
          </button>
        </form>
      </div>
    </aside>
  );
}

