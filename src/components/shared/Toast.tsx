"use client";

import React, { useEffect } from "react";

export interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 3500 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium animate-in slide-in-from-bottom-4 ${
        type === "success" ? "bg-gray-900 text-white" : "bg-red-600 text-white"
      }`}
    >
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          type === "success" ? "bg-emerald-400 text-gray-900" : "bg-white/30 text-white"
        }`}
      >
        {type === "success" ? "✓" : "✕"}
      </span>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-3 opacity-60 hover:opacity-100 text-lg leading-none cursor-pointer"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}

