package com.pet.project.airline.booking.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Request payload to create a booking for a specific flight.
 */
public record CreateBookingRequest(
        @NotBlank String flightId,
        @Email @NotBlank String contactEmail,
        @NotEmpty @Valid List<PassengerRequest> passengers
) {
    public record PassengerRequest(
            @NotBlank String firstName,
            @NotBlank String lastName,
            String passportNumber
    ) {
    }
}
