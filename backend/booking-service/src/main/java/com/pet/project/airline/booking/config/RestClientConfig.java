package com.pet.project.airline.booking.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * Wires the RestClient used to reach the flight-search service. The base URL is
 * configurable via {@code airline.clients.flight-search.base-url}.
 */
@Configuration
public class RestClientConfig {

    @Bean
    RestClient flightSearchRestClient(
            @Value("${airline.clients.flight-search.base-url:http://localhost:8081}") String baseUrl) {
        return RestClient.builder().baseUrl(baseUrl).build();
    }
}
