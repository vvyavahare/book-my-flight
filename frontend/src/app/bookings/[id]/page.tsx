"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { Booking } from "@/lib/types";
import { formatDateTime, formatMoney } from "@/lib/format";
import { PaymentForm } from "@/components/PaymentForm";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { ready, isAuthenticated } = useRequireAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !isAuthenticated) return;
    let active = true;
    api
      .getBooking(id)
      .then((b) => {
        if (active) setBooking(b);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof ApiError ? err.message : "Could not load booking.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, ready, isAuthenticated]);

  if (!ready || !isAuthenticated || loading) {
    return <div className="mt-20 text-center text-slate-400">Loading…</div>;
  }

  if (error || !booking) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center text-rose-600">
        {error ?? "Booking not found."}
        <div className="mt-4">
          <Link href="/" className="text-sm font-medium text-slate-700 underline">
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  const pending = booking.status === "PENDING_PAYMENT";
  const cancelled =
    booking.status === "CANCELLED" || booking.status === "REFUNDED";

  return (
    <div className="mx-auto mt-6 max-w-2xl space-y-5">
      <div className="rounded-2xl border border-white/60 bg-white/85 p-8 shadow-xl shadow-indigo-100 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-11 w-11 place-items-center rounded-full text-2xl ${
                pending
                  ? "bg-amber-100 text-amber-600"
                  : cancelled
                    ? "bg-slate-100 text-slate-500"
                    : "bg-emerald-100 text-emerald-600"
              }`}
            >
              {pending ? "•" : cancelled ? "✕" : "✓"}
            </span>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">
                {pending
                  ? "Almost there — complete payment"
                  : cancelled
                    ? "Booking cancelled"
                    : "Booking confirmed"}
              </h1>
              <p className="text-sm text-slate-500">
                Reference{" "}
                <span className="font-mono font-semibold text-slate-700">
                  {booking.reference}
                </span>
              </p>
            </div>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-slate-50/70 p-4 text-sm">
          <Info label="Route" value={`${booking.origin} → ${booking.destination}`} />
          <Info label="Flight" value={booking.flightNumber} />
          <Info label="Departs" value={formatDateTime(booking.departureTime)} />
          <Info label="Contact" value={booking.contactEmail} />
          <Info
            label="Total"
            value={formatMoney(booking.totalPrice, booking.currency)}
            valueClass="font-semibold text-slate-900"
          />
          <Info
            label={cancelled ? "Refunded" : "Paid"}
            value={formatMoney(
              cancelled ? booking.refundAmount : booking.amountPaid,
              booking.currency,
            )}
            valueClass="font-semibold text-slate-900"
          />
        </div>

        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            Passengers
          </h2>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
            {booking.passengers.map((p, i) => (
              <li
                key={i}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="text-slate-700">
                  {p.firstName} {p.lastName}
                </span>
                {p.passportNumber && (
                  <span className="font-mono text-xs text-slate-400">
                    {p.passportNumber}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex justify-between">
          <Link
            href="/bookings"
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            My bookings
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Book another flight
          </Link>
        </div>
      </div>

      {pending && <PaymentForm booking={booking} onPaid={setBooking} />}
    </div>
  );
}

function Info({
  label,
  value,
  valueClass = "text-slate-800",
  span = false,
}: {
  label: string;
  value: string;
  valueClass?: string;
  span?: boolean;
}) {
  return (
    <div className={span ? "col-span-2" : undefined}>
      <div className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className={`break-words ${valueClass}`}>{value}</div>
    </div>
  );
}
