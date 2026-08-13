package com.pet.project.airline.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

/**
 * Admin payload to update the seat/baggage fee policy.
 */
public record AncillaryConfigRequest(
        @NotNull @PositiveOrZero BigDecimal economySeatFee,
        @NotNull @PositiveOrZero BigDecimal businessSeatFee,
        @NotNull @PositiveOrZero BigDecimal firstSeatFee,
        @NotNull @PositiveOrZero BigDecimal economyBag1Fee,
        @NotNull @PositiveOrZero BigDecimal economyBag2Fee,
        @NotNull @PositiveOrZero BigDecimal economyBag3Fee,
        @NotNull @PositiveOrZero BigDecimal businessBag2Fee,
        @NotNull @PositiveOrZero BigDecimal businessBag3Fee,
        @Positive int maxCheckedBags,
        @Positive int maxCheckedWeightKg,
        @NotBlank String currency
) {
}
