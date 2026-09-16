"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, ArrowRight, ShieldCheck, Hotel, Loader2, Sparkles } from "lucide-react";
import { requestGuestOtpAction, verifyGuestOtpAction } from "@/app/actions/guest";

export function GuestLoginForm({
  lodgeName,
  lodgeId,
  initialReservationId,
}: {
  lodgeName: string;
  lodgeId: string;
  initialReservationId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const [bookingRef, setBookingRef] = useState(initialReservationId || "");
  const [otp, setOtp] = useState("");
  const [targetResId, setTargetResId] = useState(initialReservationId || "");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.append("email", email);
    fd.append("booking_ref", bookingRef);
    fd.append("lodge_id", lodgeId);

    startTransition(async () => {
      const res = await requestGuestOtpAction(fd);
      if (res.success && res.reservationId) {
        setTargetResId(res.reservationId);
        if (res.demoOtp) {
          setDemoCode(res.demoOtp);
        }
        setStep("verify");
      } else {
        setError(res.error || "Could not find a reservation matching that email.");
      }
    });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.append("otp", otp);
    fd.append("reservation_id", targetResId);
    fd.append("lodge_id", lodgeId);

    startTransition(async () => {
      const res = await verifyGuestOtpAction(fd);
      if (res.success && res.reservationId) {
        router.push(`/guest/${res.reservationId}`);
      } else {
        setError(res.error || "Invalid verification code.");
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0b1437] text-white shadow-lg mb-4">
          <Hotel className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">{lodgeName}</h1>
        <p className="text-sm text-gray-500 mt-1">Guest Portal & Digital Concierge</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-7 space-y-6">
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {step === "request" ? (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label htmlFor="guest_email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address or Booking Ref
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="guest_email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter guest email (e.g. john@example.com)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-gray-900"
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#0b1437] hover:bg-[#162268] text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Continue to My Stay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 justify-center text-[11px] text-gray-400 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Passwordless secure access via 6-digit one-time passcode</span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="text-center">
              <div className="inline-flex p-2.5 bg-blue-50 text-blue-600 rounded-full mb-2">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Enter Verification Code</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                We sent a 6-digit code to your email.
              </p>
            </div>

            {demoCode && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-4 h-4 text-amber-600" /> Demo code:
                </span>
                <span className="font-mono font-black text-sm tracking-widest bg-white px-2 py-0.5 rounded border border-amber-200">
                  {demoCode}
                </span>
              </div>
            )}

            <div>
              <label htmlFor="guest_otp" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 text-center">
                6-Digit Passcode
              </label>
              <input
                type="text"
                id="guest_otp"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-gray-900 font-bold"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isPending || otp.length < 6}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#0b1437] hover:bg-[#162268] text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Verify & Access Stay</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setStep("request")}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                &larr; Try another email
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-gray-400">
        Powered by LodgeOS &bull; Hospitality Management System
      </div>
    </div>
  );
}
