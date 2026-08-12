package com.pet.project.airline.booking.client;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Subset of the flight-search service's flight representation that booking needs.
 */
public record FlightSummary(
        String id,
        String flightNumber,
        String origin,
        String destination,
        LocalDateTime departureTime,
        BigDecimal price,
        String currency,
        int seatsAvailable
) {
}
