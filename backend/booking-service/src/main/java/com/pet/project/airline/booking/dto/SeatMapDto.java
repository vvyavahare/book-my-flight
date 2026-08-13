package com.pet.project.airline.booking.dto;

import java.util.List;

/**
 * The seat map for a flight: every seat with its class/fee/availability, plus the column
 * layout so the client can group seats into rows.
 */
public record SeatMapDto(
        String flightId,
        String currency,
        List<String> columns,
        List<SeatDto> seats
) {
}
