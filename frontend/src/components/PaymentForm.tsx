"use client";

import { FormEvent, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Booking } from "@/lib/types";
import { formatMoney } from "@/lib/format";

/**
 * Simple mock payment form. No real card processing — it validates presence and calls the
 * booking payment endpoint, which confirms the booking.
 */
export function PaymentForm({
  booking,
  onPaid,
}: {
  booking: Booking;
  onPaid: (b: Booking) => void;
}) {
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const paid = await api.payBooking(booking.id, {
        cardHolder,
        cardNumber,
        expiry,
        cvc,
      });
      onPaid(paid);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Payment failed.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-amber-100 bg-amber-50/40 p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Payment</h2>
        <span className="text-sm text-slate-500">
          Amount due{" "}
          <span className="font-semibold text-slate-900">
            {formatMoney(booking.totalPrice, booking.currency)}
          </span>
        </span>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Cardholder name
        </span>
        <input
          value={cardHolder}
          onChange={(e) => setCardHolder(e.target.value)}
          placeholder="As shown on card"
          className={inputClass}
          required
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Card number
        </span>
        <input
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          placeholder="4111 1111 1111 1111"
          inputMode="numeric"
          className={inputClass}
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Expiry
          </span>
          <input
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            placeholder="MM/YY"
            className={inputClass}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            CVC
          </span>
          <input
            value={cvc}
            onChange={(e) => setCvc(e.target.value)}
            placeholder="123"
            inputMode="numeric"
            className={inputClass}
            required
          />
        </label>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 font-medium text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
      >
        {submitting
          ? "Processing…"
          : `Pay ${formatMoney(booking.totalPrice, booking.currency)}`}
      </button>
      <p className="text-center text-xs text-slate-400">
        Demo payment — no real card is charged.
      </p>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
