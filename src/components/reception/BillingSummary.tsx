"use client";

import { useState } from "react";
import { CreditCard, Printer, Save, CheckCircle2, User, Calendar, ShieldCheck, ArrowRight } from "lucide-react";
import { CheckoutConfirm } from "./CheckoutConfirm";

export function BillingSummary() {
  const [paymentMode, setPaymentMode] = useState("upi");
  const [settleAmount, setSettleAmount] = useState(5000);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSettled, setIsSettled] = useState(false);

  const guestName = "Vikram Mehta";
  const roomNumber = "201";
  const totalAmount = 9000;
  const advanceAmount = 4000;
  const balanceDue = Math.max(0, totalAmount - (advanceAmount + (isSettled ? settleAmount : 0)));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-stone-900 font-serif">
              Guest Billing &amp; Invoicing
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700">
              #BK-8821
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-lodge-100 text-lodge-800">
              Room {roomNumber}
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Guest: <strong>{guestName}</strong> &bull; Stay: Aug 20 – Aug 25 (5 Nights) &bull; Phone: +91 99123 44556
          </p>
        </div>

        <div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isSettled
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isSettled ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span>{isSettled ? "Settled" : "Partial Payment"}</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Breakdown & Payment Collection */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Breakdown Card */}
        <div className="col-span-1 md:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-lodge-800 border-b border-stone-100 pb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-lodge-700" />
            <span>Invoice Breakdown</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-stone-50">
              <span className="text-stone-600">Room Charges (5 Nights &times; ₹1,800/night)</span>
              <span className="font-semibold text-stone-900">₹9,000</span>
            </div>
            <div className="flex justify-between py-2 border-b border-stone-50">
              <span className="text-stone-600">Advance Amount Paid at Check-in</span>
              <span className="font-semibold text-emerald-700">-₹4,000</span>
            </div>
            {isSettled && (
              <div className="flex justify-between py-2 border-b border-stone-50">
                <span className="text-stone-600">Checkout Settlement Paid</span>
                <span className="font-semibold text-emerald-700">-₹5,000</span>
              </div>
            )}
          </div>

          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-2">
            <div className="flex justify-between text-xs text-stone-600">
              <span>Total Invoice Amount</span>
              <span className="font-bold text-stone-900">₹{totalAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-xs text-stone-600">
              <span>Total Paid</span>
              <span className="font-bold text-emerald-700">
                ₹{(advanceAmount + (isSettled ? settleAmount : 0)).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="pt-2 border-t border-stone-200 flex justify-between items-center">
              <span className="text-xs font-bold text-stone-900 uppercase">Balance Due</span>
              <span className="text-lg font-extrabold text-lodge-800">
                ₹{balanceDue.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Collection Box */}
        <div className="col-span-1 md:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-lodge-800 border-b border-stone-100 pb-3">
              Collect Payment
            </h2>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Settlement Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={settleAmount}
                disabled={isSettled}
                onChange={(e) => setSettleAmount(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2 text-sm font-bold text-stone-900 focus:outline-none focus:border-lodge-700 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                disabled={isSettled}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-lodge-700 disabled:opacity-60"
              >
                <option value="upi">UPI / QR Code</option>
                <option value="cash">Cash</option>
                <option value="card">Credit / Debit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Transaction Reference / Notes
              </label>
              <input
                type="text"
                placeholder="e.g. UPI Ref: 32901928"
                disabled={isSettled}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-lodge-700 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="pt-2 text-[11px] text-stone-400">
            Computed server-side with strict tenant security boundary.
          </div>
        </div>
      </div>

      {/* Action Bar (Separated Save Draft vs Checkout Settlement per uix.md §2.4) */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors w-full sm:w-auto"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft Changes</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors w-full sm:w-auto"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice Receipt</span>
          </button>
        </div>

        <div className="w-full sm:w-auto">
          <button
            type="button"
            disabled={isSettled}
            onClick={() => setIsConfirmOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-lodge-700 hover:bg-lodge-800 disabled:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSettled ? "Account Settled & Checked Out" : "Settle Balance & Complete Check-Out"}</span>
          </button>
        </div>
      </div>

      {/* Checkout Confirmation Dialog */}
      <CheckoutConfirm
        guestName={guestName}
        roomNumber={roomNumber}
        balanceDue={balanceDue}
        paymentMode={paymentMode}
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => setIsSettled(true)}
      />
    </div>
  );
}
