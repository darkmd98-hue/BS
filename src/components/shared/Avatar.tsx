import React from "react";

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const AV_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-teal-100 text-teal-700",
];

export function Avatar({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const safeName = name || "User";
  const idx = safeName.charCodeAt(0) % AV_COLORS.length;
  const sz =
    size === "sm"
      ? "w-7 h-7 text-xs"
      : size === "lg"
      ? "w-12 h-12 text-base"
      : "w-9 h-9 text-sm";

  return (
    <div
      className={`${sz} ${AV_COLORS[idx]} rounded-full flex items-center justify-center font-bold shrink-0 ${className}`}
    >
      {initials(safeName)}
    </div>
  );
}

