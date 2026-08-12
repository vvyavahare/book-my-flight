package com.pet.project.airline.booking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Booking microservice: creates and retrieves flight bookings. Validates the chosen
 * flight against the flight-search service before confirming a booking.
 */
@SpringBootApplication(scanBasePackages = "com.pet.project.airline")
public class BookingApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookingApplication.class, args);
    }
}
