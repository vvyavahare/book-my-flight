"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import type { Airport } from "./types";

// Minimal fallback so the dropdowns still work if the catalog request fails.
const FALLBACK: Airport[] = [
  { code: "AMS", name: "Amsterdam Schiphol", city: "Amsterdam", country: "Netherlands" },
  { code: "LHR", name: "London Heathrow", city: "London", country: "United Kingdom" },
  { code: "JFK", name: "New York John F. Kennedy", city: "New York", country: "United States" },
  { code: "CDG", name: "Paris Charles de Gaulle", city: "Paris", country: "France" },
  { code: "BCN", name: "Barcelona El Prat", city: "Barcelona", country: "Spain" },
];

let cache: Airport[] | null = null;

/** Loads the global airport catalog once and shares it across components. */
export function useAirports(): Airport[] {
  const [airports, setAirports] = useState<Airport[]>(cache ?? FALLBACK);

  useEffect(() => {
    if (cache) {
      setAirports(cache);
      return;
    }
    let active = true;
    api
      .getAirports()
      .then((list) => {
        cache = list;
        if (active && list.length > 0) setAirports(list);
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      active = false;
    };
  }, []);

  return airports;
}
