import type {
  Airport,
  Amenity,
  AmenityRequest,
  AncillaryConfig,
  Booking,
  CreateBookingRequest,
  CreateFlightRequest,
  Flight,
  LoginResponse,
  MealOption,
  MealOptionRequest,
  ModifyBookingRequest,
  PageResponse,
  PaymentRequest,
  RefundQuote,
  SeatMap,
  UpdateFlightRequest,
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

  async listMyBookings(): Promise<Booking[]> {
    return request<Booking[]>("/api/bookings/mine");
  },

  async payBooking(id: string, payload: PaymentRequest): Promise<Booking> {
    return request<Booking>(`/api/bookings/${id}/payment`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getRefundQuote(id: string): Promise<RefundQuote> {
    return request<RefundQuote>(`/api/bookings/${id}/refund-quote`);
  },

  async modifyBooking(
    id: string,
    payload: ModifyBookingRequest,
  ): Promise<Booking> {
    return request<Booking>(`/api/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async cancelBooking(id: string): Promise<Booking> {
    return request<Booking>(`/api/bookings/${id}/cancel`, { method: "POST" });
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

  async updateFlight(id: string, payload: UpdateFlightRequest): Promise<Flight> {
    return request<Flight>(`/api/flights/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteFlight(id: string): Promise<Flight> {
    return request<Flight>(`/api/flights/${id}`, { method: "DELETE" });
  },

  async adminListFlights(params: {
    q?: string;
    page?: number;
    size?: number;
    sort?: string;
    includeInactive?: boolean;
  }): Promise<PageResponse<Flight>> {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    search.set("page", String(params.page ?? 0));
    search.set("size", String(params.size ?? 10));
    if (params.sort) search.set("sort", params.sort);
    if (params.includeInactive !== undefined) {
      search.set("includeInactive", String(params.includeInactive));
    }
    return request<PageResponse<Flight>>(
      `/api/flights/admin?${search.toString()}`,
    );
  },

  // ── Ancillaries: seat map, meals, amenities, fee policy ────────────────────

  async getSeatMap(flightId: string): Promise<SeatMap> {
    return request<SeatMap>(`/api/seatmaps/${encodeURIComponent(flightId)}`);
  },

  async getMeals(includeUnavailable = false): Promise<MealOption[]> {
    const q = includeUnavailable ? "?includeUnavailable=true" : "";
    return request<MealOption[]>(`/api/catalog/meals${q}`);
  },

  async getAmenities(includeUnavailable = false): Promise<Amenity[]> {
    const q = includeUnavailable ? "?includeUnavailable=true" : "";
    return request<Amenity[]>(`/api/catalog/amenities${q}`);
  },

  async getAncillaryConfig(): Promise<AncillaryConfig> {
    return request<AncillaryConfig>("/api/catalog/config");
  },

  // Admin catalog management
  async createMeal(payload: MealOptionRequest): Promise<MealOption> {
    return request<MealOption>("/api/catalog/meals", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateMeal(
    id: string,
    payload: MealOptionRequest,
  ): Promise<MealOption> {
    return request<MealOption>(`/api/catalog/meals/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteMeal(id: string): Promise<void> {
    return request<void>(`/api/catalog/meals/${id}`, { method: "DELETE" });
  },

  async createAmenity(payload: AmenityRequest): Promise<Amenity> {
    return request<Amenity>("/api/catalog/amenities", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateAmenity(id: string, payload: AmenityRequest): Promise<Amenity> {
    return request<Amenity>(`/api/catalog/amenities/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteAmenity(id: string): Promise<void> {
    return request<void>(`/api/catalog/amenities/${id}`, { method: "DELETE" });
  },

  async updateAncillaryConfig(
    payload: AncillaryConfig,
  ): Promise<AncillaryConfig> {
    return request<AncillaryConfig>("/api/catalog/config", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  // Admin seat availability management
  async getBlockedSeats(flightId: string): Promise<string[]> {
    return request<string[]>(
      `/api/seatmaps/${encodeURIComponent(flightId)}/blocks`,
    );
  },

  async blockSeat(flightId: string, seatNumber: string): Promise<string[]> {
    return request<string[]>(
      `/api/seatmaps/${encodeURIComponent(flightId)}/blocks`,
      { method: "POST", body: JSON.stringify({ seatNumber }) },
    );
  },

  async unblockSeat(flightId: string, seatNumber: string): Promise<string[]> {
    return request<string[]>(
      `/api/seatmaps/${encodeURIComponent(flightId)}/blocks/${encodeURIComponent(seatNumber)}`,
      { method: "DELETE" },
    );
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
