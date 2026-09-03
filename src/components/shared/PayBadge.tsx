import React from "react";

export type PaymentStatus = "paid" | "partial" | "unpaid" | "pending";

const PAY_CFG: Record<string, { label: string; bg: string; text: string }> = {
  paid:    { label: "Paid",    bg: "bg-emerald-50", text: "text-emerald-700" },
  partial: { label: "Partial", bg: "bg-amber-50",   text: "text-amber-700"  },
  unpaid:  { label: "Unpaid",  bg: "bg-red-50",     text: "text-red-600"    },
  pending: { label: "Pending", bg: "bg-amber-50",   text: "text-amber-700"  },
};

export function PayBadge({ status }: { status: PaymentStatus | string }) {
  const normalized = (status.toLowerCase() as PaymentStatus) || "pending";
  const c = PAY_CFG[normalized] || PAY_CFG.pending;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

