"use client";

import { FlightForm } from "@/components/FlightForm";
import type { Flight } from "@/lib/types";

/** Backwards-compatible thin wrapper around {@link FlightForm} in create mode. */
export function AddFlightForm({ onCreated }: { onCreated?: (f: Flight) => void }) {
  return <FlightForm mode="create" onSaved={(f) => onCreated?.(f)} />;
}
