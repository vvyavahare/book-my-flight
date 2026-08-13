package com.pet.project.airline.booking.dto;

import java.math.BigDecimal;

/**
 * API representation of the admin-managed seat/baggage fee policy.
 */
public record AncillaryConfigDto(
        BigDecimal economySeatFee,
        BigDecimal businessSeatFee,
        BigDecimal firstSeatFee,
        BigDecimal economyBag1Fee,
        BigDecimal economyBag2Fee,
        BigDecimal economyBag3Fee,
        BigDecimal businessBag2Fee,
        BigDecimal businessBag3Fee,
        int maxCheckedBags,
        int maxCheckedWeightKg,
        String currency
) {
}
