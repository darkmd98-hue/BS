import React from "react";

export type RoomStatus = "available" | "occupied" | "reserved" | "cleaning" | "maintenance";

const STATUS_CFG: Record<RoomStatus, { label: string; bg: string; text: string; dot: string; bar: string }> = {
  available:   { label: "AVAILABLE",   bg: "bg-emerald-50",  text: "text-emerald-700",  dot: "bg-emerald-500",  bar: "bg-emerald-500" },
  occupied:    { label: "OCCUPIED",    bg: "bg-red-50",      text: "text-red-700",      dot: "bg-red-500",      bar: "bg-red-500"     },
  reserved:    { label: "RESERVED",    bg: "bg-amber-50",    text: "text-amber-700",    dot: "bg-amber-500",    bar: "bg-amber-400"   },
  cleaning:    { label: "CLEANING",    bg: "bg-sky-50",      text: "text-sky-700",      dot: "bg-sky-500",      bar: "bg-sky-500"     },
  maintenance: { label: "MAINTENANCE", bg: "bg-slate-100",   text: "text-slate-600",    dot: "bg-slate-400",    bar: "bg-slate-400"   },
};

export function StatusBadge({ status }: { status: RoomStatus | string }) {
  const normalized = (status.toLowerCase() as RoomStatus) || "available";
  const c = STATUS_CFG[normalized] || STATUS_CFG.available;

  return (
    <span
      role="status"
      aria-label={`Room status: ${c.label}`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wider ${c.bg} ${c.text}`}
    >
      <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

