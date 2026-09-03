"use client";

import { CheckCircle2, AlertTriangle, X, LogOut } from "lucide-react";

interface CheckoutConfirmProps {
  guestName: string;
  roomNumber: string;
  balanceDue: number;
  paymentMode: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CheckoutConfirm({
  guestName,
  roomNumber,
  balanceDue,
  paymentMode,
  isOpen,
  onClose,
  onConfirm,
}: CheckoutConfirmProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2 text-stone-900 font-bold font-serif text-lg">
            <LogOut className="w-5 h-5 text-lodge-700" />
            <span>Confirm Guest Checkout</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-stone-600">
          <p>
            You are checking out <strong>{guestName}</strong> from <strong>Room {roomNumber}</strong>.
          </p>

          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-2">
            <div className="flex justify-between">
              <span>Settlement Balance:</span>
              <span className="font-bold text-stone-900">₹{balanceDue.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Mode:</span>
              <span className="font-semibold text-stone-800 uppercase">{paymentMode}</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              This will mark the booking as <strong>checked_out</strong>, settle the bill, and flip Room {roomNumber} status back to <strong>available</strong>.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-lodge-700 hover:bg-lodge-800 text-white text-xs font-semibold shadow-sm cursor-pointer"
          >
            Confirm &amp; Settle
          </button>
        </div>
      </div>
    </div>
  );
}
