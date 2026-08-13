"use client";

import { FormEvent, useState } from "react";
import type { Flight, PassengerInput } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import { useRouter } from "next/navigation";

const emptyPassenger = (): PassengerInput => ({
  firstName: "",
  lastName: "",
  passportNumber: "",
});

export function BookingForm({
  flight,
  onCancel,
}: {
  flight: Flight;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [contactEmail, setContactEmail] = useState("");
  const [passengers, setPassengers] = useState<PassengerInput[]>([
    emptyPassenger(),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updatePassenger(
    index: number,
    field: keyof PassengerInput,
    value: string,
  ) {
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  }

  function addPassenger() {
    if (passengers.length < flight.seatsAvailable) {
      setPassengers((prev) => [...prev, emptyPassenger()]);
    }
  }

  function removePassenger(index: number) {
    setPassengers((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const booking = await api.createBooking({
        flightId: flight.id,
        contactEmail,
        passengers: passengers.map((p) => ({
          firstName: p.firstName,
          lastName: p.lastName,
          passportNumber: p.passportNumber || undefined,
        })),
      });
      router.push(`/bookings/${booking.id}`);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not complete the booking. Please try again.";
      setError(message);
      setSubmitting(false);
    }
  }

  const total = formatMoney(flight.price * passengers.length, flight.currency);

  return (
    <div className="rounded-2xl border border-white/60 bg-white/85 p-6 shadow-lg backdrop-blur">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            {flight.origin} → {flight.destination}
          </h2>
          <p className="text-sm text-slate-500">
            {flight.airline} · {flight.flightNumber} ·{" "}
            {formatDateTime(flight.departureTime)}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-sm font-medium text-slate-400 transition hover:text-slate-600"
        >
          ✕ Close
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Contact email
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            required
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Passengers
            </span>
            <button
              type="button"
              onClick={addPassenger}
              disabled={passengers.length >= flight.seatsAvailable}
              className="text-sm font-medium text-indigo-600 transition hover:text-indigo-500 disabled:opacity-40"
            >
              + Add passenger
            </button>
          </div>

          {passengers.map((p, i) => (
            <div
              key={i}
              className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:grid-cols-3"
            >
              <input
                value={p.firstName}
                onChange={(e) => updatePassenger(i, "firstName", e.target.value)}
                placeholder="First name"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                required
              />
              <input
                value={p.lastName}
                onChange={(e) => updatePassenger(i, "lastName", e.target.value)}
                placeholder="Last name"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                required
              />
              <div className="flex items-center gap-2">
                <input
                  value={p.passportNumber}
                  onChange={(e) =>
                    updatePassenger(i, "passportNumber", e.target.value)
                  }
                  placeholder="Passport (optional)"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                {passengers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePassenger(i)}
                    className="shrink-0 text-slate-300 transition hover:text-rose-500"
                    aria-label="Remove passenger"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="text-sm text-slate-500">
            Total
            <span className="ml-2 text-lg font-bold text-slate-900">
              {total}
            </span>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-gradient-to-r from-indigo-500 to-sky-500 px-5 py-2.5 font-medium text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
          >
            {submitting ? "Booking…" : "Continue to payment"}
          </button>
        </div>
      </form>
    </div>
  );
}
