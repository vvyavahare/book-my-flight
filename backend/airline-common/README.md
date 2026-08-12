# airline-common

Shared library (plain jar) reused by the services. Keeps cross-cutting concerns in one place
so every service returns consistent responses and handles auth the same way.

## Contents

| Package | Class | Purpose |
|---------|-------|---------|
| `common.web` | `ApiError` | Standard JSON error payload (timestamp, status, message, path, details) |
| `common.web` | `ResourceNotFoundException` | Thrown for missing resources → HTTP 404 |
| `common.web` | `GlobalExceptionHandler` | `@RestControllerAdvice` mapping exceptions to `ApiError` |
| `common.security` | `JwtProperties` | JWT secret / issuer / expiry (with safe dev defaults) |
| `common.security` | `JwtService` | Issue & validate HS256 tokens (framework-agnostic) |
| `common.dto` | `PageResponse<T>` | Generic paginated response wrapper |

## How services pick it up

Services component-scan the shared base package `com.pet.project.airline`, so
`GlobalExceptionHandler` is registered automatically. `JwtService` / `JwtProperties` are
instantiated explicitly where needed (see the API gateway's `GatewaySecurityConfig`) rather
than auto-wired everywhere.

## Notes

- Built as a normal jar — the Spring Boot repackage goal is disabled (it is a library, not an
  app).
- Depends only on `spring-boot-starter-web` and the JWT libraries, both version-managed by
  [`airline-bom`](../airline-bom).
