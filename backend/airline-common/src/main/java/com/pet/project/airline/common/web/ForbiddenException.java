package com.pet.project.airline.common.web;

/**
 * Thrown when an authenticated caller tries to act on a resource they do not own or lack
 * the rights for. Mapped to HTTP 403 by {@link GlobalExceptionHandler}.
 */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
