"use client";

import { FormEvent, useState } from "react";
import { AirportSelect } from "@/components/AirportSelect";
import { useAirports } from "@/lib/useAirports";

export interface SearchValues {
  origin: string;
  destination: string;
  date: string;
}

export function SearchForm({
  onSearch,
  loading,
}: {
  onSearch: (values: SearchValues) => void;
  loading: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const airports = useAirports();
  const [origin, setOrigin] = useState("AMS");
  const [destination, setDestination] = useState("LHR");
  const [date, setDate] = useState(today);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSearch({
      origin: origin.trim().toUpperCase(),
      destination: destination.trim().toUpperCase(),
      date,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-3 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-lg shadow-indigo-100 backdrop-blur sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
    >
      <AirportSelect
        label="From"
        airports={airports}
        value={origin}
        onChange={setOrigin}
      />
      <AirportSelect
        label="To"
        airports={airports}
        value={destination}
        onChange={setDestination}
      />
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Date
        </span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="h-[42px] rounded-lg bg-gradient-to-r from-indigo-500 to-sky-500 px-6 font-medium text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
      >
        {loading ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
