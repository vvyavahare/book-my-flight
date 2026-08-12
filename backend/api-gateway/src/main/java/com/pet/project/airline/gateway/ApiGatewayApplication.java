package com.pet.project.airline.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * API gateway: the single public entry point. Routes requests to the flight-search and
 * booking services and enforces JWT authentication (except the login endpoint).
 */
@SpringBootApplication(scanBasePackages = "com.pet.project.airline.gateway")
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
