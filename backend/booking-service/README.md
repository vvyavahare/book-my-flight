# booking-service

Creates and retrieves flight bookings. Validates the chosen flight against
[flight-search-service](../flight-search-service) over REST before confirming, then emits a
`BookingCreated` domain event. Runs standalone on in-memory **H2**.

- **Port:** 8082
- **Base package:** `com.pet.project.airline.booking`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/bookings` | Create a booking (validates flight, prices it, persists, emits event). Returns `201`. |
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
departureTime, contactEmail, passengers[], totalPrice, currency, status, createdAt`.

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
