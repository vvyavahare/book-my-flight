# API Reference

All client traffic goes through the **api-gateway** at `http://localhost:8080`. The gateway
enforces JWT auth on `/api/**` (except `/api/auth/**`) and routes to the microservices.

- Base URL: `http://localhost:8080`
- Auth: `Authorization: Bearer <token>` on every endpoint except login
- Content type: `application/json`
- Errors: consistent `ApiError` shape (see [Errors](#errors))

## Authentication

### `POST /api/auth/login`

Dev login. Returns a signed HS256 JWT (valid 60 min by default). No auth required.
Two seeded accounts:

| Username | Password | Role  | Can |
|----------|----------|-------|-----|
| `demo`   | `demo`   | USER  | search + book flights |
| `admin`  | `admin`  | ADMIN | everything USER can, plus list all bookings, the live booking feed, and creating flights |

**Request**
```json
{ "username": "admin", "password": "admin" }
```

**200 Response**
```json
{ "token": "<jwt>", "tokenType": "Bearer", "expiresInMinutes": 60, "username": "admin", "roles": "ADMIN" }
```

**401** — invalid credentials: `{ "message": "Invalid credentials" }`

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"demo","password":"demo"}' | jq -r .token)
```

The JWT carries a `roles` claim. The gateway forwards the authenticated user and roles
downstream as `X-Auth-User` / `X-Auth-Roles`, and enforces the `ADMIN` role on admin-only
endpoints (marked **admin** below). For endpoints consumed by the browser `EventSource`
(SSE), the token may also be supplied as an `access_token` query parameter instead of the
`Authorization` header.

## Flights  (routed to flight-search-service)

### `GET /api/flights`

Search flights by route and optional departure date (defaults to today).

| Query param | Required | Example | Notes |
|-------------|----------|---------|-------|
| `origin` | yes | `AMS` | IATA code |
| `destination` | yes | `LHR` | IATA code |
| `date` | no | `2026-08-12` | ISO `yyyy-MM-dd` |

**200 Response** — array of `Flight`:
```json
[
  {
    "id": "KL1007-2026-08-12",
    "flightNumber": "KL1007",
    "airline": "KLM",
    "origin": "AMS",
    "destination": "LHR",
    "departureTime": "2026-08-12T08:30:00",
    "arrivalTime": "2026-08-12T09:50:00",
    "price": 129.00,
    "currency": "EUR",
    "seatsAvailable": 180
  }
]
```

```bash
curl -s "http://localhost:8080/api/flights?origin=AMS&destination=LHR&date=$(date +%F)" \
  -H "Authorization: Bearer $TOKEN"
```

### `GET /api/flights/{id}`

Fetch one flight. **200** → a `Flight`; **404** if not found.

### `GET /api/flights/airports`

Global catalog of ~75 major world airports used to populate the searchable origin/destination
dropdowns. **200** → array of `Airport`:

```json
[
  { "code": "AMS", "name": "Amsterdam Schiphol", "city": "Amsterdam", "country": "Netherlands" }
]
```

### `POST /api/flights`  · **admin**

Create a new flight in the catalog. Requires the `ADMIN` role.

**Request** (`CreateFlightRequest`)
```json
{
  "flightNumber": "KL1099",
  "airline": "KLM",
  "origin": "AMS",
  "destination": "JFK",
  "departureTime": "2026-09-01T09:00:00",
  "arrivalTime": "2026-09-01T17:00:00",
  "price": 549.00,
  "currency": "EUR",
  "seatsAvailable": 180
}
```

The flight `id` is derived as `<FLIGHTNUMBER>-<departureDate>`. **201** → the created `Flight`.
Errors: **400** validation / arrival not after departure / same origin & destination · **403**
non-admin.

## Bookings  (routed to booking-service)

### `POST /api/bookings`

Create a booking. Validates the flight via flight-search, prices it (`price × passengers`),
persists it, and emits a `BookingCreated` event.

**Request** (`CreateBookingRequest`)
```json
{
  "flightId": "KL1007-2026-08-12",
  "contactEmail": "traveler@example.com",
  "passengers": [
    { "firstName": "Ada", "lastName": "Lovelace", "passportNumber": "X123" }
  ]
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `flightId` | yes | Must exist in flight-search |
| `contactEmail` | yes | Valid email |
| `passengers[].firstName` / `lastName` | yes | |
| `passengers[].passportNumber` | no | |

**201 Response** (`BookingDto`)
```json
{
  "id": "e64b233c-…",
  "reference": "0DA4A4",
  "flightId": "KL1007-2026-08-12",
  "flightNumber": "KL1007",
  "origin": "AMS",
  "destination": "LHR",
  "departureTime": "2026-08-12T08:30:00",
  "contactEmail": "traveler@example.com",
  "bookedBy": "demo",
  "passengers": [ { "firstName": "Ada", "lastName": "Lovelace", "passportNumber": "X123" } ],
  "totalPrice": 129.00,
  "currency": "EUR",
  "status": "CONFIRMED",
  "createdAt": "2026-08-12T19:31:31.156Z"
}
```

`bookedBy` is the authenticated username (from `X-Auth-User`), so the admin dashboard can
show who made each booking.

Errors: **400** validation / not enough seats · **404** unknown `flightId`.

### `GET /api/bookings`  · **admin**

List every booking, newest first. Requires the `ADMIN` role. **200** → array of `BookingDto`;
**403** for non-admins.

### `GET /api/bookings/stream`  · **admin**

Server-Sent Events (SSE) feed of bookings as they are created — this powers the **realtime**
admin dashboard. Requires the `ADMIN` role. Because browser `EventSource` cannot set headers,
pass the JWT as `?access_token=<jwt>`.

- `event: connected` / `data: ok` — sent once on subscribe.
- `event: booking` / `data: <BookingDto>` — sent for every new booking.

```bash
curl -N "http://localhost:8080/api/bookings/stream?access_token=$ADMIN_TOKEN"
```

### `GET /api/bookings/{id}`

Fetch a booking by id. **200** → a `BookingDto`; **404** if not found.

## Errors

All services return a consistent error body:

```json
{
  "timestamp": "2026-08-12T19:31:31.156Z",
  "status": 404,
  "error": "Not Found",
  "message": "Flight not found: XYZ",
  "path": "/api/flights/XYZ",
  "details": []
}
```

| Status | When |
|--------|------|
| `400` | Validation failure / bad request (`details` lists field errors) |
| `401` | Missing/invalid/expired JWT (or bad login) |
| `403` | Authenticated but lacking the required role (admin-only endpoint) |
| `404` | Resource not found |
| `500` | Unexpected server error |

## Health

Each service exposes `GET /actuator/health` (gateway `:8080`, flight-search `:8081`,
booking `:8082`).

## End-to-end example

See [`../scripts/smoke-test.sh`](../scripts/smoke-test.sh) for a runnable
`401 → login → search → book → fetch` walkthrough.
