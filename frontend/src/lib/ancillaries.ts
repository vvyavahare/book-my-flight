import type {
  AncillaryConfig,
  DietaryPreference,
  SeatClass,
} from "./types";

export const SEAT_CLASS_LABEL: Record<SeatClass, string> = {
  ECONOMY: "Economy",
  BUSINESS: "Business",
  FIRST: "First Class",
};

export const DIETARY_LABEL: Record<DietaryPreference, string> = {
  VEGETARIAN: "Vegetarian",
  VEGAN: "Vegan",
  NON_VEGETARIAN: "Non-vegetarian",
  GLUTEN_FREE: "Gluten-free",
};

export const DIETARY_BADGE: Record<DietaryPreference, string> = {
  VEGETARIAN: "bg-emerald-100 text-emerald-700",
  VEGAN: "bg-lime-100 text-lime-700",
  NON_VEGETARIAN: "bg-rose-100 text-rose-700",
  GLUTEN_FREE: "bg-amber-100 text-amber-700",
};

/**
 * Mirror of the backend baggage fee schedule so the UI can preview the price before
 * submitting. The server remains the source of truth for the charged amount.
 */
export function baggageFee(
  config: AncillaryConfig,
  seatClass: SeatClass | null | undefined,
  bags: number,
): number {
  const premium = seatClass === "BUSINESS" || seatClass === "FIRST";
  let fee = 0;
  for (let bag = 1; bag <= bags; bag++) {
    if (bag === 1) fee += premium ? 0 : config.economyBag1Fee;
    else if (bag === 2) fee += premium ? config.businessBag2Fee : config.economyBag2Fee;
    else if (bag === 3) fee += premium ? config.businessBag3Fee : config.economyBag3Fee;
  }
  return fee;
}

/** Cabin-baggage (free hand luggage) allowance text by class. */
export function handLuggageAllowance(seatClass: SeatClass | null | undefined): string {
  if (seatClass === "BUSINESS" || seatClass === "FIRST") {
    return "2 cabin bags + 1 personal item, up to 18 kg combined (free).";
  }
  return "1 cabin bag (55×35×25 cm) + 1 personal item (40×30×15 cm), up to 12 kg combined (free).";
}
