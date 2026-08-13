package com.pet.project.airline.booking.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

/**
 * API representation of a booking returned to clients.
 */
public record BookingDto(
        String id,
        String reference,
        String flightId,
        String flightNumber,
        String origin,
        String destination,
        LocalDateTime departureTime,
        String contactEmail,
        String bookedBy,
        List<PassengerDto> passengers,
        BigDecimal totalPrice,
        String currency,
        String status,
        BigDecimal amountPaid,
        BigDecimal refundAmount,
        String paymentReference,
        Instant createdAt
) {
    public record PassengerDto(String firstName, String lastName, String passportNumber) {
    }
}
