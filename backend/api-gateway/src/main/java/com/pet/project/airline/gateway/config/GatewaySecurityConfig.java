package com.pet.project.airline.gateway.config;

import com.pet.project.airline.common.security.JwtProperties;
import com.pet.project.airline.common.security.JwtService;
import com.pet.project.airline.gateway.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

/**
 * Wires JWT signing/validation, the authentication filter, and CORS for the frontend.
 */
@Configuration
public class GatewaySecurityConfig {

    @Bean
    JwtProperties jwtProperties(
            @Value("${airline.security.jwt.secret:}") String secret,
            @Value("${airline.security.jwt.issuer:airline-api-gateway}") String issuer,
            @Value("${airline.security.jwt.expiration-minutes:60}") long expirationMinutes) {
        return new JwtProperties(secret, issuer, expirationMinutes);
    }

    @Bean
    JwtService jwtService(JwtProperties jwtProperties) {
        return new JwtService(jwtProperties);
    }

    @Bean
    FilterRegistrationBean<JwtAuthenticationFilter> jwtFilter(JwtService jwtService) {
        FilterRegistrationBean<JwtAuthenticationFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new JwtAuthenticationFilter(jwtService));
        registration.addUrlPatterns("/api/*");
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 10);
        return registration;
    }

    @Bean
    CorsFilter corsFilter(@Value("${airline.cors.allowed-origins:http://localhost:3000}") List<String> allowedOrigins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
