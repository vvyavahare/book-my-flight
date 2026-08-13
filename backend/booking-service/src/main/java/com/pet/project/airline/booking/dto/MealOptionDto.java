package com.pet.project.airline.booking.dto;

import com.pet.project.airline.booking.domain.DietaryPreference;

import java.math.BigDecimal;

/**
 * API representation of a meal option.
 */
public record MealOptionDto(
        String id,
        String name,
        String description,
        DietaryPreference dietary,
        BigDecimal price,
        String imageUrl,
        boolean available
) {
}
