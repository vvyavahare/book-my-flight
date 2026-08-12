# flight-search-service

Owns the flight catalog and exposes the search API. Runs standalone on in-memory **H2** with
a seeded catalog — no external infrastructure required.

- **Port:** 8081
- **Base package:** `com.pet.project.airline.flightsearch`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/flights?origin={IATA}&destination={IATA}&date={yyyy-MM-dd}` | Search flights by route and (optional) departure date. Defaults to today. |
| `GET` | `/api/flights/airports` | Global catalog of ~75 major airports for searchable dropdowns. |
| `POST` | `/api/flights` | **Admin** — create a flight in the catalog. Returns `201`. |
| `GET` | `/api/flights/{id}` | Fetch a single flight by id. |
| `GET` | `/actuator/health` | Liveness/readiness. |

`FlightDto` fields: `id, flightNumber, airline, origin, destination, departureTime,
arrivalTime, price, currency, seatsAvailable`. `AirportDto` fields: `code, name, city,
country`.

> Reached through the [api-gateway](../api-gateway) in normal use; the endpoints above are the
> gateway's `/api/flights/**` route target. The gateway enforces the `ADMIN` role on
> `POST /api/flights`.

## Seed data

On startup `FlightDataSeeder` inserts ~7 days of flights across ~30 routes spanning Europe,
the Atlantic, the Middle East/Asia and the southern hemisphere (e.g. `AMS↔LHR`, `AMS↔JFK`,
`LHR→DEL`, `AMS→DXB`, `SIN→SYD`) so the API returns results immediately. `AirportCatalog`
provides the global airport list for dropdowns. Prices are in EUR; each seeded flight starts
with 180 seats.

## Packages

`web → service → repository → domain`, with `dto` and `config` as leaf packages
(guardrail-enforced — see [`docs/`](docs)).

## Profiles

| Profile | Effect |
|---------|--------|
| _default_ | H2 in-memory DB, catalog seeded, `ddl-auto=create-drop` |
| `postgres` | PostgreSQL datasource (uncomment the driver in [`pom.xml`](pom.xml)) |
| `elasticsearch` | Reserves ES config to offload search later (add the ES starter + repository) |

## Run

```bash
./mvnw -pl flight-search-service spring-boot:run          # from backend/
# or
java -jar target/flight-search-service-0.0.1-SNAPSHOT.jar
```

## Diagrams & guardrails

See [`docs/README.md`](docs/README.md) — `packages.puml` (ArchUnit-validated) and the
reflection-generated `DomainModel.puml`.
