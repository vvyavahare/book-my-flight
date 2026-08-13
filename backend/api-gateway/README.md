# api-gateway

The single public entry point. Routes requests to the microservices and enforces JWT
authentication and role-based authorization. The frontend talks **only** to this service.

- **Port:** 8080
- **Base package:** `com.pet.project.airline.gateway`
- Built on **Spring Cloud Gateway (servlet / webmvc)** — matches Spring Boot 4.1 /
  Spring Cloud 2025.1.

## Routing

| Predicate | Routed to | Config key |
|-----------|-----------|------------|
| `Path=/api/flights/**` | flight-search-service | `airline.services.flight-search-url` (`:8081`) |
| `Path=/api/bookings/**` | booking-service | `airline.services.booking-url` (`:8082`) |

## Authentication & authorization

- `POST /api/auth/login` — dev login. Returns a signed **HS256 JWT** with a `roles` claim:

  | Username | Password | Role |
  |----------|----------|------|
  | `admin` | `admin` | `ADMIN` |
  | any other username | `demo` | `USER` |

  Any username (except `admin`) with the shared user password signs in as a distinct
  traveller, so multiple users each keep their own bookings.

  ```json
  { "token": "...", "tokenType": "Bearer", "expiresInMinutes": 60, "username": "alice", "roles": "USER" }
  ```

- `JwtAuthenticationFilter` validates the token on every `/api/**` request **except**
  `/api/auth/**` and `/actuator/**`. The token is read from the `Authorization` header or,
  as a fallback, an `access_token` query parameter (needed for browser `EventSource` SSE
  connections). On success it forwards the resolved username and roles downstream as
  `X-Auth-User` / `X-Auth-Roles`. On failure it returns a `401` `ApiError`.

- **Admin-only endpoints** additionally require the `ADMIN` role, else a `403` `ApiError`:
  flight `POST` / `PUT` / `DELETE`, `GET /api/flights/admin`, `GET /api/bookings` (list all)
  and `GET /api/bookings/stream` (live feed). User-scoped booking endpoints (`/mine`, payment,
  modify, cancel) are open to any authenticated user; `booking-service` enforces ownership.

> This is intentionally minimal — a dedicated user/auth service replaces the inline login in a
> later phase; downstream services already receive `X-Auth-User` / `X-Auth-Roles`.

## CORS

`CorsFilter` allows the frontend origin (`airline.cors.allowed-origins`, default
`http://localhost:3000`).

## Configuration

Key properties (see [`src/main/resources/application.yaml`](src/main/resources/application.yaml)):

| Property | Default | Notes |
|----------|---------|-------|
| `airline.security.jwt.secret` | dev secret | **Override via `AIRLINE_SECURITY_JWT_SECRET` in real envs** |
| `airline.security.jwt.issuer` | `airline-api-gateway` | Token issuer claim |
| `airline.security.jwt.expiration-minutes` | `60` | Token lifetime |
| `airline.security.demo-user` / `demo-password` | `demo` / `demo` | Traveller login credentials |
| `airline.security.admin-user` / `admin-password` | `admin` / `admin` | Admin login credentials |

## Run

```bash
./mvnw -pl api-gateway spring-boot:run                    # from backend/
# or
java -jar target/api-gateway-0.0.1-SNAPSHOT.jar
```

## Full API reference

See [`../../docs/API.md`](../../docs/API.md).
