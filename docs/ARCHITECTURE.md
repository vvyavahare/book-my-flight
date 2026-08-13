# Architecture & Roadmap

## Design principles

- **Microservices per domain.** Each service owns its data and exposes a REST API. No
  shared database between services; `booking-service` talks to `flight-search-service`
  over HTTP (a configurable base URL so it works locally, via the gateway, or in k8s).
- **Single entry point.** The `api-gateway` (Spring Cloud Gateway, servlet/webmvc) is the
  only thing the frontend talks to. It centralises routing, CORS and authentication.
- **Runs anywhere, zero setup.** Default profile = in-memory H2. External systems
  (Postgres, Elasticsearch, Kafka) are behind Spring profiles and `infra/docker-compose.yml`
  so the happy path never requires Docker.
- **Dependency hygiene via BOM.** `airline-bom` is the single source of truth for versions;
  every module inherits it through the parent POM.

## Modules

| Module                  | Responsibility                                            | Storage (default) |
|-------------------------|-----------------------------------------------------------|-------------------|
| `airline-bom`           | Centralised dependency versions (BOM)                     | —                 |
| `airline-common`        | Shared error handling, DTOs, JWT utility                  | —                 |
| `flight-search-service` | Flight catalog + search (`/api/flights`)                  | H2 (seeded)       |
| `booking-service`       | Create/read bookings (`/api/bookings`), calls flight-search| H2               |
| `api-gateway`           | Routing + JWT auth + dev login (`/api/auth/login`)        | —                 |

## Request flow (book a flight)

1. `POST /api/auth/login` at the gateway → returns a signed JWT (demo creds).
2. Frontend stores the JWT and sends it as `Authorization: Bearer <token>`.
3. `GET /api/flights?...` → gateway validates JWT → routes to flight-search.
4. `POST /api/bookings` → gateway validates JWT → routes to booking-service.
5. booking-service calls flight-search (`GET /api/flights/{id}`) to validate & price,
   persists the booking, and publishes a `BookingCreated` event.

## Authentication & authorization

- HS256 JWT issued and validated by the gateway (`JwtService` in `airline-common`).
- Config under `airline.security.jwt.*`; override the secret via
  `AIRLINE_SECURITY_JWT_SECRET` in real environments.
- Dev accounts: `admin/admin` (role `ADMIN`) and any other username with the shared user
  password (`demo`) → role `USER`, so multiple distinct travellers can each keep their own
  bookings. The token carries a `roles` claim.
- The gateway forwards `X-Auth-User` and `X-Auth-Roles` downstream and enforces the `ADMIN`
  role on admin-only endpoints (flight create/update/delete, `GET /api/flights/admin`,
  `GET /api/bookings`, `GET /api/bookings/stream`). User-scoped booking endpoints (`/mine`,
  payment, modify, cancel) are open to any authenticated user; **ownership** is enforced in
  `booking-service` by comparing `X-Auth-User` to the booking's `bookedBy` (else `403`).
  A dedicated **user/auth service** replaces the inline login later; downstream services keep
  consuming the same forwarded headers.
- SSE endpoints also accept the token as an `access_token` query parameter, because the
  browser `EventSource` API cannot send an `Authorization` header.

## Realtime (SSE)

- `booking-service` exposes `GET /api/bookings/stream` — a Server-Sent Events feed. A
  `BookingStreamBroadcaster` holds the connected emitters; when a booking is created, paid,
  modified or cancelled the service fans the updated `BookingDto` out to every subscriber.
- The admin dashboard (frontend `/admin`) subscribes via `EventSource` and **upserts** rows,
  so bookings and their status changes appear in the admin's table instantly — no polling.
- This streams cleanly through the gateway (`text/event-stream`). Moving to Kafka/WebSockets
  later is additive and does not change the API surface.

## Data & search

- `flight-search-service` seeds ~30 routes (European short-haul, transatlantic, Middle
  East/Asia long-haul and southern-hemisphere) across 7 days on startup, plus a global
  catalog of ~75 major airports (`AirportCatalog`) exposed at `GET /api/flights/airports`
  to power searchable origin/destination dropdowns.
- Admins manage the catalog at runtime: create (`POST`), update (`PUT`), and **soft-delete**
  (`DELETE` → `active=false`, hidden from search but preserved). `GET /api/flights/admin`
  provides a backend-paginated, sortable listing with a forgiving search (`FlightQueryService`)
  that matches every column, resolves **city synonyms** (`CitySynonyms`, e.g. Mumbai ⇄ Bombay)
  and tolerates typos via Levenshtein distance.
- The `elasticsearch` profile reserves the configuration surface for moving search to
  Elasticsearch (add the ES starter + an `ElasticsearchFlightRepository`).

## Payments & refunds

- Bookings are created `PENDING_PAYMENT` and confirmed via a simple (mock) payment
  (`POST /api/bookings/{id}/payment`) that records an `amountPaid` and `paymentReference` and
  moves the booking to `PAID`. No real card processing happens.
- Cancellation (`POST /api/bookings/{id}/cancel`) computes a refund with `RefundPolicy`:
  100% at 7+ days before departure, 50% under 7 days (different day), 30% on the day of travel
  before departure, 0% at/after departure. `GET /api/bookings/{id}/refund-quote` previews it.
- Modifications (`PUT /api/bookings/{id}`) allow free typo corrections and passport/email
  edits but reject ticket transfers (wholesale passenger-name changes or changing the
  passenger count), enforced by `NameSimilarity` (Levenshtein-based).

## Eventing (Kafka) — deferred

- `BookingEventPublisher` abstracts event publication. The default
  `LoggingBookingEventPublisher` just logs, keeping the service broker-free.
- `KafkaBookingEventPublisher` is a documented placeholder; enabling the `kafka` profile
  (plus the `spring-kafka` dependency) switches publication to the `booking-events` topic.
- A future **notification-service** consumes `booking-events` to email/notify travellers.

## Roadmap

1. **Phase 1 (done):** gateway + JWT, flight-search, booking, Next.js UI, BOM, H2.
2. **Admin & realtime (done):** role-based admin login landing on a management console,
   full flight CRUD with soft-delete, backend-paginated fuzzy/synonym search, live SSE
   booking feed, global airport catalog with searchable dropdowns.
3. **Multi-user bookings & payments (done):** any username as a distinct traveller,
   per-user "my bookings", mock payment flow, modify with typo-correction rules, and
   cancellation with a tiered refund policy.
4. **Notification service + Kafka:** booking-service produces `BookingCreated`; a new
   service consumes and notifies.
5. **Real persistence:** switch services to Postgres profiles; add Flyway migrations.
6. **Search at scale:** index flights into Elasticsearch; richer filters/sorting.
7. **User/auth service:** real accounts, roles, refresh tokens; gateway validates only.
8. **Observability:** Micrometer → Prometheus, logs → Loki, traces → Tempo, Grafana
   dashboards (LGTM). Actuator is already enabled on every service.
9. **Containerise & deploy:** Dockerfiles per service, docker-compose for full local
   stack, then Kubernetes manifests / Helm; move config to ConfigMaps/Secrets.
10. **Realtime at scale:** the admin feed uses SSE today; move to WebSocket/Kafka-backed
   fan-out for multi-instance deployments and live seat availability.

## Conventions

- Package root: `com.pet.project.airline.<service>`.
- Services component-scan `com.pet.project.airline` to reuse `airline-common` components
  (e.g. the global exception handler). The gateway scans only its own package.
- Spring Boot 4 / Spring Framework 7 use **Jackson 3** (`tools.jackson`); avoid pulling in
  Jackson 2 (`com.fasterxml.jackson`) explicitly.

## Architecture guardrails (living, code-coupled diagrams)

Adopted from [victorrentea/petclinic](https://github.com/victorrentea/petclinic): diagrams are
kept honest by tests that fail the build when code and diagram drift apart. Each backend
service carries its own diagrams under `<service>/docs/`.

### 1. `packages.puml` kept in sync with code structure — `PackagesArchTest`

Source of truth: hand-authored `<service>/docs/packages.puml`. An ArchUnit test
(`…guardrail.PackagesArchTest`) enforces two things on every build:

- **Dependency adherence.** `adhereToPlantUmlDiagram(...)` asserts every cross-package
  dependency in the code is an edge the diagram allows. Add an import that isn't drawn →
  the build fails until you either draw the edge or remove the dependency.
- **Package-set match.** The diagram's `<<..pkg>>` stereotype set must equal the code's
  actual subpackages exactly — no drawn package missing from code, no code package missing
  from the drawing.

The diagram uses the portable **gravity recipe** (documented at the top of each
`packages.puml`): a package is drawn below everything that depends on it, invisible `label`
anchors force clean rows, and a cycle would render as one red double-headed line. Our layout
is acyclic — which is why the DTO records were moved into a dedicated `dto` package (the
service layer needed them but must not depend on the `web`/controller layer).

Layers by depth: `web → service → repository → domain`, with `dto` (and, in booking,
`event`/`client`/`config`) as leaf packages.

### 2. `DomainModel.puml` generated from code — `DomainModelExtractorTest`

`…guardrail.DomainModelExtractorTest` reflects over the `domain` package and regenerates
`<service>/docs/generated/DomainModel.puml` — classes, enums, plain-field attributes, and
associations with inferred cardinalities (a collection field ⇒ `0..*`, a single reference ⇒
`1`; unidirectional refs fall back to the classic foreign-key shape). It derives everything
from **field types alone**, so it needs no JPA annotations. Example output (booking-service):
`Booking "1" -- "0..*" Passenger` and the `BookingStatus` enum association.

The READMEs embed committed SVG renderings of both `.puml` files. Refresh them locally with
`./scripts/render-diagrams.sh`; this avoids relying on an external rendering service and makes
the diagrams readable on GitHub and offline. **Drift is caught two ways:** `PackagesArchTest`
fails immediately on package drift, and committing the regenerated `DomainModel.puml` lets a CI
`git diff --exit-code` step (or a pre-push hook) flag an out-of-date domain diagram.

Run them: `./mvnw -pl flight-search-service,booking-service test`.
