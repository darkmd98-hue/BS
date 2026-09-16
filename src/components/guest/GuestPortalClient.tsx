"use client";

import { useState, useTransition } from "react";
import {
  Hotel,
  Calendar,
  CreditCard,
  Printer,
  Clock,
  Phone,
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Info,
  LogOut,
} from "lucide-react";
import type { GuestReservationData } from "@/lib/guest";
import { requestEarlyCheckoutAction, sendGuestMessageAction } from "@/app/actions/guest";
import { formatCurrency } from "@/lib/utils";

export function GuestPortalClient({ data }: { data: GuestReservationData }) {
  const { reservation, customer, room, bill, lodge, messages: initialMessages } = data;

  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMsg, startSendingMsg] = useTransition();

  // Early Checkout
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutTime, setCheckoutTime] = useState("10:00");
  const [checkoutNotes, setCheckoutNotes] = useState("");
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [isRequestingCheckout, startRequestingCheckout] = useTransition();

  const handleSendMessage = (e?: React.FormEvent, preset?: string) => {
    if (e) e.preventDefault();
    const text = preset || newMessage.trim();
    if (!text) return;

    const fd = new FormData();
    fd.append("reservation_id", reservation.id);
    fd.append("lodge_id", lodge.id);
    fd.append("guest_name", customer.name);
    fd.append("message", text);

    startSendingMsg(async () => {
      const res = await sendGuestMessageAction(fd);
      if (res.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: `temp_${Date.now()}`,
            sender: "guest",
            sender_name: customer.name,
            message: text,
            created_at: new Date().toISOString(),
          },
        ]);
        if (!preset) setNewMessage("");
      }
    });
  };

  const handleEarlyCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("reservation_id", reservation.id);
    fd.append("lodge_id", lodge.id);
    fd.append("guest_name", customer.name);
    fd.append("preferred_time", checkoutTime);
    fd.append("notes", checkoutNotes);

    startRequestingCheckout(async () => {
      const res = await requestEarlyCheckoutAction(fd);
      if (res.success) {
        setCheckoutSuccess(true);
        setTimeout(() => {
          setShowCheckoutModal(false);
          setCheckoutSuccess(false);
        }, 2000);
      }
    });
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-16">
      {/* Top Navigation Bar */}
      <header className="bg-[#0b1437] text-white py-4 px-6 sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <Hotel className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight">{lodge.name}</h1>
              <p className="text-[11px] text-gray-300">Guest Digital Concierge</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={printInvoice}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <a
              href="/guest/login"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#0b1437] to-[#1c2966] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white uppercase tracking-wider mb-2">
              Welcome, {customer.name}
            </span>
            <h2 className="text-2xl font-black tracking-tight mb-2">
              Room {room.room_number} &bull; {room.room_type}
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              We hope you are enjoying your stay at {lodge.name}. You can manage your booking, review charges, and connect directly with our front desk below.
            </p>
          </div>
          <div className="absolute right-6 bottom-4 opacity-10 hidden sm:block">
            <Hotel className="w-44 h-44" />
          </div>
        </div>

        {/* Quick Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Stay Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-gray-600">Your Stay</h3>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                  reservation.status === "confirmed" || reservation.status === "active"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {reservation.status}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Check-in</span>
                <span className="font-bold text-gray-800">
                  {new Date(reservation.check_in).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Check-out</span>
                <span className="font-bold text-gray-800">
                  {new Date(reservation.check_out).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Room Info</span>
                <span className="font-bold text-gray-800">
                  {room.bed_type} Bed &bull; Floor {room.floor || 1}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-400">Guests</span>
                <span className="font-bold text-gray-800">{reservation.guests} Guest(s)</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowCheckoutModal(true)}
                className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Request Early Checkout</span>
              </button>
            </div>
          </div>

          {/* Card 2: Billing & Folio */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-gray-600">Bill & Folio</h3>
              </div>
              {bill && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    bill.payment_status === "paid"
                      ? "bg-emerald-50 text-emerald-700"
                      : bill.payment_status === "partial"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {bill.payment_status}
                </span>
              )}
            </div>

            {bill ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Total Billed</span>
                  <span className="font-bold text-gray-900">{formatCurrency(bill.net_amount)}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Advance / Paid</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(bill.received)}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-400 font-bold">Outstanding Balance</span>
                  <span className="font-black text-sm text-red-600">{formatCurrency(bill.balance)}</span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-gray-400">
                Bill is being compiled by front desk upon checkout.
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={printInvoice}
                className="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-gray-600" />
                <span>View & Print Bill</span>
              </button>
            </div>
          </div>

          {/* Card 3: Lodge Contacts & Rules */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-600">Property Rules</h3>
            </div>

            <div className="space-y-2.5 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-800">Check-out Time: </span>
                  <span>{lodge.check_out_time || "11:00 AM"}</span>
                </div>
              </div>
              {lodge.contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>Reception: {lodge.contact_phone}</span>
                </div>
              )}
              {lodge.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{lodge.contact_email}</span>
                </div>
              )}
              <div className="pt-1">
                <span className="inline-block text-[11px] text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
                  {lodge.pet_friendly ? "🐾 Pet Friendly Property" : "🚭 Non-Smoking & Quiet Hours: 10 PM"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messaging / Front Desk Chat */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">Front Desk Assistant</h3>
                <p className="text-[11px] text-gray-400">Direct message exchange with on-duty staff</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Reception Online
            </span>
          </div>

          {/* Quick Request Chips */}
          <div className="px-5 py-3 bg-gray-50/70 border-b border-gray-100 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
              Quick Requests:
            </span>
            {[
              "Need fresh towels 🧻",
              "What is the WiFi password? 📶",
              "Housekeeping please 🧹",
              "Taxi for departure 🚕",
              "Extra water bottles 💧",
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => handleSendMessage(undefined, chip)}
                disabled={isSendingMsg}
                className="shrink-0 px-3 py-1 bg-white border border-gray-200 rounded-full hover:border-blue-400 hover:text-blue-600 font-medium transition-colors shadow-2xs text-[11px]"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Message Thread */}
          <div className="p-5 space-y-3 min-h-[220px] max-h-[360px] overflow-y-auto bg-gray-50/30">
            {messages.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No messages yet. Ask anything or choose a quick request above!
              </div>
            ) : (
              messages.map((m) => {
                const isGuest = m.sender === "guest";
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isGuest ? "items-end" : "items-start"}`}
                  >
                    <div className="text-[10px] text-gray-400 mb-1 px-1">
                      {isGuest ? "You" : `Front Desk (${m.sender_name})`} &bull;{" "}
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div
                      className={`max-w-md px-4 py-2.5 rounded-2xl text-xs font-medium ${
                        isGuest
                          ? "bg-[#0b1437] text-white rounded-br-xs shadow-xs"
                          : "bg-white border border-gray-200 text-gray-800 rounded-bl-xs shadow-xs"
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 flex items-center gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message or special request..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-800"
            />
            <button
              type="submit"
              disabled={isSendingMsg || !newMessage.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0b1437] hover:bg-[#162268] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-40"
            >
              {isSendingMsg ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Early Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-gray-900">Request Early Checkout</h3>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {checkoutSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-sm text-gray-900">Request Received!</h4>
                <p className="text-xs text-gray-500">
                  Front desk has been alerted and will prepare your bill.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEarlyCheckout} className="space-y-4">
                <p className="text-xs text-gray-500">
                  Notify the front desk of your early departure so we can prepare your final folio and room inspection.
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Preferred Departure Time
                  </label>
                  <input
                    type="time"
                    value={checkoutTime}
                    onChange={(e) => setCheckoutTime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Notes / Luggage Assistance
                  </label>
                  <textarea
                    rows={2}
                    value={checkoutNotes}
                    onChange={(e) => setCheckoutNotes(e.target.value)}
                    placeholder="e.g. Please arrange airport cab, or luggage assistance needed."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 text-gray-800 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCheckoutModal(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRequestingCheckout}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isRequestingCheckout ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Confirm Checkout Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

