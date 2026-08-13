package com.pet.project.airline.booking.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A seat an admin has taken out of service on a specific flight (maintenance, crew rest,
 * held inventory). Blocked seats show as unavailable in the seat map and cannot be booked.
 */
@Entity
@Table(name = "blocked_seats")
public class BlockedSeat {

    @Id
    @Column(nullable = false, updatable = false)
    private String id;

    @Column(nullable = false)
    private String flightId;

    @Column(nullable = false)
    private String seatNumber;

    protected BlockedSeat() {
        // for JPA
    }

    public BlockedSeat(String flightId, String seatNumber) {
        this.id = flightId + ":" + seatNumber;
        this.flightId = flightId;
        this.seatNumber = seatNumber;
    }

    public String getId() {
        return id;
    }

    public String getFlightId() {
        return flightId;
    }

    public String getSeatNumber() {
        return seatNumber;
    }
}
