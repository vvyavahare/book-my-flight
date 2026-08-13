"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchForm, type SearchValues } from "@/components/SearchForm";
import { FlightCard } from "@/components/FlightCard";
import { BookingForm } from "@/components/BookingForm";
import { api, ApiError } from "@/lib/api";
import type { Flight } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function HomePage() {
  const { ready, isAuthenticated } = useRequireAuth();
  const { isAdmin } = useAuth();
  const router = useRouter();

  const [flights, setFlights] = useState<Flight[]>([]);
  const [selected, setSelected] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admins get the management console as their landing page.
  useEffect(() => {
    if (ready && isAuthenticated && isAdmin) {
      router.replace("/admin");
    }
  }, [ready, isAuthenticated, isAdmin, router]);

  async function handleSearch(values: SearchValues) {
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const results = await api.searchFlights(
        values.origin,
        values.destination,
        values.date,
      );
      setFlights(results);
      setSearched(true);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Search failed. Please try again.";
      setError(message);
      setFlights([]);
    } finally {
      setLoading(false);
    }
  }

  if (!ready || !isAuthenticated) {
    return (
      <div className="mt-20 text-center text-slate-400">Loading…</div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="pt-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
          Where would you like to fly?
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-slate-500">
          Search live fares across our network and book in seconds.
        </p>
      </section>

      <SearchForm onSearch={handleSearch} loading={loading} />

      {error && (
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {selected && (
        <BookingForm flight={selected} onCancel={() => setSelected(null)} />
      )}

      <section className="space-y-3">
        {searched && !loading && flights.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-10 text-center text-slate-400">
            No flights found for this route and date. Try AMS → LHR today.
          </div>
        )}

        {flights.map((flight) => (
          <FlightCard key={flight.id} flight={flight} onSelect={setSelected} />
        ))}
      </section>
    </div>
  );
}
