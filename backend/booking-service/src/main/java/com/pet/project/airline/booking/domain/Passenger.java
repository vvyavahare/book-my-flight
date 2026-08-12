package com.pet.project.airline.booking.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * A passenger on a booking. Stored as part of the booking aggregate.
 */
@Embeddable
public class Passenger {

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "passport_number")
    private String passportNumber;

    protected Passenger() {
        // for JPA
    }

    public Passenger(String firstName, String lastName, String passportNumber) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.passportNumber = passportNumber;
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
}
