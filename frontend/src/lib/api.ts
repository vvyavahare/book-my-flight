import type {
  Airport,
  Booking,
  CreateBookingRequest,
  CreateFlightRequest,
  Flight,
  LoginResponse,
  ApiErrorBody,
} from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const TOKEN_KEY = "airline.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

/** Error carrying the HTTP status so callers can react (e.g. redirect on 401). */
export class ApiError extends Error {
  status: number;
  body?: ApiErrorBody;

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (auth) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }

  if (!res.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new ApiError(res.status, body?.message ?? res.statusText, body);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export const api = {
  async login(username: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ username, password }) },
      false,
    );
  },

  async searchFlights(
    origin: string,
    destination: string,
    date?: string,
  ): Promise<Flight[]> {
    const params = new URLSearchParams({ origin, destination });
    if (date) params.set("date", date);
    return request<Flight[]>(`/api/flights?${params.toString()}`);
  },

  async createBooking(payload: CreateBookingRequest): Promise<Booking> {
    return request<Booking>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getBooking(id: string): Promise<Booking> {
    return request<Booking>(`/api/bookings/${id}`);
  },

  async listBookings(): Promise<Booking[]> {
    return request<Booking[]>("/api/bookings");
  },

  async getAirports(): Promise<Airport[]> {
    return request<Airport[]>("/api/flights/airports");
  },

  async createFlight(payload: CreateFlightRequest): Promise<Flight> {
    return request<Flight>("/api/flights", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

/**
 * Build the SSE URL for the live booking feed. EventSource cannot send headers, so the
 * JWT is passed as the `access_token` query parameter (the gateway accepts either).
 */
export function bookingStreamUrl(): string {
  const token = getToken();
  const params = new URLSearchParams();
  if (token) params.set("access_token", token);
  return `${API_BASE_URL}/api/bookings/stream?${params.toString()}`;
}
