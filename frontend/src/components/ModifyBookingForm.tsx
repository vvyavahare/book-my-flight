"use client";

import { FormEvent, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Booking, PassengerInput } from "@/lib/types";

/**
 * Edit passenger details / contact email. The backend enforces the rules: passenger count
 * is fixed and only minor spelling corrections are allowed (no ticket transfer). We surface
 * those errors inline.
 */
export function ModifyBookingForm({
  booking,
  onSaved,
  onCancel,
}: {
  booking: Booking;
  onSaved: (b: Booking) => void;
  onCancel: () => void;
}) {
  const [contactEmail, setContactEmail] = useState(booking.contactEmail);
  const [passengers, setPassengers] = useState<PassengerInput[]>(
    booking.passengers.map((p) => ({
      firstName: p.firstName,
      lastName: p.lastName,
      passportNumber: p.passportNumber ?? undefined,
    })),
  );
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const updated = await api.modifyBooking(booking.id, {
        contactEmail,
        passengers: passengers.map((p) => ({
          firstName: p.firstName,
          lastName: p.lastName,
          passportNumber: p.passportNumber || undefined,
        })),
      });
      onSaved(updated);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not update the booking.",
      );
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
    >
      <div className="rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
        You can fix spelling typos and update passport numbers or the contact
        email. Transferring a ticket or changing a passenger to a different
        person is not allowed.
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Contact email
        </span>
        <input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          className={inputClass}
          required
        />
      </label>

      <div className="space-y-3">
        {passengers.map((p, i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-100 bg-white p-3 sm:grid-cols-3"
          >
            <input
              value={p.firstName}
              onChange={(e) => updatePassenger(i, "firstName", e.target.value)}
              placeholder="First name"
              className={inputClass}
              required
            />
            <input
              value={p.lastName}
              onChange={(e) => updatePassenger(i, "lastName", e.target.value)}
              placeholder="Last name"
              className={inputClass}
              required
            />
            <input
              value={p.passportNumber ?? ""}
              onChange={(e) =>
                updatePassenger(i, "passportNumber", e.target.value)
              }
              placeholder="Passport (optional)"
              className={inputClass}
            />
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
