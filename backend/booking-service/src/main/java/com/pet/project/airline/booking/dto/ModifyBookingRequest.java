package com.pet.project.airline.booking.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * Request payload to modify an existing booking. Only passenger detail corrections and the
 * contact email may change — the passenger count is fixed and wholesale name changes
 * (ticket transfers) are rejected by the service.
 */
public record ModifyBookingRequest(
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
