package com.pet.project.airline.booking.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.math.BigDecimal;

/**
 * An amenity selected on a booking, captured as a snapshot (name + price at time of
 * booking) so later admin price changes don't rewrite historical bookings.
 */
@Embeddable
public class BookingAmenity {

    @Column(name = "amenity_id", nullable = false)
    private String amenityId;

    @Column(name = "amenity_name", nullable = false)
    private String name;

    @Column(name = "amenity_price", nullable = false)
    private BigDecimal price;

    protected BookingAmenity() {
        // for JPA
    }

    public BookingAmenity(String amenityId, String name, BigDecimal price) {
        this.amenityId = amenityId;
        this.name = name;
        this.price = price;
    }

    public String getAmenityId() {
        return amenityId;
    }

    public String getName() {
        return name;
    }

    public BigDecimal getPrice() {
        return price;
    }
}
