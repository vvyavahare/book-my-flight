package com.pet.project.airline.booking.dto;

import com.pet.project.airline.booking.domain.SeatClass;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

/**
 * API representation of a booking returned to clients, including the ancillary selections
 * (seats, meals, baggage, amenities) and the itemised price breakdown.
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
        List<AmenitySelectionDto> amenities,
        BigDecimal baseFare,
        BigDecimal seatFeesTotal,
        BigDecimal baggageFeesTotal,
        BigDecimal mealFeesTotal,
        BigDecimal amenityFeesTotal,
        BigDecimal totalPrice,
        String currency,
        String status,
        BigDecimal amountPaid,
        BigDecimal refundAmount,
        String paymentReference,
        Instant createdAt
) {
    public record PassengerDto(
            String firstName,
            String lastName,
            String passportNumber,
            boolean needsAccessibility,
            String seatNumber,
            SeatClass seatClass,
            BigDecimal seatFee,
            String mealId,
            String mealName,
            BigDecimal mealPrice,
            int checkedBags,
            int baggageWeightKg,
            BigDecimal baggageFee
    ) {
    }

    public record AmenitySelectionDto(String amenityId, String name, BigDecimal price) {
    }
}
