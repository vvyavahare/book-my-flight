package com.pet.project.airline.booking.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/**
 * An optional add-on service (e.g. onboard Wi-Fi, priority boarding, lounge access) a
 * traveller can add to a booking. Managed by admins (price, availability).
 */
@Entity
@Table(name = "amenities")
public class Amenity {

    @Id
    @Column(nullable = false, updatable = false)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private boolean available;

    protected Amenity() {
        // for JPA
    }

    public Amenity(String id, String name, String description, BigDecimal price, boolean available) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.available = available;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public boolean isAvailable() {
        return available;
    }

    /** Apply an admin edit to this amenity. */
    public void update(String name, String description, BigDecimal price, boolean available) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.available = available;
    }
}
