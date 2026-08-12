package com.pet.project.airline.common.dto;

import java.util.List;

/**
 * Minimal, generic paginated response wrapper shared across services.
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements
) {
    public static <T> PageResponse<T> of(List<T> content) {
        return new PageResponse<>(content, 0, content.size(), content.size());
    }
}
