package com.pet.project.airline.gateway.auth;

import com.pet.project.airline.common.security.JwtProperties;
import com.pet.project.airline.common.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Development login endpoint. Issues a signed JWT for the configured demo and admin users.
 * This is intentionally simple — a real user/auth service replaces it in a later phase.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final String demoUser;
    private final String demoPassword;
    private final String adminUser;
    private final String adminPassword;

    public AuthController(JwtService jwtService,
                          JwtProperties jwtProperties,
                          @Value("${airline.security.demo-user:demo}") String demoUser,
                          @Value("${airline.security.demo-password:demo}") String demoPassword,
                          @Value("${airline.security.admin-user:admin}") String adminUser,
                          @Value("${airline.security.admin-password:admin}") String adminPassword) {
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.demoUser = demoUser;
        this.demoPassword = demoPassword;
        this.adminUser = adminUser;
        this.adminPassword = adminPassword;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        String username = request.username() == null ? "" : request.username().trim();
        String roles;
        if (adminUser.equals(username) && adminPassword.equals(request.password())) {
            roles = "ADMIN";
        } else if (adminUser.equals(username)) {
            // Reserved admin username with a wrong password.
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
        } else if (!username.isBlank() && demoPassword.equals(request.password())) {
            // Dev mode: any username signs in as a distinct traveller with the shared user
            // password, so multiple users can each keep their own bookings.
            roles = "USER";
        } else {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
        }
        String token = jwtService.generateToken(username, Map.of("roles", roles));
        return ResponseEntity.ok(new LoginResponse(
                token,
                "Bearer",
                jwtProperties.expirationMinutes(),
                username,
                roles));
    }
}
