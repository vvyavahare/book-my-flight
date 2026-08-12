"use client";

import { FormEvent, useState } from "react";
import { AirportSelect } from "@/components/AirportSelect";
import { useAirports } from "@/lib/useAirports";
import { api, ApiError } from "@/lib/api";
import type { Flight } from "@/lib/types";

function defaultDeparture(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return toLocalInput(d);
}

function defaultArrival(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(11, 0, 0, 0);
  return toLocalInput(d);
}

// Format a Date as a value for <input type="datetime-local"> (no timezone suffix).
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function AddFlightForm({ onCreated }: { onCreated?: (f: Flight) => void }) {
  const airports = useAirports();
  const [flightNumber, setFlightNumber] = useState("");
  const [airline, setAirline] = useState("");
  const [origin, setOrigin] = useState("AMS");
  const [destination, setDestination] = useState("LHR");
  const [departureTime, setDepartureTime] = useState(defaultDeparture());
  const [arrivalTime, setArrivalTime] = useState(defaultArrival());
  const [price, setPrice] = useState("129.00");
  const [currency, setCurrency] = useState("EUR");
  const [seatsAvailable, setSeatsAvailable] = useState("180");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const flight = await api.createFlight({
        flightNumber,
        airline,
        origin,
        destination,
        departureTime: `${departureTime}:00`,
        arrivalTime: `${arrivalTime}:00`,
        price: Number(price),
        currency,
        seatsAvailable: Number(seatsAvailable),
      });
      setSuccess(
        `Flight ${flight.flightNumber} (${flight.origin} → ${flight.destination}) created.`,
      );
      setFlightNumber("");
      setAirline("");
      onCreated?.(flight);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not create the flight.",
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
      <h2 className="text-lg font-semibold text-slate-800">Add a flight</h2>

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
          <AirportSelect
            airports={airports}
            value={origin}
            onChange={setOrigin}
          />
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
      {success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-sky-500 px-5 py-2.5 font-medium text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create flight"}
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
