package com.pet.project.airline.common.web;

import java.time.Instant;
import java.util.List;

/**
 * Standard error payload returned by all airline services so the frontend can
 * render consistent error messages.
 */
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        List<String> details
) {
    public static ApiError of(int status, String error, String message, String path) {
        return new ApiError(Instant.now(), status, error, message, path, List.of());
    }
}
