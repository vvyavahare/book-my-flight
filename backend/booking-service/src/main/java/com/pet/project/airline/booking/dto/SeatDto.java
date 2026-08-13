package com.pet.project.airline.booking.dto;

import com.pet.project.airline.booking.domain.SeatClass;

import java.math.BigDecimal;

/**
 * A single seat in a flight's seat map, with its class, fee and availability so the UI can
 * render a selectable cabin layout.
 */
public record SeatDto(
        String seatNumber,
        int row,
        String column,
        SeatClass seatClass,
        BigDecimal fee,
        boolean accessible,
        boolean available
) {
}
