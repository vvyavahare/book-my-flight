# infra — local infrastructure placeholders

**Nothing here is required for the default run.** Every backend service boots standalone with
an in-memory H2 database. These placeholders exist so you can exercise the
Postgres / Elasticsearch / Kafka / Grafana integrations later without re-architecting.

## Contents

```
infra/
├── docker-compose.yml                 # Postgres, Elasticsearch, Kafka, Grafana (all optional)
├── postgres/
│   └── init-multiple-dbs.sh           # creates the `flights` and `bookings` databases
└── grafana/
    └── provisioning/                  # datasource + dashboard provisioning (placeholders)
```

## Services in `docker-compose.yml`

| Service | Image | Host port | Used by (later) |
|---------|-------|-----------|-----------------|
| `postgres` | `postgres:17-alpine` | 5432 | flight-search, booking (`postgres` profile) |
| `elasticsearch` | `elasticsearch:8.15.3` | 9200 | flight-search (`elasticsearch` profile) |
| `kafka` | `bitnami/kafka:3.8` (KRaft) | 9092 | booking producer + future notification-service |
| `grafana` | `grafana:11.2.0` | 3300 | observability dashboards |

## Usage

```bash
# Start just what you need
docker compose -f infra/docker-compose.yml up -d postgres
docker compose -f infra/docker-compose.yml up -d               # everything
docker compose -f infra/docker-compose.yml down                # stop
```

Then run the relevant service with its profile, e.g.:

```bash
java -jar backend/flight-search-service/target/flight-search-service-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=postgres
```

(Also uncomment the matching dependency in the service `pom.xml` — the drivers/starters are
commented out by default to keep the standalone build lean.)

## Enabling matrix

| Capability | Steps |
|------------|-------|
| **Postgres** | start `postgres` → uncomment `postgresql` in the service pom → run with `postgres` profile |
| **Elasticsearch** | start `elasticsearch` → uncomment the ES starter in flight-search → add an `ElasticsearchFlightRepository` → run with `elasticsearch` profile |
| **Kafka events** | start `kafka` → uncomment `spring-kafka` + `KafkaBookingEventPublisher` → run booking with `kafka` profile |
| **Grafana** | start `grafana` → http://localhost:3300 (admin/admin) → wire Prometheus/Loki/Tempo (or the LGTM stack) |

## Grafana provisioning

`grafana/provisioning/datasources` and `.../dashboards` contain commented placeholder configs.
The Spring Boot services already expose Micrometer metrics at `/actuator/metrics`; add the
Prometheus registry to export them when you stand up the observability stack.

See [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md#roadmap) for the observability roadmap.
