// Shared API types mirroring the backend DTOs exposed through the gateway.

export type SeatClass = "ECONOMY" | "BUSINESS" | "FIRST";

export type DietaryPreference =
  | "VEGETARIAN"
  | "VEGAN"
  | "NON_VEGETARIAN"
  | "GLUTEN_FREE";

export interface PassengerInput {
  firstName: string;
  lastName: string;
  passportNumber?: string;
  needsAccessibility?: boolean;
  seatNumber?: string | null;
  seatClass?: SeatClass | null;
  mealId?: string | null;
  checkedBags?: number;
  baggageWeightKg?: number;
}

export interface CreateBookingRequest {
  flightId: string;
  contactEmail: string;
  passengers: PassengerInput[];
  amenityIds?: string[];
}

/** A passenger as returned on a booking, including their resolved ancillary fees. */
export interface BookingPassenger {
  firstName: string;
  lastName: string;
  passportNumber?: string | null;
  needsAccessibility: boolean;
  seatNumber?: string | null;
  seatClass?: SeatClass | null;
  seatFee: number;
  mealId?: string | null;
  mealName?: string | null;
  mealPrice: number;
  checkedBags: number;
  baggageWeightKg: number;
  baggageFee: number;
}

export interface AmenitySelection {
  amenityId: string;
  name: string;
  price: number;
}

export interface Booking {
  id: string;
  reference: string;
  flightId: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  contactEmail: string;
  bookedBy: string;
  passengers: BookingPassenger[];
  amenities: AmenitySelection[];
  baseFare: number;
  seatFeesTotal: number;
  baggageFeesTotal: number;
  mealFeesTotal: number;
  amenityFeesTotal: number;
  totalPrice: number;
  currency: string;
  status: string;
  amountPaid: number;
  refundAmount: number;
  paymentReference?: string | null;
  createdAt: string;
}

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
  seatsAvailable: number;
  active: boolean;
}

export interface UpdateFlightRequest {
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
  seatsAvailable: number;
}

export interface ModifyBookingRequest {
  contactEmail: string;
  passengers: PassengerInput[];
}

export interface PaymentRequest {
  cardHolder: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}

export interface RefundQuote {
  amount: number;
  percent: number;
  reason: string;
}

// ── Ancillaries ─────────────────────────────────────────────────────────────

export interface Seat {
  seatNumber: string;
  row: number;
  column: string;
  seatClass: SeatClass;
  fee: number;
  accessible: boolean;
  available: boolean;
}

export interface SeatMap {
  flightId: string;
  currency: string;
  columns: string[];
  seats: Seat[];
}

export interface MealOption {
  id: string;
  name: string;
  description: string;
  dietary: DietaryPreference;
  price: number;
  imageUrl: string;
  available: boolean;
}

export interface Amenity {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
}

export interface AncillaryConfig {
  economySeatFee: number;
  businessSeatFee: number;
  firstSeatFee: number;
  economyBag1Fee: number;
  economyBag2Fee: number;
  economyBag3Fee: number;
  businessBag2Fee: number;
  businessBag3Fee: number;
  maxCheckedBags: number;
  maxCheckedWeightKg: number;
  currency: string;
}

export interface MealOptionRequest {
  name: string;
  description: string;
  dietary: DietaryPreference;
  price: number;
  imageUrl: string;
  available: boolean;
}

export interface AmenityRequest {
  name: string;
  description: string;
  price: number;
  available: boolean;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
}

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface CreateFlightRequest {
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
  seatsAvailable: number;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresInMinutes: number;
  username: string;
  roles: string;
}

export interface ApiErrorBody {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  details?: string[];
}
