"use client";

import type { Seat, SeatMap } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { SEAT_CLASS_LABEL } from "@/lib/ancillaries";

/**
 * Renders a selectable cabin layout. The seat picked for the currently active passenger is
 * highlighted; seats chosen by other passengers in this booking, occupied or blocked seats
 * are disabled. Accessible seats are marked and only selectable for passengers who need one.
 */
export function SeatMapSelector({
  seatMap,
  selectedSeat,
  takenByOthers,
  passengerNeedsAccessibility,
  onSelect,
}: {
  seatMap: SeatMap;
  selectedSeat: string | null;
  takenByOthers: Set<string>;
  passengerNeedsAccessibility: boolean;
  onSelect: (seat: Seat) => void;
}) {
  const rows = new Map<number, Seat[]>();
  for (const seat of seatMap.seats) {
    if (!rows.has(seat.row)) rows.set(seat.row, []);
    rows.get(seat.row)!.push(seat);
  }
  const orderedRows = [...rows.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <Legend className="border-slate-200 bg-white" label="Free" />
        <Legend className="border-indigo-200 bg-indigo-50" label="Paid" />
        <Legend
          className="border-sky-300 bg-sky-50"
          label="Accessible ♿"
        />
        <Legend className="border-emerald-400 bg-emerald-500 text-white" label="Selected" />
        <Legend className="border-slate-200 bg-slate-200" label="Taken" />
      </div>

      <div className="overflow-x-auto">
        <div className="mx-auto w-fit space-y-1.5">
          <div className="flex items-center gap-1.5 pl-8 text-[10px] font-medium text-slate-400">
            {seatMap.columns.map((c, i) => (
              <span key={c} className="w-8 text-center">
                {c}
                {i === 2 && <span className="inline-block w-4" />}
              </span>
            ))}
          </div>
          {orderedRows.map(([rowNumber, seats]) => (
            <div key={rowNumber} className="flex items-center gap-1.5">
              <span className="w-6 text-right text-[10px] font-medium text-slate-400">
                {rowNumber}
              </span>
              {seats
                .sort((a, b) => a.column.localeCompare(b.column))
                .map((seat, i) => {
                  const takenElsewhere = takenByOthers.has(seat.seatNumber);
                  const isSelected = selectedSeat === seat.seatNumber;
                  const accessibleBlocked =
                    seat.accessible && !passengerNeedsAccessibility;
                  const disabled =
                    (!seat.available && !isSelected) ||
                    takenElsewhere ||
                    accessibleBlocked;
                  return (
                    <span key={seat.seatNumber} className="flex">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelect(seat)}
                        title={`${seat.seatNumber} · ${SEAT_CLASS_LABEL[seat.seatClass]}${
                          seat.accessible ? " · Accessible" : ""
                        }${seat.fee > 0 ? ` · ${formatMoney(seat.fee, seatMap.currency)}` : " · Free"}`}
                        className={seatClass(
                          isSelected,
                          disabled,
                          seat,
                        )}
                      >
                        {seat.accessible ? "♿" : seat.column}
                      </button>
                      {i === 2 && <span className="inline-block w-4" />}
                    </span>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function seatClass(isSelected: boolean, disabled: boolean, seat: Seat): string {
  const base =
    "h-8 w-8 rounded-md border text-[11px] font-semibold transition";
  if (isSelected) {
    return `${base} border-emerald-500 bg-emerald-500 text-white`;
  }
  if (disabled) {
    return `${base} cursor-not-allowed border-slate-200 bg-slate-200 text-slate-400`;
  }
  if (seat.accessible) {
    return `${base} border-sky-300 bg-sky-50 text-sky-700 hover:border-sky-400`;
  }
  if (seat.fee > 0) {
    return `${base} border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-400`;
  }
  return `${base} border-slate-200 bg-white text-slate-600 hover:border-slate-400`;
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-4 w-4 rounded border ${className}`} />
      {label}
    </span>
  );
}
