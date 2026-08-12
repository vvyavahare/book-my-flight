package com.pet.project.airline.flightsearch.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * API representation of a flight returned to clients.
 */
public record FlightDto(
        String id,
        String flightNumber,
        String airline,
        String origin,
        String destination,
        LocalDateTime departureTime,
        LocalDateTime arrivalTime,
        BigDecimal price,
        String currency,
        int seatsAvailable
) {
}
