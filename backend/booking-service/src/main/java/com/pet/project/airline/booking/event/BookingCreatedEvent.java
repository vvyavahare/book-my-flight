package com.pet.project.airline.booking.event;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Domain event emitted when a booking is created. In a later phase this will be published
 * to Kafka and consumed by a notification service.
 */
public record BookingCreatedEvent(
        String bookingId,
        String reference,
        String flightId,
        String contactEmail,
        BigDecimal totalPrice,
        String currency,
        Instant occurredAt
) {
}
