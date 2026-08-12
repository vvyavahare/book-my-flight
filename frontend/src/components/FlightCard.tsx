"use client";

import type { Flight } from "@/lib/types";
import { formatTime, formatMoney } from "@/lib/format";

export function FlightCard({
  flight,
  onSelect,
}: {
  flight: Flight;
  onSelect: (flight: Flight) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-5">
        <div className="text-center">
          <div className="text-lg font-semibold text-slate-800">
            {formatTime(flight.departureTime)}
          </div>
          <div className="text-xs font-medium text-slate-400">
            {flight.origin}
          </div>
        </div>

        <div className="flex flex-col items-center text-slate-300">
          <span className="text-[10px] uppercase tracking-wide text-slate-400">
            {flight.airline}
          </span>
          <div className="my-1 h-px w-16 bg-slate-200 sm:w-24" />
          <span className="text-[10px] text-slate-400">{flight.flightNumber}</span>
        </div>

        <div className="text-center">
          <div className="text-lg font-semibold text-slate-800">
            {formatTime(flight.arrivalTime)}
          </div>
          <div className="text-xs font-medium text-slate-400">
            {flight.destination}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-right">
          <div className="text-xl font-bold text-slate-900">
            {formatMoney(flight.price, flight.currency)}
          </div>
          <div className="text-xs text-slate-400">
            {flight.seatsAvailable} seats left
          </div>
        </div>
        <button
          onClick={() => onSelect(flight)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Select
        </button>
      </div>
    </div>
  );
}
