package com.pet.project.airline.booking.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

/**
 * A confirmed flight booking (aggregate root) with its passengers.
 */
@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @Column(nullable = false, updatable = false)
    private String id;

    @Column(nullable = false, unique = true)
    private String reference;

    @Column(nullable = false)
    private String flightId;

    @Column(nullable = false)
    private String flightNumber;

    @Column(nullable = false)
    private String origin;

    @Column(nullable = false)
    private String destination;

    @Column(nullable = false)
    private LocalDateTime departureTime;

    @Column(nullable = false)
    private String contactEmail;

    @Column(nullable = false)
    private String bookedBy;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "booking_passengers", joinColumns = @JoinColumn(name = "booking_id"))
    private List<Passenger> passengers;

    @Column(nullable = false)
    private BigDecimal totalPrice;

    @Column(nullable = false)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status;

    @Column(nullable = false)
    private BigDecimal amountPaid;

    @Column(nullable = false)
    private BigDecimal refundAmount;

    @Column
    private String paymentReference;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected Booking() {
        // for JPA
    }

    public Booking(String id, String reference, String flightId, String flightNumber, String origin,
                   String destination, LocalDateTime departureTime, String contactEmail,
                   String bookedBy, List<Passenger> passengers, BigDecimal totalPrice, String currency) {
        this.id = id;
        this.reference = reference;
        this.flightId = flightId;
        this.flightNumber = flightNumber;
        this.origin = origin;
        this.destination = destination;
        this.departureTime = departureTime;
        this.contactEmail = contactEmail;
        this.bookedBy = bookedBy;
        this.passengers = passengers;
        this.totalPrice = totalPrice;
        this.currency = currency;
        this.status = BookingStatus.PENDING_PAYMENT;
        this.amountPaid = BigDecimal.ZERO;
        this.refundAmount = BigDecimal.ZERO;
        this.createdAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public String getReference() {
        return reference;
    }

    public String getFlightId() {
        return flightId;
    }

    public String getFlightNumber() {
        return flightNumber;
    }

    public String getOrigin() {
        return origin;
    }

    public String getDestination() {
        return destination;
    }

    public LocalDateTime getDepartureTime() {
        return departureTime;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public String getBookedBy() {
        return bookedBy;
    }

    public List<Passenger> getPassengers() {
        return passengers;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public String getCurrency() {
        return currency;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public BigDecimal getAmountPaid() {
        return amountPaid;
    }

    public BigDecimal getRefundAmount() {
        return refundAmount;
    }

    public String getPaymentReference() {
        return paymentReference;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    // ── Behaviour ────────────────────────────────────────────────────────────────

    /** Record a successful payment and confirm the booking. */
    public void markPaid(String paymentReference) {
        if (status != BookingStatus.PENDING_PAYMENT) {
            throw new IllegalStateException("Booking is not awaiting payment (status=" + status + ")");
        }
        this.paymentReference = paymentReference;
        this.amountPaid = this.totalPrice;
        this.status = BookingStatus.PAID;
    }

    /** Cancel the booking, recording the refunded amount. */
    public void cancel(BigDecimal refund) {
        if (status == BookingStatus.CANCELLED || status == BookingStatus.REFUNDED) {
            throw new IllegalStateException("Booking is already cancelled");
        }
        this.refundAmount = refund == null ? BigDecimal.ZERO : refund;
        this.status = this.refundAmount.signum() > 0 ? BookingStatus.REFUNDED : BookingStatus.CANCELLED;
    }

    /** Replace passenger details and contact email (used by modify with typo-correction rules). */
    public void reviseDetails(List<Passenger> passengers, String contactEmail) {
        this.passengers = passengers;
        this.contactEmail = contactEmail;
    }

    public boolean isCancelled() {
        return status == BookingStatus.CANCELLED || status == BookingStatus.REFUNDED;
    }
}
