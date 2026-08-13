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
Accounts (dev only):

| Username | Password | Role  | Can |
|----------|----------|-------|-----|
| `admin`  | `admin`  | ADMIN | manage flights (create/update/soft-delete/list), list all bookings, live booking feed |
| any other username | `demo` | USER | search + book flights, pay, modify/cancel own bookings |

Any username (except `admin`) combined with the shared user password (`demo`) signs in as a
distinct traveller, so multiple users each keep their own bookings (e.g. `alice`/`demo`,
`bob`/`demo`).

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
    "seatsAvailable": 180,
    "active": true
  }
]
```

Only `active` (non-soft-deleted) flights are returned.

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

### `GET /api/flights/admin`  · **admin**

Paginated, searchable listing of the whole catalog for the admin console. Requires `ADMIN`.

| Query param | Default | Notes |
|-------------|---------|-------|
| `q` | — | Free text matched across **all** columns (flight number, airline, origin/destination codes, and the city/name/country of both airports, price, currency). Resolves **city synonyms** (`Bombay` → `BOM`/Mumbai) and tolerates small typos (`Mumbi` → Mumbai). |
| `page` | `0` | Zero-based page index |
| `size` | `10` | Page size (1–200) |
| `sort` | `departureTime,asc` | `field,dir` — field ∈ {flightNumber, airline, origin, destination, departureTime, arrivalTime, price, seatsAvailable} |
| `includeInactive` | `true` | Include soft-deleted flights |

**200** → `PageResponse<Flight>`:
```json
{ "content": [ { "id": "…", "active": true } ], "page": 0, "size": 10, "totalElements": 210 }
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

### `PUT /api/flights/{id}`  · **admin**

Update an existing flight. Body is the same shape as create (`UpdateFlightRequest`). **200** →
the updated `Flight`; **404** unknown id; **400** validation; **403** non-admin.

### `DELETE /api/flights/{id}`  · **admin**

**Soft-delete** a flight: sets `active=false` so it disappears from search but is preserved for
history. **200** → the flight with `active:false`; **404** unknown id; **403** non-admin.

## Bookings  (routed to booking-service)

Booking lifecycle: `PENDING_PAYMENT` → (pay) → `PAID` → (cancel) → `CANCELLED`/`REFUNDED`.
Booking management endpoints (`mine`, payment, modify, cancel, refund-quote) are
**owner-scoped**: the caller must be the user who made the booking (`X-Auth-User`), otherwise
**403**.

### `POST /api/bookings`

Create a booking. Validates the flight via flight-search, prices it (`price × passengers`),
persists it as `PENDING_PAYMENT`, emits a `BookingCreated` event, and broadcasts it on the
live feed. The authenticated user is recorded as `bookedBy`.

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
  "status": "PENDING_PAYMENT",
  "amountPaid": 0.00,
  "refundAmount": 0.00,
  "paymentReference": null,
  "createdAt": "2026-08-12T19:31:31.156Z"
}
```

`bookedBy` is the authenticated username (from `X-Auth-User`), so the admin dashboard can
show who made each booking. New bookings start `PENDING_PAYMENT` until paid.

Errors: **400** validation / not enough seats · **404** unknown `flightId`.

### `GET /api/bookings/mine`

List the authenticated user's own bookings, newest first. **200** → array of `BookingDto`.

### `POST /api/bookings/{id}/payment`  · owner

Take (mock) payment to confirm a booking (`PENDING_PAYMENT` → `PAID`). Owner-only.

**Request** (`PaymentRequest` — not really charged)
```json
{ "cardHolder": "Ada Lovelace", "cardNumber": "4111111111111111", "expiry": "12/29", "cvc": "123" }
```

**200** → the `PAID` booking (`amountPaid` = total, `paymentReference` set). **400** if the
booking is not awaiting payment; **403** if not the owner.

### `PUT /api/bookings/{id}`  · owner

Modify passenger details and contact email. **Correction rules** (enforced server-side):

- The passenger count is fixed — you cannot add or remove passengers (that would be a transfer).
- Each passenger name may only be adjusted as a **typo correction**. A wholesale name change
  (transferring the ticket to a different person) is rejected with **400**.
- Passport numbers and the contact email can be changed freely, at no charge.

**Request** (`ModifyBookingRequest`)
```json
{
  "contactEmail": "ada@example.com",
  "passengers": [ { "firstName": "Adah", "lastName": "Lovelace", "passportNumber": "X123" } ]
}
```

**200** → the updated booking; **400** rule violation; **403** not the owner.

### `GET /api/bookings/{id}/refund-quote`  · owner

Preview the refund for cancelling now, without cancelling. **200** →
`{ "amount": 129.00, "percent": 100, "reason": "…" }`.

### `POST /api/bookings/{id}/cancel`  · owner

Cancel a booking and compute the refund per the policy below. **200** → the cancelled booking
with `status` `CANCELLED`/`REFUNDED` and `refundAmount` set. **400** if already cancelled;
**403** if not the owner.

**Refund policy** (based on time before departure):

| When cancelled | Refund |
|----------------|--------|
| 7+ days before departure | 100% |
| less than 7 days, but not the day of travel | 50% |
| on the day of travel, before departure | 30% |
| at/after departure (no-show) | 0% |

### `GET /api/bookings`  · **admin**

List every booking, newest first. Requires the `ADMIN` role. **200** → array of `BookingDto`;
**403** for non-admins.

### `GET /api/bookings/stream`  · **admin**

Server-Sent Events (SSE) feed of booking activity — this powers the **realtime** admin
dashboard. Requires the `ADMIN` role. Because browser `EventSource` cannot set headers, pass
the JWT as `?access_token=<jwt>`.

- `event: connected` / `data: ok` — sent once on subscribe.
- `event: booking` / `data: <BookingDto>` — sent for every booking **created or updated**
  (payment, modification, cancellation), so the dashboard can upsert the row live.

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
