package com.pet.project.airline.gateway.auth;

public record LoginResponse(
        String token,
        String tokenType,
        long expiresInMinutes,
        String username,
        String roles
) {
}
