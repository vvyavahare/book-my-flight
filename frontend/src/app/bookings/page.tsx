"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { Booking, RefundQuote } from "@/lib/types";
import { formatDateTime, formatMoney } from "@/lib/format";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { ModifyBookingForm } from "@/components/ModifyBookingForm";
import { PaymentForm } from "@/components/PaymentForm";
import { BookingDetails } from "@/components/BookingDetails";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function MyBookingsPage() {
  const { ready, isAuthenticated } = useRequireAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !isAuthenticated) return;
    let active = true;
    api
      .listMyBookings()
      .then((list) => {
        if (active) setBookings(list);
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof ApiError ? err.message : "Could not load bookings.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ready, isAuthenticated]);

  function replace(updated: Booking) {
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }

  if (!ready || !isAuthenticated || loading) {
    return <div className="mt-20 text-center text-slate-400">Loading…</div>;
  }

  return (
    <div className="space-y-5">
      <section className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          My bookings
        </h1>
        <p className="mt-1 text-slate-500">
          Pay for, modify or cancel your trips.
        </p>
      </section>

      {error && (
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-10 text-center text-slate-400">
          You have no bookings yet.{" "}
          <Link href="/" className="font-medium text-indigo-600 underline">
            Search for a flight
          </Link>
          .
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <BookingRow key={b.id} booking={b} onChange={replace} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingRow({
  booking,
  onChange,
}: {
  booking: Booking;
  onChange: (b: Booking) => void;
}) {
  const [mode, setMode] = useState<"none" | "pay" | "modify" | "details">(
    "none",
  );
  const [quote, setQuote] = useState<RefundQuote | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pending = booking.status === "PENDING_PAYMENT";
  const cancelled =
    booking.status === "CANCELLED" || booking.status === "REFUNDED";

  async function loadQuote() {
    setError(null);
    try {
      const q = await api.getRefundQuote(booking.id);
      setQuote(q);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load refund quote.",
      );
    }
  }

  async function confirmCancel() {
    if (
      !window.confirm(
        quote
          ? `Cancel booking ${booking.reference}? You will be refunded ${quote.amount} (${quote.percent}%).`
          : `Cancel booking ${booking.reference}?`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await api.cancelBooking(booking.id);
      onChange(updated);
      setQuote(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not cancel.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/60 bg-white/85 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-slate-700">
              {booking.reference}
            </span>
            <BookingStatusBadge status={booking.status} />
          </div>
          <div className="mt-1 text-sm text-slate-600">
            {booking.origin} → {booking.destination} · {booking.flightNumber} ·{" "}
            {formatDateTime(booking.departureTime)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {booking.passengers
              .map((p) => `${p.firstName} ${p.lastName}`)
              .join(", ")}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-slate-900">
            {formatMoney(booking.totalPrice, booking.currency)}
          </div>
          {cancelled && booking.refundAmount > 0 && (
            <div className="text-xs text-emerald-600">
              refunded {formatMoney(booking.refundAmount, booking.currency)}
            </div>
          )}
        </div>
      </div>

      {!cancelled && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={() => setMode(mode === "details" ? "none" : "details")}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {mode === "details" ? "Hide details" : "View details"}
          </button>
          {pending && (
            <button
              onClick={() => setMode(mode === "pay" ? "none" : "pay")}
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95"
            >
              {mode === "pay" ? "Close" : "Pay now"}
            </button>
          )}
          <button
            onClick={() => setMode(mode === "modify" ? "none" : "modify")}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {mode === "modify" ? "Close" : "Modify"}
          </button>
          {quote ? (
            <button
              onClick={confirmCancel}
              disabled={busy}
              className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
            >
              {busy
                ? "Cancelling…"
                : `Confirm cancel · refund ${formatMoney(quote.amount, booking.currency)} (${quote.percent}%)`}
            </button>
          ) : (
            <button
              onClick={loadQuote}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel…
            </button>
          )}
        </div>
      )}

      {cancelled && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <button
            onClick={() => setMode(mode === "details" ? "none" : "details")}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {mode === "details" ? "Hide details" : "View details"}
          </button>
        </div>
      )}

      {quote && !cancelled && (
        <p className="mt-2 text-xs text-slate-500">{quote.reason}</p>
      )}

      {error && (
        <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </div>
      )}

      {mode === "pay" && pending && (
        <div className="mt-3">
          <PaymentForm
            booking={booking}
            onPaid={(b) => {
              onChange(b);
              setMode("none");
            }}
          />
        </div>
      )}

      {mode === "details" && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <BookingDetails booking={booking} />
        </div>
      )}

      {mode === "modify" && (
        <ModifyBookingForm
          booking={booking}
          onSaved={(b) => {
            onChange(b);
            setMode("none");
          }}
          onCancel={() => setMode("none")}
        />
      )}
    </div>
  );
}
