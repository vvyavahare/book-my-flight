// Shared API types mirroring the backend DTOs exposed through the gateway.

export interface PassengerInput {
  firstName: string;
  lastName: string;
  passportNumber?: string;
}

export interface CreateBookingRequest {
  flightId: string;
  contactEmail: string;
  passengers: PassengerInput[];
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
  passengers: PassengerInput[];
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
