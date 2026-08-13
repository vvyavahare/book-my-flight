"use client";

import { useCallback, useEffect, useState } from "react";
import { FlightForm } from "@/components/FlightForm";
import { api, ApiError } from "@/lib/api";
import type { Flight } from "@/lib/types";
import { formatDateTime, formatMoney } from "@/lib/format";

const PAGE_SIZE = 8;

export function FlightsAdmin() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("departureTime,asc");
  const [flights, setFlights] = useState<Flight[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Flight | null>(null);

  // Debounce the search box so we don't hit the API on every keypress.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminListFlights({
        q: debounced,
        page,
        size: PAGE_SIZE,
        sort,
        includeInactive: true,
      });
      setFlights(res.content);
      setTotal(res.totalElements);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load flights.",
      );
    } finally {
      setLoading(false);
    }
  }, [debounced, page, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function toggleSort(field: string) {
    setSort((prev) => {
      const [f, dir] = prev.split(",");
      if (f === field) {
        return `${field},${dir === "asc" ? "desc" : "asc"}`;
      }
      return `${field},asc`;
    });
    setPage(0);
  }

  function sortIndicator(field: string) {
    const [f, dir] = sort.split(",");
    if (f !== field) return "";
    return dir === "asc" ? " ▲" : " ▼";
  }

  async function handleDelete(flight: Flight) {
    if (
      !window.confirm(
        `Soft-delete flight ${flight.flightNumber} (${flight.origin} → ${flight.destination})? It will be hidden from search.`,
      )
    ) {
      return;
    }
    try {
      await api.deleteFlight(flight.id);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not delete the flight.",
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything — city, code, airline, price… (try “Bombay”)"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setAdding((v) => !v);
          }}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95"
        >
          {adding ? "Close" : "+ Add flight"}
        </button>
      </div>

      {adding && (
        <FlightForm
          mode="create"
          onSaved={async () => {
            setAdding(false);
            await load();
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {editing && (
        <FlightForm
          mode="edit"
          flight={editing}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {error && (
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/60 bg-white/85 shadow-sm backdrop-blur">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <Th onClick={() => toggleSort("flightNumber")}>
                Flight{sortIndicator("flightNumber")}
              </Th>
              <Th onClick={() => toggleSort("airline")}>
                Airline{sortIndicator("airline")}
              </Th>
              <Th onClick={() => toggleSort("origin")}>
                Route{sortIndicator("origin")}
              </Th>
              <Th onClick={() => toggleSort("departureTime")}>
                Departs{sortIndicator("departureTime")}
              </Th>
              <Th onClick={() => toggleSort("price")} className="text-right">
                Price{sortIndicator("price")}
              </Th>
              <Th onClick={() => toggleSort("seatsAvailable")} className="text-right">
                Seats{sortIndicator("seatsAvailable")}
              </Th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {flights.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  No flights match your search.
                </td>
              </tr>
            )}
            {flights.map((f) => (
              <tr key={f.id} className={f.active ? "" : "bg-slate-50/60"}>
                <td className="px-4 py-3 font-medium text-slate-700">
                  {f.flightNumber}
                </td>
                <td className="px-4 py-3 text-slate-600">{f.airline}</td>
                <td className="px-4 py-3 text-slate-600">
                  {f.origin} → {f.destination}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDateTime(f.departureTime)}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {formatMoney(f.price, f.currency)}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {f.seatsAvailable}
                </td>
                <td className="px-4 py-3">
                  {f.active ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      active
                    </span>
                  ) : (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">
                      deleted
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setAdding(false);
                        setEditing(f);
                      }}
                      className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(f)}
                      disabled={!f.active}
                      className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          {total} flight{total === 1 ? "" : "s"} · page {page + 1} of {totalPages}
          {loading && " · loading…"}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
            disabled={page + 1 >= totalPages}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

function Th({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <th
      onClick={onClick}
      className={`cursor-pointer select-none px-4 py-3 transition hover:text-slate-700 ${className}`}
    >
      {children}
    </th>
  );
}
