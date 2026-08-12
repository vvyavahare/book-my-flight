package com.pet.project.airline.flightsearch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Flight search microservice: owns the flight catalog and exposes search endpoints.
 * Scans the shared {@code com.pet.project.airline} base package to reuse common web components.
 */
@SpringBootApplication(scanBasePackages = "com.pet.project.airline")
public class FlightSearchApplication {

    public static void main(String[] args) {
        SpringApplication.run(FlightSearchApplication.class, args);
    }
}
