package com.pet.project.airline.booking.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/**
 * Single-row configuration (id = {@link #SINGLETON_ID}) holding admin-managed fees for
 * seat classes and checked baggage, plus baggage limits. Kept as one aggregate so admins
 * edit fee policy in one place and bookings price consistently against it.
 *
 * <p>Baggage fee schedule (each way, per passenger):</p>
 * <ul>
 *   <li>Economy — 1st checked bag {@code economyBag1Fee}, 2nd {@code economyBag2Fee},
 *       3rd {@code economyBag3Fee};</li>
 *   <li>Business/First — 1st checked bag free, 2nd {@code businessBag2Fee},
 *       3rd {@code businessBag3Fee}.</li>
 * </ul>
 */
@Entity
@Table(name = "ancillary_config")
public class AncillaryConfig {

    public static final String SINGLETON_ID = "DEFAULT";

    @Id
    @Column(nullable = false, updatable = false)
    private String id;

    // ── Seat class fees ────────────────────────────────────────────────────────
    @Column(nullable = false)
    private BigDecimal economySeatFee;

    @Column(nullable = false)
    private BigDecimal businessSeatFee;

    @Column(nullable = false)
    private BigDecimal firstSeatFee;

    // ── Checked-baggage fees ───────────────────────────────────────────────────
    @Column(nullable = false)
    private BigDecimal economyBag1Fee;

    @Column(nullable = false)
    private BigDecimal economyBag2Fee;

    @Column(nullable = false)
    private BigDecimal economyBag3Fee;

    @Column(nullable = false)
    private BigDecimal businessBag2Fee;

    @Column(nullable = false)
    private BigDecimal businessBag3Fee;

    // ── Limits ─────────────────────────────────────────────────────────────────
    @Column(nullable = false)
    private int maxCheckedBags;

    @Column(nullable = false)
    private int maxCheckedWeightKg;

    @Column(nullable = false)
    private String currency;

    protected AncillaryConfig() {
        // for JPA
    }

    public AncillaryConfig(BigDecimal economySeatFee, BigDecimal businessSeatFee, BigDecimal firstSeatFee,
                           BigDecimal economyBag1Fee, BigDecimal economyBag2Fee, BigDecimal economyBag3Fee,
                           BigDecimal businessBag2Fee, BigDecimal businessBag3Fee,
                           int maxCheckedBags, int maxCheckedWeightKg, String currency) {
        this.id = SINGLETON_ID;
        this.economySeatFee = economySeatFee;
        this.businessSeatFee = businessSeatFee;
        this.firstSeatFee = firstSeatFee;
        this.economyBag1Fee = economyBag1Fee;
        this.economyBag2Fee = economyBag2Fee;
        this.economyBag3Fee = economyBag3Fee;
        this.businessBag2Fee = businessBag2Fee;
        this.businessBag3Fee = businessBag3Fee;
        this.maxCheckedBags = maxCheckedBags;
        this.maxCheckedWeightKg = maxCheckedWeightKg;
        this.currency = currency;
    }

    public String getId() {
        return id;
    }

    public BigDecimal getEconomySeatFee() {
        return economySeatFee;
    }

    public BigDecimal getBusinessSeatFee() {
        return businessSeatFee;
    }

    public BigDecimal getFirstSeatFee() {
        return firstSeatFee;
    }

    public BigDecimal getEconomyBag1Fee() {
        return economyBag1Fee;
    }

    public BigDecimal getEconomyBag2Fee() {
        return economyBag2Fee;
    }

    public BigDecimal getEconomyBag3Fee() {
        return economyBag3Fee;
    }

    public BigDecimal getBusinessBag2Fee() {
        return businessBag2Fee;
    }

    public BigDecimal getBusinessBag3Fee() {
        return businessBag3Fee;
    }

    public int getMaxCheckedBags() {
        return maxCheckedBags;
    }

    public int getMaxCheckedWeightKg() {
        return maxCheckedWeightKg;
    }

    public String getCurrency() {
        return currency;
    }

    /** The per-class seat fee for a premium (non-free) seat in the given class. */
    public BigDecimal seatFeeFor(SeatClass seatClass) {
        return switch (seatClass) {
            case FIRST -> firstSeatFee;
            case BUSINESS -> businessSeatFee;
            case ECONOMY -> economySeatFee;
        };
    }

    /** Fee for the {@code bagNumber}-th (1-based) checked bag in the given class. */
    public BigDecimal baggageFeeFor(SeatClass seatClass, int bagNumber) {
        boolean premium = seatClass == SeatClass.BUSINESS || seatClass == SeatClass.FIRST;
        return switch (bagNumber) {
            case 1 -> premium ? BigDecimal.ZERO : economyBag1Fee;
            case 2 -> premium ? businessBag2Fee : economyBag2Fee;
            case 3 -> premium ? businessBag3Fee : economyBag3Fee;
            default -> BigDecimal.ZERO;
        };
    }

    /** Apply an admin edit to the whole fee policy. */
    public void update(BigDecimal economySeatFee, BigDecimal businessSeatFee, BigDecimal firstSeatFee,
                       BigDecimal economyBag1Fee, BigDecimal economyBag2Fee, BigDecimal economyBag3Fee,
                       BigDecimal businessBag2Fee, BigDecimal businessBag3Fee,
                       int maxCheckedBags, int maxCheckedWeightKg, String currency) {
        this.economySeatFee = economySeatFee;
        this.businessSeatFee = businessSeatFee;
        this.firstSeatFee = firstSeatFee;
        this.economyBag1Fee = economyBag1Fee;
        this.economyBag2Fee = economyBag2Fee;
        this.economyBag3Fee = economyBag3Fee;
        this.businessBag2Fee = businessBag2Fee;
        this.businessBag3Fee = businessBag3Fee;
        this.maxCheckedBags = maxCheckedBags;
        this.maxCheckedWeightKg = maxCheckedWeightKg;
        this.currency = currency;
    }
}
