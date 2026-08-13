"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Amenity,
  AncillaryConfig,
  Flight,
  MealOption,
  Seat,
  SeatMap,
} from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import {
  baggageFee,
  DIETARY_BADGE,
  DIETARY_LABEL,
  handLuggageAllowance,
  SEAT_CLASS_LABEL,
} from "@/lib/ancillaries";
import { SeatMapSelector } from "@/components/SeatMapSelector";

/** Working selection state for a single passenger while booking. */
interface PassengerDraft {
  firstName: string;
  lastName: string;
  passportNumber: string;
  needsAccessibility: boolean;
  seat: Seat | null;
  mealId: string | null;
  checkedBags: number;
  baggageWeightKg: number;
}

const emptyPassenger = (): PassengerDraft => ({
  firstName: "",
  lastName: "",
  passportNumber: "",
  needsAccessibility: false,
  seat: null,
  mealId: null,
  checkedBags: 0,
  baggageWeightKg: 0,
});

type Step = 0 | 1 | 2 | 3 | 4 | 5;
const STEPS = ["Passengers", "Seats", "Baggage", "Meals", "Extras", "Review"];

export function BookingForm({
  flight,
  onCancel,
}: {
  flight: Flight;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [contactEmail, setContactEmail] = useState("");
  const [passengers, setPassengers] = useState<PassengerDraft[]>([
    emptyPassenger(),
  ]);
  const [activePassenger, setActivePassenger] = useState(0);
  const [amenityIds, setAmenityIds] = useState<string[]>([]);

  const [seatMap, setSeatMap] = useState<SeatMap | null>(null);
  const [meals, setMeals] = useState<MealOption[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [config, setConfig] = useState<AncillaryConfig | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.getSeatMap(flight.id),
      api.getMeals(),
      api.getAmenities(),
      api.getAncillaryConfig(),
    ])
      .then(([sm, m, a, c]) => {
        if (!active) return;
        setSeatMap(sm);
        setMeals(m);
        setAmenities(a);
        setConfig(c);
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load booking options.",
          );
      });
    return () => {
      active = false;
    };
  }, [flight.id]);

  function updatePassenger(index: number, patch: Partial<PassengerDraft>) {
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    );
  }

  function addPassenger() {
    if (passengers.length < flight.seatsAvailable) {
      setPassengers((prev) => [...prev, emptyPassenger()]);
    }
  }

  function removePassenger(index: number) {
    setPassengers((prev) => prev.filter((_, i) => i !== index));
    setActivePassenger(0);
  }

  // Seats picked by passengers other than the active one (cannot be double-booked).
  const takenByOthers = useMemo(() => {
    const set = new Set<string>();
    passengers.forEach((p, i) => {
      if (i !== activePassenger && p.seat) set.add(p.seat.seatNumber);
    });
    return set;
  }, [passengers, activePassenger]);

  function selectSeat(seat: Seat) {
    updatePassenger(activePassenger, { seat });
  }

  const feeBreakdown = useMemo(() => {
    const seatFees = passengers.reduce((s, p) => s + (p.seat?.fee ?? 0), 0);
    const baggageFees = config
      ? passengers.reduce(
          (s, p) =>
            s + baggageFee(config, p.seat?.seatClass ?? null, p.checkedBags),
          0,
        )
      : 0;
    const mealFees = passengers.reduce((s, p) => {
      const meal = meals.find((m) => m.id === p.mealId);
      return s + (meal?.price ?? 0);
    }, 0);
    const amenityFees = amenityIds.reduce((s, id) => {
      const a = amenities.find((x) => x.id === id);
      return s + (a?.price ?? 0);
    }, 0);
    const baseFare = flight.price * passengers.length;
    return {
      baseFare,
      seatFees,
      baggageFees,
      mealFees,
      amenityFees,
      total: baseFare + seatFees + baggageFees + mealFees + amenityFees,
    };
  }, [passengers, config, meals, amenityIds, amenities, flight.price]);

  const passengersValid = passengers.every(
    (p) => p.firstName.trim() && p.lastName.trim(),
  );
  const canContinueStep0 = contactEmail.trim() !== "" && passengersValid;

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const booking = await api.createBooking({
        flightId: flight.id,
        contactEmail,
        passengers: passengers.map((p) => ({
          firstName: p.firstName,
          lastName: p.lastName,
          passportNumber: p.passportNumber || undefined,
          needsAccessibility: p.needsAccessibility,
          seatNumber: p.seat?.seatNumber ?? undefined,
          seatClass: p.seat?.seatClass ?? undefined,
          mealId: p.mealId ?? undefined,
          checkedBags: p.checkedBags,
          baggageWeightKg: p.baggageWeightKg,
        })),
        amenityIds,
      });
      router.push(`/bookings/${booking.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not complete the booking. Please try again.",
      );
      setSubmitting(false);
    }
  }

  const currency = flight.currency;

  return (
    <div className="rounded-2xl border border-white/60 bg-white/85 p-6 shadow-lg backdrop-blur">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            {flight.origin} → {flight.destination}
          </h2>
          <p className="text-sm text-slate-500">
            {flight.airline} · {flight.flightNumber} ·{" "}
            {formatDateTime(flight.departureTime)}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-sm font-medium text-slate-400 transition hover:text-slate-600"
        >
          ✕ Close
        </button>
      </div>

      <Stepper step={step} />

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          {step === 0 && (
            <PassengersStep
              contactEmail={contactEmail}
              setContactEmail={setContactEmail}
              passengers={passengers}
              updatePassenger={updatePassenger}
              addPassenger={addPassenger}
              removePassenger={removePassenger}
              maxSeats={flight.seatsAvailable}
            />
          )}

          {step === 1 && (
            <SeatsStep
              passengers={passengers}
              activePassenger={activePassenger}
              setActivePassenger={setActivePassenger}
              seatMap={seatMap}
              takenByOthers={takenByOthers}
              onSelect={selectSeat}
              onClear={() =>
                updatePassenger(activePassenger, { seat: null })
              }
              currency={currency}
            />
          )}

          {step === 2 && config && (
            <BaggageStep
              passengers={passengers}
              updatePassenger={updatePassenger}
              config={config}
              currency={currency}
            />
          )}

          {step === 3 && (
            <MealsStep
              passengers={passengers}
              updatePassenger={updatePassenger}
              meals={meals}
              currency={currency}
            />
          )}

          {step === 4 && (
            <AmenitiesStep
              amenities={amenities}
              amenityIds={amenityIds}
              setAmenityIds={setAmenityIds}
              currency={currency}
            />
          )}

          {step === 5 && (
            <ReviewStep
              flight={flight}
              contactEmail={contactEmail}
              passengers={passengers}
              meals={meals}
              amenities={amenities}
              amenityIds={amenityIds}
              config={config}
              breakdown={feeBreakdown}
              currency={currency}
            />
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() =>
                step === 0 ? onCancel() : setStep((step - 1) as Step)
              }
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {step === 0 ? "Cancel" : "← Back"}
            </button>

            {step < 5 ? (
              <button
                type="button"
                disabled={step === 0 && !canContinueStep0}
                onClick={() => setStep((step + 1) as Step)}
                className="rounded-lg bg-gradient-to-r from-indigo-500 to-sky-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
              >
                {submitting ? "Booking…" : "Confirm & continue to payment"}
              </button>
            )}
          </div>
        </div>

        <PriceSummary breakdown={feeBreakdown} currency={currency} />
      </div>
    </div>
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function Stepper({ step }: { step: Step }) {
  return (
    <ol className="flex flex-wrap gap-1.5 text-xs font-medium">
      {STEPS.map((label, i) => (
        <li
          key={label}
          className={`rounded-full px-3 py-1 ${
            i === step
              ? "bg-indigo-600 text-white"
              : i < step
                ? "bg-indigo-100 text-indigo-700"
                : "bg-slate-100 text-slate-400"
          }`}
        >
          {i + 1}. {label}
        </li>
      ))}
    </ol>
  );
}

function PassengersStep({
  contactEmail,
  setContactEmail,
  passengers,
  updatePassenger,
  addPassenger,
  removePassenger,
  maxSeats,
}: {
  contactEmail: string;
  setContactEmail: (v: string) => void;
  passengers: PassengerDraft[];
  updatePassenger: (i: number, patch: Partial<PassengerDraft>) => void;
  addPassenger: () => void;
  removePassenger: (i: number) => void;
  maxSeats: number;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Contact email
        </label>
        <input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputClass}
          required
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Passengers</span>
          <button
            type="button"
            onClick={addPassenger}
            disabled={passengers.length >= maxSeats}
            className="text-sm font-medium text-indigo-600 transition hover:text-indigo-500 disabled:opacity-40"
          >
            + Add passenger
          </button>
        </div>

        {passengers.map((p, i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                value={p.firstName}
                onChange={(e) =>
                  updatePassenger(i, { firstName: e.target.value })
                }
                placeholder="First name"
                className={smallInput}
                required
              />
              <input
                value={p.lastName}
                onChange={(e) =>
                  updatePassenger(i, { lastName: e.target.value })
                }
                placeholder="Last name"
                className={smallInput}
                required
              />
              <div className="flex items-center gap-2">
                <input
                  value={p.passportNumber}
                  onChange={(e) =>
                    updatePassenger(i, { passportNumber: e.target.value })
                  }
                  placeholder="Passport (optional)"
                  className={`${smallInput} w-full`}
                />
                {passengers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePassenger(i)}
                    className="shrink-0 text-slate-300 transition hover:text-rose-500"
                    aria-label="Remove passenger"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={p.needsAccessibility}
                onChange={(e) =>
                  updatePassenger(i, { needsAccessibility: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              Requires an accessible seat (reduced mobility)
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeatsStep({
  passengers,
  activePassenger,
  setActivePassenger,
  seatMap,
  takenByOthers,
  onSelect,
  onClear,
  currency,
}: {
  passengers: PassengerDraft[];
  activePassenger: number;
  setActivePassenger: (i: number) => void;
  seatMap: SeatMap | null;
  takenByOthers: Set<string>;
  onSelect: (seat: Seat) => void;
  onClear: () => void;
  currency: string;
}) {
  const active = passengers[activePassenger];
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Pick a seat for each passenger. Seat classes carry different fees; grey
        rows at the back are free. Accessible seats (♿) are reserved for
        passengers who marked reduced mobility.
      </p>
      <div className="flex flex-wrap gap-2">
        {passengers.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActivePassenger(i)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              i === activePassenger
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {p.firstName || `Passenger ${i + 1}`}
            {p.seat ? ` · ${p.seat.seatNumber}` : ""}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
        <span className="text-slate-600">
          {active.seat ? (
            <>
              Seat <b>{active.seat.seatNumber}</b> ·{" "}
              {SEAT_CLASS_LABEL[active.seat.seatClass]} ·{" "}
              {active.seat.fee > 0
                ? formatMoney(active.seat.fee, currency)
                : "Free"}
            </>
          ) : (
            "No seat selected (a seat is assigned at check-in if skipped)."
          )}
        </span>
        {active.seat && (
          <button
            type="button"
            onClick={onClear}
            className="font-medium text-slate-500 underline"
          >
            Clear
          </button>
        )}
      </div>

      {seatMap ? (
        <SeatMapSelector
          seatMap={seatMap}
          selectedSeat={active.seat?.seatNumber ?? null}
          takenByOthers={takenByOthers}
          passengerNeedsAccessibility={active.needsAccessibility}
          onSelect={onSelect}
        />
      ) : (
        <div className="text-sm text-slate-400">Loading seat map…</div>
      )}
    </div>
  );
}

function BaggageStep({
  passengers,
  updatePassenger,
  config,
  currency,
}: {
  passengers: PassengerDraft[];
  updatePassenger: (i: number, patch: Partial<PassengerDraft>) => void;
  config: AncillaryConfig;
  currency: string;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Every passenger travels with free hand luggage. Add up to{" "}
        {config.maxCheckedBags} checked bags (max {config.maxCheckedWeightKg} kg
        total). Fees depend on the seat class.
      </p>
      {passengers.map((p, i) => {
        const seatClass = p.seat?.seatClass ?? null;
        const fee = baggageFee(config, seatClass, p.checkedBags);
        return (
          <div
            key={i}
            className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                {p.firstName || `Passenger ${i + 1}`}
              </span>
              <span className="text-xs text-slate-400">
                {seatClass ? SEAT_CLASS_LABEL[seatClass] : "Economy"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Free hand luggage: {handLuggageAllowance(seatClass)}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Checked bags
                </span>
                <select
                  value={p.checkedBags}
                  onChange={(e) => {
                    const bags = Number(e.target.value);
                    updatePassenger(i, {
                      checkedBags: bags,
                      baggageWeightKg:
                        bags === 0
                          ? 0
                          : p.baggageWeightKg || Math.min(23, config.maxCheckedWeightKg),
                    });
                  }}
                  className={smallInput}
                >
                  {Array.from({ length: config.maxCheckedBags + 1 }).map(
                    (_, n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "bag" : "bags"}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total weight (kg)
                </span>
                <input
                  type="number"
                  min={0}
                  max={config.maxCheckedWeightKg}
                  disabled={p.checkedBags === 0}
                  value={p.baggageWeightKg}
                  onChange={(e) =>
                    updatePassenger(i, {
                      baggageWeightKg: Math.max(
                        0,
                        Math.min(
                          config.maxCheckedWeightKg,
                          Number(e.target.value),
                        ),
                      ),
                    })
                  }
                  className={`${smallInput} disabled:bg-slate-100`}
                />
              </label>
            </div>
            <div className="text-right text-sm font-medium text-slate-700">
              Baggage fee: {formatMoney(fee, currency)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MealsStep({
  passengers,
  updatePassenger,
  meals,
  currency,
}: {
  passengers: PassengerDraft[];
  updatePassenger: (i: number, patch: Partial<PassengerDraft>) => void;
  meals: MealOption[];
  currency: string;
}) {
  const [active, setActive] = useState(0);
  const passenger = passengers[active];
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Pre-order a meal for each passenger. Filter by dietary preference — every
        option lists its ingredients.
      </p>
      <div className="flex flex-wrap gap-2">
        {passengers.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              i === active
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {p.firstName || `Passenger ${i + 1}`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => updatePassenger(active, { mealId: null })}
          className={`rounded-xl border p-3 text-left text-sm transition ${
            !passenger.mealId
              ? "border-indigo-400 bg-indigo-50"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="font-medium text-slate-700">No meal</div>
          <div className="text-xs text-slate-400">Skip the meal for now</div>
        </button>
        {meals.map((meal) => {
          const selected = passenger.mealId === meal.id;
          return (
            <button
              key={meal.id}
              type="button"
              onClick={() => updatePassenger(active, { mealId: meal.id })}
              className={`flex gap-3 rounded-xl border p-3 text-left transition ${
                selected
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={meal.imageUrl}
                alt={meal.name}
                loading="lazy"
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-800">
                    {meal.name}
                  </span>
                </div>
                <span
                  className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${DIETARY_BADGE[meal.dietary]}`}
                >
                  {DIETARY_LABEL[meal.dietary]}
                </span>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                  {meal.description}
                </p>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {formatMoney(meal.price, currency)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AmenitiesStep({
  amenities,
  amenityIds,
  setAmenityIds,
  currency,
}: {
  amenities: Amenity[];
  amenityIds: string[];
  setAmenityIds: (ids: string[]) => void;
  currency: string;
}) {
  function toggle(id: string) {
    setAmenityIds(
      amenityIds.includes(id)
        ? amenityIds.filter((x) => x !== id)
        : [...amenityIds, id],
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Add extras for your trip. These apply to the whole booking.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {amenities.map((a) => {
          const selected = amenityIds.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => toggle(a.id)}
              className={`rounded-xl border p-3 text-left transition ${
                selected
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-800">
                  {a.name}
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {formatMoney(a.price, currency)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{a.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReviewStep({
  flight,
  contactEmail,
  passengers,
  meals,
  amenities,
  amenityIds,
  config,
  breakdown,
  currency,
}: {
  flight: Flight;
  contactEmail: string;
  passengers: PassengerDraft[];
  meals: MealOption[];
  amenities: Amenity[];
  amenityIds: string[];
  config: AncillaryConfig | null;
  breakdown: Breakdown;
  currency: string;
}) {
  return (
    <div className="space-y-4 text-sm">
      <p className="text-slate-500">
        Review your trip before payment. Contact:{" "}
        <span className="font-medium text-slate-700">{contactEmail}</span>
      </p>

      <div className="overflow-hidden rounded-xl border border-slate-100">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Passenger</th>
              <th className="px-3 py-2">Seat</th>
              <th className="px-3 py-2">Baggage</th>
              <th className="px-3 py-2">Meal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {passengers.map((p, i) => {
              const meal = meals.find((m) => m.id === p.mealId);
              const bagFee = config
                ? baggageFee(config, p.seat?.seatClass ?? null, p.checkedBags)
                : 0;
              return (
                <tr key={i}>
                  <td className="px-3 py-2 text-slate-700">
                    {p.firstName} {p.lastName}
                    {p.needsAccessibility && (
                      <span className="ml-1 text-sky-600" title="Accessible">
                        ♿
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {p.seat ? (
                      <>
                        {p.seat.seatNumber} ·{" "}
                        {SEAT_CLASS_LABEL[p.seat.seatClass]}
                        {p.seat.fee > 0
                          ? ` (${formatMoney(p.seat.fee, currency)})`
                          : " (free)"}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {p.checkedBags > 0
                      ? `${p.checkedBags} bag(s), ${p.baggageWeightKg} kg · ${formatMoney(bagFee, currency)}`
                      : "Hand luggage only"}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {meal
                      ? `${meal.name} · ${formatMoney(meal.price, currency)}`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {amenityIds.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Extras
          </div>
          <ul className="flex flex-wrap gap-2">
            {amenityIds.map((id) => {
              const a = amenities.find((x) => x.id === id);
              if (!a) return null;
              return (
                <li
                  key={id}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                >
                  {a.name} · {formatMoney(a.price, currency)}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <BreakdownTable breakdown={breakdown} currency={currency} />
      <p className="text-xs text-slate-400">
        Flight {flight.flightNumber} · {passengers.length} passenger(s). Final
        amount is confirmed at payment.
      </p>
    </div>
  );
}

// ── Price summary widgets ──────────────────────────────────────────────────────

interface Breakdown {
  baseFare: number;
  seatFees: number;
  baggageFees: number;
  mealFees: number;
  amenityFees: number;
  total: number;
}

function PriceSummary({
  breakdown,
  currency,
}: {
  breakdown: Breakdown;
  currency: string;
}) {
  return (
    <aside className="h-fit rounded-2xl border border-slate-100 bg-slate-50/70 p-4 lg:sticky lg:top-20">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">
        Price summary
      </h3>
      <BreakdownTable breakdown={breakdown} currency={currency} />
    </aside>
  );
}

function BreakdownTable({
  breakdown,
  currency,
}: {
  breakdown: Breakdown;
  currency: string;
}) {
  return (
    <dl className="space-y-1.5 text-sm">
      <Row label="Base fare" value={breakdown.baseFare} currency={currency} />
      <Row label="Seats" value={breakdown.seatFees} currency={currency} />
      <Row label="Baggage" value={breakdown.baggageFees} currency={currency} />
      <Row label="Meals" value={breakdown.mealFees} currency={currency} />
      <Row label="Extras" value={breakdown.amenityFees} currency={currency} />
      <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
        <span>Total</span>
        <span>{formatMoney(breakdown.total, currency)}</span>
      </div>
    </dl>
  );
}

function Row({
  label,
  value,
  currency,
}: {
  label: string;
  value: number;
  currency: string;
}) {
  return (
    <div className="flex items-center justify-between text-slate-600">
      <dt>{label}</dt>
      <dd className={value > 0 ? "text-slate-800" : "text-slate-400"}>
        {formatMoney(value, currency)}
      </dd>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
const smallInput =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
