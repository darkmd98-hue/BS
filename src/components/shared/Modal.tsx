"use client";

import React, { useEffect } from "react";

export interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  danger?: boolean;
}

export function Modal({ title, children, onClose, danger }: ModalProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div
          className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between ${
            danger ? "bg-red-50" : "bg-white"
          }`}
        >
          <h3 className="font-semibold text-gray-900 text-[15px]">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

