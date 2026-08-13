package com.pet.project.airline.booking.dto;

import com.pet.project.airline.booking.domain.SeatClass;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * Request payload to create a booking for a specific flight, including each passenger's
 * ancillary selections (seat, meal, checked baggage) and booking-level amenities. All
 * ancillary fields are optional so a bare-bones booking still works.
 */
public record CreateBookingRequest(
        @NotBlank String flightId,
        @Email @NotBlank String contactEmail,
        @NotEmpty @Valid List<PassengerRequest> passengers,
        List<String> amenityIds
) {
    public record PassengerRequest(
            @NotBlank String firstName,
            @NotBlank String lastName,
            String passportNumber,
            Boolean needsAccessibility,
            String seatNumber,
            SeatClass seatClass,
            String mealId,
            @Min(0) Integer checkedBags,
            @Min(0) Integer baggageWeightKg
    ) {
    }
}
