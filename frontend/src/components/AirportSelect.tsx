"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Airport } from "@/lib/types";

/**
 * Searchable airport combobox. Users can type a city, airport name or IATA code to
 * filter a global list, then pick an entry. The selected value is the IATA code.
 */
export function AirportSelect({
  airports,
  value,
  onChange,
  placeholder = "Search city or airport",
  label,
  id,
}: {
  airports: Airport[];
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => airports.find((a) => a.code === value) ?? null,
    [airports, value],
  );

  // When the field is closed, show the selected airport; when open, show the query.
  const displayValue = open
    ? query
    : selected
      ? `${selected.city} (${selected.code})`
      : "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? airports.filter(
          (a) =>
            a.code.toLowerCase().includes(q) ||
            a.city.toLowerCase().includes(q) ||
            a.name.toLowerCase().includes(q) ||
            a.country.toLowerCase().includes(q),
        )
      : airports;
    return list.slice(0, 60);
  }, [airports, query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function select(airport: Airport) {
    onChange(airport.code);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      )}
      <input
        id={id}
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
      {open && (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-400">
              No airports match “{query}”.
            </li>
          )}
          {filtered.map((a) => (
            <li key={a.code}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(a);
                }}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-indigo-50 ${
                  a.code === value ? "bg-indigo-50/60" : ""
                }`}
              >
                <span className="min-w-0">
                  <span className="font-medium text-slate-800">{a.city}</span>
                  <span className="ml-2 truncate text-xs text-slate-400">
                    {a.name}
                  </span>
                </span>
                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">
                  {a.code}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
