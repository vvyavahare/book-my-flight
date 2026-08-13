package com.pet.project.airline.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

/**
 * Admin payload to create or update an amenity.
 */
public record AmenityRequest(
        @NotBlank String name,
        @NotBlank String description,
        @NotNull @PositiveOrZero BigDecimal price,
        boolean available
) {
}
