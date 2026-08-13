package com.pet.project.airline.gateway.security;

import com.pet.project.airline.common.security.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

/**
 * Validates the {@code Authorization: Bearer <token>} header on protected routes.
 * Public paths (login, actuator, CORS pre-flight) are skipped. On success the resolved
 * username is forwarded downstream as the {@code X-Auth-User} header.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return "OPTIONS".equalsIgnoreCase(request.getMethod())
                || path.startsWith("/api/auth/")
                || path.startsWith("/actuator/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String token = resolveToken(request);
        if (token == null) {
            writeUnauthorized(request, response, "Missing or malformed Authorization header");
            return;
        }

        Claims claims;
        try {
            claims = jwtService.parse(token);
        } catch (Exception ex) {
            writeUnauthorized(request, response, "Invalid or expired token");
            return;
        }

        String roles = claims.get("roles", String.class);
        if (requiresAdmin(request) && !hasAdminRole(roles)) {
            writeForbidden(request, response, "Administrator role required");
            return;
        }

        HttpServletRequest mutated = new HeaderAddingRequestWrapper(request, Map.of(
                "X-Auth-User", claims.getSubject() == null ? "" : claims.getSubject(),
                "X-Auth-Roles", roles == null ? "" : roles));
        chain.doFilter(mutated, response);
    }

    /** Read the bearer token from the Authorization header or the access_token query param. */
    private String resolveToken(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        String queryToken = request.getParameter("access_token");
        if (queryToken != null && !queryToken.isBlank()) {
            return queryToken;
        }
        return null;
    }

    /** Endpoints that only administrators may call. */
    private boolean requiresAdmin(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod().toUpperCase();

        // Flight management (create / update / soft-delete / admin listing).
        if ("POST".equals(method) && "/api/flights".equals(path)) {
            return true;
        }
        if (("PUT".equals(method) || "DELETE".equals(method)) && path.startsWith("/api/flights/")) {
            return true;
        }
        if ("GET".equals(method) && "/api/flights/admin".equals(path)) {
            return true;
        }

        // Booking oversight (list all + live feed). User-scoped booking paths stay open.
        if ("GET".equals(method) && "/api/bookings".equals(path)) {
            return true;
        }
        if ("GET".equals(method) && "/api/bookings/stream".equals(path)) {
            return true;
        }

        // Ancillary catalog management (meals, amenities, fee policy). Reads stay open so
        // travellers can browse and price selections; writes are admin-only.
        if (path.startsWith("/api/catalog/") && !"GET".equals(method)) {
            return true;
        }

        // Seat availability management (block / unblock). Reading the seat map stays open;
        // listing or changing blocked seats is admin-only.
        if (path.startsWith("/api/seatmaps/") && path.contains("/blocks")) {
            return true;
        }
        return false;
    }

    private boolean hasAdminRole(String roles) {
        if (roles == null) {
            return false;
        }
        for (String role : roles.split(",")) {
            if ("ADMIN".equalsIgnoreCase(role.trim())) {
                return true;
            }
        }
        return false;
    }

    private void writeUnauthorized(HttpServletRequest request, HttpServletResponse response, String message)
            throws IOException {
        writeError(request, response, HttpStatus.UNAUTHORIZED, message);
    }

    private void writeForbidden(HttpServletRequest request, HttpServletResponse response, String message)
            throws IOException {
        writeError(request, response, HttpStatus.FORBIDDEN, message);
    }

    private void writeError(HttpServletRequest request, HttpServletResponse response, HttpStatus status,
                            String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        String body = """
                {"timestamp":"%s","status":%d,"error":"%s","message":"%s","path":"%s"}"""
                .formatted(Instant.now(), status.value(), status.getReasonPhrase(),
                        escape(message), escape(request.getRequestURI()));
        response.getWriter().write(body);
    }

    private static String escape(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
