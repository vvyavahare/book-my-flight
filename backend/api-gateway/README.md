# api-gateway

The single public entry point. Routes requests to the microservices and enforces JWT
authentication. The frontend talks **only** to this service.

- **Port:** 8080
- **Base package:** `com.pet.project.airline.gateway`
- Built on **Spring Cloud Gateway (servlet / webmvc)** — matches Spring Boot 4.1 /
  Spring Cloud 2025.1.

## Routing

| Predicate | Routed to | Config key |
|-----------|-----------|------------|
| `Path=/api/flights/**` | flight-search-service | `airline.services.flight-search-url` (`:8081`) |
| `Path=/api/bookings/**` | booking-service | `airline.services.booking-url` (`:8082`) |

## Authentication

- `POST /api/auth/login` — dev login. Validates a single configured demo user
  (`airline.security.demo-user` / `demo-password`, default `demo` / `demo`) and returns a
  signed **HS256 JWT**:

  ```json
  { "token": "…", "tokenType": "Bearer", "expiresInMinutes": 60, "username": "demo" }
  ```

- `JwtAuthenticationFilter` validates `Authorization: Bearer <token>` on every `/api/**`
  request **except** `/api/auth/**` and `/actuator/**`. On success it forwards the resolved
  username downstream as the `X-Auth-User` header. On failure it returns a `401` `ApiError`.

> This is intentionally minimal — a dedicated user/auth service replaces the inline login in a
> later phase; downstream services already receive `X-Auth-User`.

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
| `airline.security.demo-user` / `demo-password` | `demo` / `demo` | Dev login credentials |

## Run

```bash
./mvnw -pl api-gateway spring-boot:run                    # from backend/
# or
java -jar target/api-gateway-0.0.1-SNAPSHOT.jar
```

## Full API reference

See [`../../docs/API.md`](../../docs/API.md).
