"use client";

import type { Booking } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { SEAT_CLASS_LABEL } from "@/lib/ancillaries";

/**
 * Shows a booking's ancillary selections (per-passenger seats, baggage and meals, plus
 * booking-level amenities) and the itemised price breakdown. Reused on the confirmation
 * page, My Bookings and the admin booking detail.
 */
export function BookingDetails({ booking }: { booking: Booking }) {
  const c = booking.currency;
  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">
          Passengers &amp; selections
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Passenger</th>
                <th className="px-3 py-2">Seat</th>
                <th className="px-3 py-2">Baggage</th>
                <th className="px-3 py-2">Meal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {booking.passengers.map((p, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-slate-700">
                    {p.firstName} {p.lastName}
                    {p.needsAccessibility && (
                      <span className="ml-1 text-sky-600" title="Accessible">
                        ♿
                      </span>
                    )}
                    {p.passportNumber && (
                      <div className="font-mono text-[10px] text-slate-400">
                        {p.passportNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {p.seatNumber ? (
                      <>
                        {p.seatNumber}
                        {p.seatClass && (
                          <span className="text-slate-400">
                            {" "}
                            · {SEAT_CLASS_LABEL[p.seatClass]}
                          </span>
                        )}
                        <div className="text-xs text-slate-400">
                          {p.seatFee > 0 ? formatMoney(p.seatFee, c) : "Free"}
                        </div>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {p.checkedBags > 0 ? (
                      <>
                        {p.checkedBags} bag(s), {p.baggageWeightKg} kg
                        <div className="text-xs text-slate-400">
                          {formatMoney(p.baggageFee, c)}
                        </div>
                      </>
                    ) : (
                      "Hand luggage only"
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {p.mealName ? (
                      <>
                        {p.mealName}
                        <div className="text-xs text-slate-400">
                          {formatMoney(p.mealPrice, c)}
                        </div>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {booking.amenities.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Amenities</h3>
          <ul className="flex flex-wrap gap-2">
            {booking.amenities.map((a) => (
              <li
                key={a.amenityId}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
              >
                {a.name} · {formatMoney(a.price, c)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">
          Price breakdown
        </h3>
        <dl className="space-y-1.5 rounded-xl bg-slate-50/70 p-4 text-sm">
          <Row label="Base fare" value={booking.baseFare} currency={c} />
          <Row label="Seats" value={booking.seatFeesTotal} currency={c} />
          <Row label="Baggage" value={booking.baggageFeesTotal} currency={c} />
          <Row label="Meals" value={booking.mealFeesTotal} currency={c} />
          <Row label="Amenities" value={booking.amenityFeesTotal} currency={c} />
          <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
            <span>Total</span>
            <span>{formatMoney(booking.totalPrice, c)}</span>
          </div>
        </dl>
      </div>
    </div>
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
