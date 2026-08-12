package com.pet.project.airline.common.security;

/**
 * Configuration for signing/validating JWTs. Bound in services that need it
 * (e.g. the API gateway) under the {@code airline.security.jwt} prefix.
 *
 * @param secret   HMAC signing secret (Base64 or plain text; must be long enough for HS256)
 * @param issuer   token issuer claim
 * @param expirationMinutes token lifetime in minutes
 */
public record JwtProperties(
        String secret,
        String issuer,
        long expirationMinutes
) {
    public JwtProperties {
        if (secret == null || secret.isBlank()) {
            secret = "change-me-in-prod-this-is-a-dev-only-secret-key-please-rotate";
        }
        if (issuer == null || issuer.isBlank()) {
            issuer = "airline-api-gateway";
        }
        if (expirationMinutes <= 0) {
            expirationMinutes = 60;
        }
    }
}
