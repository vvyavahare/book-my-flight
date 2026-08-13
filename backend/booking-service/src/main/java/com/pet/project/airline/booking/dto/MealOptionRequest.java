package com.pet.project.airline.booking.dto;

import com.pet.project.airline.booking.domain.DietaryPreference;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

/**
 * Admin payload to create or update a meal option.
 */
public record MealOptionRequest(
        @NotBlank String name,
        @NotBlank String description,
        @NotNull DietaryPreference dietary,
        @NotNull @PositiveOrZero BigDecimal price,
        @NotBlank String imageUrl,
        boolean available
) {
}
