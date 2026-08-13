package com.pet.project.airline.booking.service;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDateTime;

/**
 * Computes cancellation refunds based on how far ahead of departure the cancellation is:
 * <ul>
 *   <li>7+ days before departure ⇒ 100% refund;</li>
 *   <li>less than 7 days but not the day of travel ⇒ 50% refund;</li>
 *   <li>on the day of travel, before departure ⇒ 30% refund;</li>
 *   <li>at/after departure (no-show) ⇒ 0% refund.</li>
 * </ul>
 * The two middle tiers fill the gap the business rules left unspecified and are documented
 * in the API/architecture docs.
 */
@Component
public class RefundPolicy {

    private final Clock clock;

    public RefundPolicy() {
        this(Clock.systemDefaultZone());
    }

    RefundPolicy(Clock clock) {
        this.clock = clock;
    }

    public record RefundQuote(BigDecimal amount, int percent, String reason) {
    }

    /** Quote the refund for cancelling a booking on the given flight now. */
    public RefundQuote quote(BigDecimal amountPaid, LocalDateTime departureTime) {
        BigDecimal paid = amountPaid == null ? BigDecimal.ZERO : amountPaid;
        LocalDateTime now = LocalDateTime.now(clock);

        int percent;
        String reason;
        if (!now.isBefore(departureTime)) {
            percent = 0;
            reason = "Departure has passed — no refund.";
        } else if (!now.isAfter(departureTime.minusDays(7))) {
            percent = 100;
            reason = "Cancelled 7+ days before departure — full refund.";
        } else if (now.toLocalDate().isEqual(departureTime.toLocalDate())) {
            percent = 30;
            reason = "Cancelled on the day of travel before departure — 30% refund.";
        } else {
            percent = 50;
            reason = "Cancelled less than 7 days before departure — 50% refund.";
        }

        BigDecimal amount = paid.multiply(BigDecimal.valueOf(percent))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        return new RefundQuote(amount, percent, reason);
    }
}
