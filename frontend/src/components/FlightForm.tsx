"use client";

import { FormEvent, useState } from "react";
import { AirportSelect } from "@/components/AirportSelect";
import { useAirports } from "@/lib/useAirports";
import { api, ApiError } from "@/lib/api";
import type { Flight } from "@/lib/types";

function toLocalInput(iso: string): string {
  // "2026-08-13T09:00:00" -> "2026-08-13T09:00" for <input type=datetime-local>
  return iso.slice(0, 16);
}

function defaultLocal(hoursFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9 + hoursFromNow, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function FlightForm({
  mode,
  flight,
  onSaved,
  onCancel,
}: {
  mode: "create" | "edit";
  flight?: Flight;
  onSaved: (f: Flight) => void;
  onCancel?: () => void;
}) {
  const airports = useAirports();
  const [flightNumber, setFlightNumber] = useState(flight?.flightNumber ?? "");
  const [airline, setAirline] = useState(flight?.airline ?? "");
  const [origin, setOrigin] = useState(flight?.origin ?? "AMS");
  const [destination, setDestination] = useState(flight?.destination ?? "LHR");
  const [departureTime, setDepartureTime] = useState(
    flight ? toLocalInput(flight.departureTime) : defaultLocal(0),
  );
  const [arrivalTime, setArrivalTime] = useState(
    flight ? toLocalInput(flight.arrivalTime) : defaultLocal(2),
  );
  const [price, setPrice] = useState(String(flight?.price ?? "129.00"));
  const [currency, setCurrency] = useState(flight?.currency ?? "EUR");
  const [seatsAvailable, setSeatsAvailable] = useState(
    String(flight?.seatsAvailable ?? "180"),
  );

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const payload = {
      flightNumber,
      airline,
      origin,
      destination,
      departureTime: `${departureTime}:00`,
      arrivalTime: `${arrivalTime}:00`,
      price: Number(price),
      currency,
      seatsAvailable: Number(seatsAvailable),
    };
    try {
      const saved =
        mode === "create"
          ? await api.createFlight(payload)
          : await api.updateFlight(flight!.id, payload);
      onSaved(saved);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not save the flight.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-white/60 bg-white/85 p-6 shadow-lg backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          {mode === "create" ? "Add a flight" : `Edit ${flight?.flightNumber}`}
        </h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-medium text-slate-400 transition hover:text-slate-600"
          >
            ✕ Close
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Labeled label="Flight number">
          <input
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
            placeholder="KL1007"
            className={inputClass}
            required
          />
        </Labeled>
        <Labeled label="Airline">
          <input
            value={airline}
            onChange={(e) => setAirline(e.target.value)}
            placeholder="KLM"
            className={inputClass}
            required
          />
        </Labeled>
        <Labeled label="From">
          <AirportSelect airports={airports} value={origin} onChange={setOrigin} />
        </Labeled>
        <Labeled label="To">
          <AirportSelect
            airports={airports}
            value={destination}
            onChange={setDestination}
          />
        </Labeled>
        <Labeled label="Departure">
          <input
            type="datetime-local"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className={inputClass}
            required
          />
        </Labeled>
        <Labeled label="Arrival">
          <input
            type="datetime-local"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
            className={inputClass}
            required
          />
        </Labeled>
        <Labeled label="Price">
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
            required
          />
        </Labeled>
        <Labeled label="Currency">
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            placeholder="EUR"
            className={inputClass}
            required
          />
        </Labeled>
        <Labeled label="Seats available">
          <input
            type="number"
            min="0"
            step="1"
            value={seatsAvailable}
            onChange={(e) => setSeatsAvailable(e.target.value)}
            className={inputClass}
            required
          />
        </Labeled>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-sky-500 px-5 py-2.5 font-medium text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
        >
          {submitting
            ? "Saving…"
            : mode === "create"
              ? "Create flight"
              : "Save changes"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
