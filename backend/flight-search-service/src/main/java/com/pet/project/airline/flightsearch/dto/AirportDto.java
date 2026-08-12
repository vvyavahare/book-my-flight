package com.pet.project.airline.flightsearch.dto;

/**
 * A selectable airport in the global catalog, used to populate searchable
 * origin/destination dropdowns in the UI.
 */
public record AirportDto(
        String code,
        String name,
        String city,
        String country
) {
}
