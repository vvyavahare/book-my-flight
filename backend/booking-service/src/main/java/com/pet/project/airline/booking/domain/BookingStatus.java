package com.pet.project.airline.booking.domain;

/**
 * Lifecycle of a booking.
 * <pre>
 * PENDING_PAYMENT --pay--&gt; PAID --cancel--&gt; CANCELLED (with optional REFUNDED marker)
 * </pre>
 * {@code CONFIRMED} is retained for backward compatibility with earlier bookings.
 */
public enum BookingStatus {
    PENDING_PAYMENT,
    PAID,
    CONFIRMED,
    CANCELLED,
    REFUNDED
}
