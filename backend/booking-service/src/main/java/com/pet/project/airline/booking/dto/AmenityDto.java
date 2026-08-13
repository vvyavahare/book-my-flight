package com.pet.project.airline.booking.dto;

import java.math.BigDecimal;

/**
 * API representation of an add-on amenity.
 */
public record AmenityDto(
        String id,
        String name,
        String description,
        BigDecimal price,
        boolean available
) {
}
