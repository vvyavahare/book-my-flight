package com.pet.project.airline.booking.client;

import com.pet.project.airline.common.web.ResourceNotFoundException;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Optional;

/**
 * Client for the flight-search service. Uses a configurable base URL so it works when
 * services run directly, behind the gateway, or in Kubernetes.
 */
@Component
public class FlightClient {

    private final RestClient restClient;

    public FlightClient(RestClient flightSearchRestClient) {
        this.restClient = flightSearchRestClient;
    }

    /** Fetch a flight by id, or empty if the flight-search service reports 404. */
    public Optional<FlightSummary> findFlight(String flightId) {
        FlightSummary flight = restClient.get()
                .uri("/api/flights/{id}", flightId)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                    throw new ResourceNotFoundException("Flight not found: " + flightId);
                })
                .body(FlightSummary.class);
        return Optional.ofNullable(flight);
    }
}
