package com.pet.project.airline.booking.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/**
 * An in-flight meal option a traveller can add to their booking. Managed by admins
 * (price, availability, dietary tag, photo) and offered per passenger at booking time.
 */
@Entity
@Table(name = "meal_options")
public class MealOption {

    @Id
    @Column(nullable = false, updatable = false)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DietaryPreference dietary;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false, length = 1000)
    private String imageUrl;

    @Column(nullable = false)
    private boolean available;

    protected MealOption() {
        // for JPA
    }

    public MealOption(String id, String name, String description, DietaryPreference dietary,
                      BigDecimal price, String imageUrl, boolean available) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.dietary = dietary;
        this.price = price;
        this.imageUrl = imageUrl;
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

    public DietaryPreference getDietary() {
        return dietary;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public boolean isAvailable() {
        return available;
    }

    /** Apply an admin edit to this meal option. */
    public void update(String name, String description, DietaryPreference dietary,
                       BigDecimal price, String imageUrl, boolean available) {
        this.name = name;
        this.description = description;
        this.dietary = dietary;
        this.price = price;
        this.imageUrl = imageUrl;
        this.available = available;
    }
}
