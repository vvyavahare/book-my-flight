package com.pet.project.airline.booking.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Admin payload to block (take out of service) a seat on a flight.
 */
public record BlockSeatRequest(
        @NotBlank String seatNumber
) {
}
