"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { AncillaryConfig, Flight, SeatMap } from "@/lib/types";
import { formatDateTime, formatMoney } from "@/lib/format";
import { SEAT_CLASS_LABEL } from "@/lib/ancillaries";

export function FeesAdmin() {
  return (
    <section className="space-y-8">
      <FeePolicyPanel />
      <SeatAvailabilityPanel />
    </section>
  );
}

// ── Fee policy ──────────────────────────────────────────────────────────────

const NUMERIC_FIELDS: { key: keyof AncillaryConfig; label: string; group: string }[] = [
  { key: "economySeatFee", label: "Economy seat", group: "Seat class fees" },
  { key: "businessSeatFee", label: "Business seat", group: "Seat class fees" },
  { key: "firstSeatFee", label: "First class seat", group: "Seat class fees" },
  { key: "economyBag1Fee", label: "Economy 1st bag", group: "Baggage fees" },
  { key: "economyBag2Fee", label: "Economy 2nd bag", group: "Baggage fees" },
  { key: "economyBag3Fee", label: "Economy 3rd bag", group: "Baggage fees" },
  { key: "businessBag2Fee", label: "Business 2nd bag", group: "Baggage fees" },
  { key: "businessBag3Fee", label: "Business 3rd bag", group: "Baggage fees" },
  { key: "maxCheckedBags", label: "Max checked bags", group: "Limits" },
  { key: "maxCheckedWeightKg", label: "Max weight (kg)", group: "Limits" },
];

function FeePolicyPanel() {
  const [config, setConfig] = useState<AncillaryConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getAncillaryConfig()
      .then(setConfig)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Could not load config."),
      );
  }, []);

  async function save() {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await api.updateAncillaryConfig(config);
      setConfig(updated);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save config.");
    } finally {
      setSaving(false);
    }
  }

  if (!config) {
    return <div className="text-sm text-slate-400">Loading fee policy…</div>;
  }

  const groups = [...new Set(NUMERIC_FIELDS.map((f) => f.group))];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">
        Seat &amp; baggage fees
      </h2>
      <p className="text-sm text-slate-500">
        Business/First class travellers get their 1st checked bag free. Amounts are in{" "}
        {config.currency}.
      </p>

      {error && (
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {groups.map((group) => (
          <div
            key={group}
            className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group}
            </h3>
            <div className="space-y-3">
              {NUMERIC_FIELDS.filter((f) => f.group === group).map((f) => (
                <label key={f.key} className="block text-sm">
                  <span className="mb-1 block text-slate-600">{f.label}</span>
                  <input
                    type="number"
                    min={0}
                    step={f.group === "Limits" ? 1 : 0.5}
                    value={config[f.key] as number}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        [f.key]: Number(e.target.value),
                      })
                    }
                    className={input}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save fee policy"}
        </button>
        {saved && (
          <span className="text-sm font-medium text-emerald-600">Saved ✓</span>
        )}
      </div>
    </div>
  );
}

// ── Seat availability ─────────────────────────────────────────────────────────

function SeatAvailabilityPanel() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [flightId, setFlightId] = useState("");
  const [seatMap, setSeatMap] = useState<SeatMap | null>(null);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .adminListFlights({ size: 100, sort: "departureTime,asc", includeInactive: false })
      .then((res) => setFlights(res.content))
      .catch(() => {
        /* non-fatal — admin can still type a flight id */
      });
  }, []);

  async function load(id: string) {
    if (!id) {
      setSeatMap(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [sm, blocks] = await Promise.all([
        api.getSeatMap(id),
        api.getBlockedSeats(id),
      ]);
      setSeatMap(sm);
      setBlocked(new Set(blocks));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load seat map.",
      );
      setSeatMap(null);
    } finally {
      setLoading(false);
    }
  }

  async function toggle(seatNumber: string) {
    if (!flightId) return;
    setError(null);
    try {
      const next = blocked.has(seatNumber)
        ? await api.unblockSeat(flightId, seatNumber)
        : await api.blockSeat(flightId, seatNumber);
      setBlocked(new Set(next));
      await load(flightId);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not update seat.",
      );
    }
  }

  const rows = new Map<number, SeatMap["seats"]>();
  if (seatMap) {
    for (const seat of seatMap.seats) {
      if (!rows.has(seat.row)) rows.set(seat.row, []);
      rows.get(seat.row)!.push(seat);
    }
  }
  const orderedRows = [...rows.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">Seat availability</h2>
      <p className="text-sm text-slate-500">
        Block seats to take them out of service (maintenance, held inventory).
        Blocked seats cannot be booked. Seats already booked by travellers are
        shown as taken and cannot be blocked here.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={flightId}
          onChange={(e) => {
            setFlightId(e.target.value);
            load(e.target.value);
          }}
          className={`${input} max-w-md`}
        >
          <option value="">Select a flight…</option>
          {flights.map((f) => (
            <option key={f.id} value={f.id}>
              {f.flightNumber} · {f.origin}→{f.destination} ·{" "}
              {formatDateTime(f.departureTime)}
            </option>
          ))}
        </select>
        {loading && <span className="text-sm text-slate-400">Loading…</span>}
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {seatMap && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            <Legend className="border-slate-200 bg-white" label="Bookable" />
            <Legend className="border-rose-400 bg-rose-500 text-white" label="Blocked" />
            <Legend className="border-slate-200 bg-slate-200" label="Taken (booked)" />
          </div>
          <div className="overflow-x-auto">
            <div className="mx-auto w-fit space-y-1.5">
              {orderedRows.map(([rowNumber, seats]) => (
                <div key={rowNumber} className="flex items-center gap-1.5">
                  <span className="w-6 text-right text-[10px] font-medium text-slate-400">
                    {rowNumber}
                  </span>
                  {seats
                    .sort((a, b) => a.column.localeCompare(b.column))
                    .map((seat) => {
                      const isBlocked = blocked.has(seat.seatNumber);
                      const takenByBooking = !seat.available && !isBlocked;
                      return (
                        <button
                          key={seat.seatNumber}
                          type="button"
                          disabled={takenByBooking}
                          onClick={() => toggle(seat.seatNumber)}
                          title={`${seat.seatNumber} · ${SEAT_CLASS_LABEL[seat.seatClass]}`}
                          className={seatClass(isBlocked, takenByBooking)}
                        >
                          {seat.column}
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm text-slate-500">
            {blocked.size} seat(s) blocked on this flight.
          </p>
        </div>
      )}
    </div>
  );
}

function seatClass(isBlocked: boolean, takenByBooking: boolean): string {
  const base = "h-8 w-8 rounded-md border text-[11px] font-semibold transition";
  if (isBlocked) return `${base} border-rose-500 bg-rose-500 text-white`;
  if (takenByBooking)
    return `${base} cursor-not-allowed border-slate-200 bg-slate-200 text-slate-400`;
  return `${base} border-slate-200 bg-white text-slate-600 hover:border-rose-400`;
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-4 w-4 rounded border ${className}`} />
      {label}
    </span>
  );
}

const input =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
