# Documentation index

Central map of the docs across this monorepo.

## Start here

- [Project README](../README.md) — overview, quick start, ports, roadmap table.

## Reference

- [Architecture & roadmap](ARCHITECTURE.md) — design principles, request flow, auth, eventing,
  guardrails, and the phased roadmap.
- [API reference](API.md) — every gateway endpoint with request/response shapes and errors.

## Backend

- [Backend overview](../backend/README.md) — module map, build/run, profiles.
  - [airline-bom](../backend/airline-bom/README.md) — dependency-version management (BOM).
  - [airline-common](../backend/airline-common/README.md) — shared error/JWT/DTO library.
  - [flight-search-service](../backend/flight-search-service/README.md) — catalog + search.
    - [diagrams](../backend/flight-search-service/docs/README.md) — packages + domain model.
  - [booking-service](../backend/booking-service/README.md) — bookings + events.
    - [diagrams](../backend/booking-service/docs/README.md) — packages + domain model.
  - [api-gateway](../backend/api-gateway/README.md) — routing + JWT auth.

## Frontend

- [Frontend README](../frontend/README.md) — Next.js app: stack, screens, API client, auth.

## Operations

- [infra](../infra/README.md) — Postgres/Elasticsearch/Kafka/Grafana placeholders + enabling.
- [scripts](../scripts/README.md) — start/stop/smoke-test helpers.

## Architecture guardrails (living diagrams)

Adopted from [victorrentea/petclinic](https://github.com/victorrentea/petclinic):

- **`PackagesArchTest`** keeps each service's `docs/packages.puml` in sync with its package
  structure (ArchUnit).
- **`DomainModelExtractorTest`** regenerates each service's `docs/generated/DomainModel.puml`
  from the `domain` package via reflection.

Details in [ARCHITECTURE.md](ARCHITECTURE.md#architecture-guardrails-living-code-coupled-diagrams).
