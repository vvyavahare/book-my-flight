package com.pet.project.airline.flightsearch.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Request payload for creating a new flight in the catalog (admin only).
 */
public record CreateFlightRequest(
        @NotBlank String flightNumber,
        @NotBlank String airline,
        @NotBlank String origin,
        @NotBlank String destination,
        @NotNull LocalDateTime departureTime,
        @NotNull LocalDateTime arrivalTime,
        @NotNull @Positive BigDecimal price,
        @NotBlank String currency,
        @PositiveOrZero int seatsAvailable
) {
}
