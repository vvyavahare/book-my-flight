"use client";

import { useEffect, useRef, useState } from "react";
import { AddFlightForm } from "@/components/AddFlightForm";
import { api, ApiError, bookingStreamUrl } from "@/lib/api";
import type { Booking } from "@/lib/types";
import { formatDateTime, formatMoney } from "@/lib/format";
import { useRequireAdmin } from "@/lib/useRequireAdmin";

export default function AdminPage() {
  const { ready, isAuthenticated, isAdmin } = useRequireAdmin();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const seen = useRef<Set<string>>(new Set());

  // Load the initial list of bookings.
  useEffect(() => {
    if (!ready || !isAuthenticated || !isAdmin) return;
    let active = true;
    api
      .listBookings()
      .then((list) => {
        if (!active) return;
        seen.current = new Set(list.map((b) => b.id));
        setBookings(list);
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof ApiError ? err.message : "Could not load bookings.",
          );
      });
    return () => {
      active = false;
    };
  }, [ready, isAuthenticated, isAdmin]);

  // Subscribe to the live booking feed (SSE).
  useEffect(() => {
    if (!ready || !isAuthenticated || !isAdmin) return;
    const source = new EventSource(bookingStreamUrl());

    source.addEventListener("open", () => setLive(true));
    source.addEventListener("booking", (event) => {
      try {
        const booking = JSON.parse((event as MessageEvent).data) as Booking;
        setBookings((prev) => {
          if (seen.current.has(booking.id)) return prev;
          seen.current.add(booking.id);
          return [booking, ...prev];
        });
        setFlashId(booking.id);
        window.setTimeout(() => setFlashId(null), 2500);
      } catch {
        /* ignore malformed event */
      }
    });
    source.onerror = () => setLive(false);

    return () => source.close();
  }, [ready, isAuthenticated, isAdmin]);

  if (!ready || !isAuthenticated || !isAdmin) {
    return <div className="mt-20 text-center text-slate-400">Loading…</div>;
  }

  return (
    <div className="space-y-8">
      <section className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          Admin dashboard
        </h1>
        <p className="mt-1 text-slate-500">
          Live view of every booking across the platform, plus flight management.
        </p>
      </section>

      <AddFlightForm />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Bookings{" "}
            <span className="text-sm font-normal text-slate-400">
              ({bookings.length})
            </span>
          </h2>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              live
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                live ? "animate-pulse bg-emerald-500" : "bg-slate-400"
              }`}
            />
            {live ? "Live" : "Offline"}
          </span>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        {bookings.length === 0 && !error ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-10 text-center text-slate-400">
            No bookings yet. When a traveller books a flight it appears here
            instantly.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/60 bg-white/85 shadow-sm backdrop-blur">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Booked by</th>
                  <th className="px-4 py-3">Flight</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Departs</th>
                  <th className="px-4 py-3">Passengers</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    className={
                      flashId === b.id
                        ? "bg-emerald-50 transition-colors"
                        : "transition-colors"
                    }
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                      {b.reference}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{b.bookedBy}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {b.flightNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {b.origin} → {b.destination}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDateTime(b.departureTime)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {b.passengers
                        .map((p) => `${p.firstName} ${p.lastName}`)
                        .join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatMoney(b.totalPrice, b.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
