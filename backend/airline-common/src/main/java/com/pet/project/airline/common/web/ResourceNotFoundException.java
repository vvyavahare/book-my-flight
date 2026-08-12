package com.pet.project.airline.common.web;

/**
 * Thrown when a requested resource (flight, booking, ...) cannot be found.
 * Mapped to HTTP 404 by {@link GlobalExceptionHandler}.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
