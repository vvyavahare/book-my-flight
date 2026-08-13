package com.pet.project.airline.booking.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.math.BigDecimal;

/**
 * A passenger on a booking, together with their per-passenger ancillary selections
 * (seat, meal, checked baggage). Stored as part of the booking aggregate.
 */
@Embeddable
public class Passenger {

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "passport_number")
    private String passportNumber;

    /** Whether this passenger requires an accessible seat (reserved for reduced mobility). */
    @Column(name = "needs_accessibility", nullable = false)
    private boolean needsAccessibility;

    // -- Seat selection --------------------------------------------------------
    @Column(name = "seat_number")
    private String seatNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "seat_class")
    private SeatClass seatClass;

    @Column(name = "seat_fee", nullable = false)
    private BigDecimal seatFee;

    // -- Meal selection (snapshot) ---------------------------------------------
    @Column(name = "meal_id")
    private String mealId;

    @Column(name = "meal_name")
    private String mealName;

    @Column(name = "meal_price", nullable = false)
    private BigDecimal mealPrice;

    // -- Checked baggage -------------------------------------------------------
    @Column(name = "checked_bags", nullable = false)
    private int checkedBags;

    @Column(name = "baggage_weight_kg", nullable = false)
    private int baggageWeightKg;

    @Column(name = "baggage_fee", nullable = false)
    private BigDecimal baggageFee;

    protected Passenger() {
        // for JPA
    }

    /** Minimal passenger with no ancillaries (kept for backward-compatible bookings). */
    public Passenger(String firstName, String lastName, String passportNumber) {
        this(firstName, lastName, passportNumber, false,
                null, null, BigDecimal.ZERO,
                null, null, BigDecimal.ZERO,
                0, 0, BigDecimal.ZERO);
    }

    public Passenger(String firstName, String lastName, String passportNumber, boolean needsAccessibility,
                     String seatNumber, SeatClass seatClass, BigDecimal seatFee,
                     String mealId, String mealName, BigDecimal mealPrice,
                     int checkedBags, int baggageWeightKg, BigDecimal baggageFee) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.passportNumber = passportNumber;
        this.needsAccessibility = needsAccessibility;
        this.seatNumber = seatNumber;
        this.seatClass = seatClass;
        this.seatFee = seatFee == null ? BigDecimal.ZERO : seatFee;
        this.mealId = mealId;
        this.mealName = mealName;
        this.mealPrice = mealPrice == null ? BigDecimal.ZERO : mealPrice;
        this.checkedBags = checkedBags;
        this.baggageWeightKg = baggageWeightKg;
        this.baggageFee = baggageFee == null ? BigDecimal.ZERO : baggageFee;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getPassportNumber() {
        return passportNumber;
    }

    public boolean isNeedsAccessibility() {
        return needsAccessibility;
    }

    public String getSeatNumber() {
        return seatNumber;
    }

    public SeatClass getSeatClass() {
        return seatClass;
    }

    public BigDecimal getSeatFee() {
        return seatFee;
    }

    public String getMealId() {
        return mealId;
    }

    public String getMealName() {
        return mealName;
    }

    public BigDecimal getMealPrice() {
        return mealPrice;
    }

    public int getCheckedBags() {
        return checkedBags;
    }

    public int getBaggageWeightKg() {
        return baggageWeightKg;
    }

    public BigDecimal getBaggageFee() {
        return baggageFee;
    }
}
