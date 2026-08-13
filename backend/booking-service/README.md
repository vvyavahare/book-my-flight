# booking-service

Creates and retrieves flight bookings. Validates the chosen flight against
[flight-search-service](../flight-search-service) over REST before confirming, then emits a
`BookingCreated` domain event. Runs standalone on in-memory **H2**.

- **Port:** 8082
- **Base package:** `com.pet.project.airline.booking`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/bookings` | Create a booking (`PENDING_PAYMENT`); validates flight, prices it, emits event, broadcasts. `201`. |
| `GET` | `/api/bookings/mine` | List the authenticated user's own bookings. |
| `POST` | `/api/bookings/{id}/payment` | **Owner** — take (mock) payment → `PAID`. |
| `GET` | `/api/bookings/{id}/refund-quote` | **Owner** — preview the refund for cancelling now. |
| `PUT` | `/api/bookings/{id}` | **Owner** — modify passenger details / email (typo corrections only). |
| `POST` | `/api/bookings/{id}/cancel` | **Owner** — cancel and compute refund. |
| `GET` | `/api/bookings` | **Admin** — list every booking, newest first. |
| `GET` | `/api/bookings/stream` | **Admin** — SSE feed of created/updated bookings. |
| `GET` | `/api/bookings/{id}` | Fetch a booking by id. |
| `GET` | `/actuator/health` | Liveness/readiness. |

**Request** (`CreateBookingRequest`):

```json
{
  "flightId": "KL1007-2026-08-12",
  "contactEmail": "traveler@example.com",
  "passengers": [
    { "firstName": "Ada", "lastName": "Lovelace", "passportNumber": "X123" }
  ]
}
```

**Response** (`BookingDto`): `id, reference, flightId, flightNumber, origin, destination,
departureTime, contactEmail, bookedBy, passengers[], totalPrice, currency, status, amountPaid,
refundAmount, paymentReference, createdAt`. `bookedBy` is captured from the gateway's
`X-Auth-User` header; owner-scoped endpoints check it.

## Payments, modify & refunds

- Bookings start `PENDING_PAYMENT`; `POST /{id}/payment` records a mock payment and moves them
  to `PAID`.
- `RefundPolicy` computes cancellation refunds: 100% (7+ days out), 50% (<7 days, different
  day), 30% (day of travel before departure), 0% (at/after departure).
- `NameSimilarity` enforces modify rules: free typo corrections and passport/email edits, but
  wholesale passenger-name changes or count changes (ticket transfers) are rejected.

## Realtime feed

`BookingStreamBroadcaster` keeps the SSE emitters registered via `GET /api/bookings/stream`.
When a booking is created, paid, modified or cancelled, `BookingService` broadcasts the
updated `BookingDto` to every subscriber (`event: booking`) — this powers the realtime admin
dashboard. The gateway enforces the `ADMIN` role on both the list and stream endpoints.

## Inter-service call

`FlightClient` calls `GET /api/flights/{id}` on flight-search using a `RestClient`. The base
URL is configurable via `airline.clients.flight-search.base-url` (default
`http://localhost:8081`) so it works locally, via the gateway, or in Kubernetes.

## Events (Kafka placeholder)

`BookingEventPublisher` abstracts event publication:

- Default `LoggingBookingEventPublisher` **logs** the event — keeps the service broker-free.
- `KafkaBookingEventPublisher` is a documented placeholder; enabling the `kafka` profile plus
  the `spring-kafka` dependency switches publication to the `booking-events` topic. A future
  notification-service consumes it.

## Packages

`web → service → repository → domain`, with `dto`, `event`, `client`, `config` as leaf
packages (guardrail-enforced — see [`docs/`](docs)). The domain model is
`Booking "1" -- "0..*" Passenger` plus the `BookingStatus` enum.

## Profiles

| Profile | Effect |
|---------|--------|
| _default_ | H2 in-memory DB, `ddl-auto=create-drop`, events logged |
| `postgres` | PostgreSQL datasource (uncomment the driver in [`pom.xml`](pom.xml)) |
| `kafka` | Publish `BookingCreated` to Kafka (uncomment `spring-kafka` + the publisher) |

## Run

```bash
./mvnw -pl booking-service spring-boot:run                # from backend/
# or
java -jar target/booking-service-0.0.1-SNAPSHOT.jar
```

## Diagrams & guardrails

See [`docs/README.md`](docs/README.md).
