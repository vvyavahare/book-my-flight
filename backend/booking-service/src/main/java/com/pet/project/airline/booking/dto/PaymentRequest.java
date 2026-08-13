package com.pet.project.airline.booking.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Simple (mock) payment details submitted to confirm a booking. No real card processing
 * happens — the values are validated for presence and a payment reference is generated.
 */
public record PaymentRequest(
        @NotBlank String cardHolder,
        @NotBlank String cardNumber,
        @NotBlank String expiry,
        @NotBlank String cvc
) {
}
