# Backend — Airline microservices

Maven multi-module build (Spring Boot 4.1 / Java 25) containing the platform's backend
services and shared libraries. The frontend lives in [`../frontend`](../frontend); local
infrastructure placeholders in [`../infra`](../infra).

## Modules

| Module | Type | Port | Purpose |
|--------|------|------|---------|
| [`airline-bom`](airline-bom) | BOM (pom) | — | Central dependency-version management |
| [`airline-common`](airline-common) | library (jar) | — | Shared error handling, DTOs, JWT utilities |
| [`flight-search-service`](flight-search-service) | Spring Boot app | 8081 | Flight catalog + search API |
| [`booking-service`](booking-service) | Spring Boot app | 8082 | Create/read bookings |
| [`api-gateway`](api-gateway) | Spring Boot app | 8080 | Single entry point + JWT auth |

`airline-parent` ([`pom.xml`](pom.xml)) is the aggregator: it inherits from
`spring-boot-starter-parent`, imports `airline-bom`, and lists the modules.

## Build & run

```bash
# From this directory
./mvnw clean install                 # build everything + run tests

# Run each service (default H2 profile — no external infra required)
java -jar flight-search-service/target/flight-search-service-0.0.1-SNAPSHOT.jar   # :8081
java -jar booking-service/target/booking-service-0.0.1-SNAPSHOT.jar               # :8082
java -jar api-gateway/target/api-gateway-0.0.1-SNAPSHOT.jar                       # :8080
```

Or use the repo-root helpers: [`../scripts/start-all.sh`](../scripts) and `stop-all.sh`.

## Configuration profiles

Every service runs standalone on an in-memory **H2** database by default. Optional Spring
profiles reserve the configuration surface for later infrastructure (see each service's
`src/main/resources/application.yaml` and [`../infra`](../infra)):

| Profile | Service(s) | Effect |
|---------|-----------|--------|
| `postgres` | flight-search, booking | Switch datasource to PostgreSQL |
| `elasticsearch` | flight-search | Reserve ES config for search offload |
| `kafka` | booking | Publish `BookingCreated` events to Kafka |

Activate with `--spring.profiles.active=postgres` (and uncomment the matching dependency in
the service `pom.xml`).

## Architecture guardrails

Each service carries living, code-coupled diagrams under `docs/`, kept honest by tests:

- **`PackagesArchTest`** — ArchUnit keeps `docs/packages.puml` in sync with the real package
  structure (dependency adherence + exact package-set match).
- **`DomainModelExtractorTest`** — regenerates `docs/generated/DomainModel.puml` from the
  `domain` package via reflection.

Run: `./mvnw -pl flight-search-service,booking-service test`. Full explanation in
[`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md#architecture-guardrails-living-code-coupled-diagrams).

## Conventions

- Base package: `com.pet.project.airline.<service>`. Services component-scan
  `com.pet.project.airline` to reuse `airline-common`; the gateway scans only its own package.
- Package layering (guardrail-enforced): `web → service → repository → domain`, with `dto`
  (and, in booking, `event` / `client` / `config`) as leaf packages.
- **Spring Boot 4 / Spring Framework 7 use Jackson 3** (`tools.jackson`). Do **not** add
  Jackson 2 (`com.fasterxml.jackson`) explicitly — it is a different, unmanaged type.
