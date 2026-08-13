package com.pet.project.airline.flightsearch.service;

import com.pet.project.airline.common.dto.PageResponse;
import com.pet.project.airline.flightsearch.domain.Flight;
import com.pet.project.airline.flightsearch.dto.AirportDto;
import com.pet.project.airline.flightsearch.dto.FlightDto;
import com.pet.project.airline.flightsearch.repository.FlightRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * Admin-facing flight listing: backend pagination, sorting, and a forgiving search that
 * matches across every column, resolves city synonyms (Mumbai == Bombay) and tolerates
 * small typos (fuzzy match). Operates over the in-memory catalog, so it filters and pages
 * in the service for simplicity.
 */
@Service
@Transactional(readOnly = true)
public class FlightQueryService {

    private final FlightRepository repository;
    private final AirportCatalog airportCatalog;

    public FlightQueryService(FlightRepository repository, AirportCatalog airportCatalog) {
        this.repository = repository;
        this.airportCatalog = airportCatalog;
    }

    /**
     * Paginated, searchable list of flights for the admin console.
     *
     * @param query        free-text search across all columns (nullable/blank = all)
     * @param page         zero-based page index
     * @param size         page size (1..200)
     * @param sort         "field,dir" e.g. "departureTime,asc"
     * @param includeInactive when false, soft-deleted flights are excluded
     */
    public PageResponse<FlightDto> adminSearch(String query, int page, int size, String sort,
                                               boolean includeInactive) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 200);

        List<Flight> matches = repository.findAll().stream()
                .filter(f -> includeInactive || f.isActive())
                .filter(f -> matches(f, query))
                .sorted(comparator(sort))
                .toList();

        long total = matches.size();
        int from = Math.min(safePage * safeSize, matches.size());
        int to = Math.min(from + safeSize, matches.size());
        List<FlightDto> content = matches.subList(from, to).stream()
                .map(this::toDto)
                .toList();

        return new PageResponse<>(content, safePage, safeSize, total);
    }

    // ── Matching ────────────────────────────────────────────────────────────────

    private boolean matches(Flight flight, String query) {
        if (query == null || query.isBlank()) {
            return true;
        }
        String q = query.trim().toLowerCase(Locale.ROOT);
        String haystack = searchableText(flight);

        // Direct + synonym-expanded substring match across all columns.
        for (String term : CitySynonyms.equivalents(q)) {
            if (haystack.contains(term)) {
                return true;
            }
        }
        // Typo tolerance: compare the query against each token in the searchable text.
        if (q.length() >= 3) {
            int threshold = q.length() >= 5 ? 2 : 1;
            for (String token : haystack.split("[^a-z0-9]+")) {
                if (token.length() >= 3 && FuzzyText.withinDistance(token, q, threshold)) {
                    return true;
                }
            }
        }
        return false;
    }

    /** Every searchable attribute of a flight, including the city/country of its airports. */
    private String searchableText(Flight f) {
        StringBuilder sb = new StringBuilder();
        append(sb, f.getId());
        append(sb, f.getFlightNumber());
        append(sb, f.getAirline());
        append(sb, f.getOrigin());
        append(sb, f.getDestination());
        append(sb, f.getPrice() == null ? null : f.getPrice().toPlainString());
        append(sb, f.getCurrency());
        append(sb, String.valueOf(f.getSeatsAvailable()));
        append(sb, f.isActive() ? "active" : "inactive deleted");
        appendAirport(sb, f.getOrigin());
        appendAirport(sb, f.getDestination());
        return sb.toString().toLowerCase(Locale.ROOT);
    }

    private void appendAirport(StringBuilder sb, String code) {
        airportCatalog.findByCode(code).ifPresent((AirportDto a) -> {
            append(sb, a.name());
            append(sb, a.city());
            append(sb, a.country());
        });
    }

    private void append(StringBuilder sb, String value) {
        if (value != null) {
            sb.append(value).append(' ');
        }
    }

    // ── Sorting ─────────────────────────────────────────────────────────────────

    private Comparator<Flight> comparator(String sort) {
        String field = "departureTime";
        boolean ascending = true;
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            field = parts[0].trim();
            if (parts.length > 1) {
                ascending = !"desc".equalsIgnoreCase(parts[1].trim());
            }
        }
        Comparator<Flight> comparator = switch (field) {
            case "price" -> Comparator.comparing(Flight::getPrice);
            case "flightNumber" -> Comparator.comparing(Flight::getFlightNumber, String.CASE_INSENSITIVE_ORDER);
            case "airline" -> Comparator.comparing(Flight::getAirline, String.CASE_INSENSITIVE_ORDER);
            case "origin" -> Comparator.comparing(Flight::getOrigin, String.CASE_INSENSITIVE_ORDER);
            case "destination" -> Comparator.comparing(Flight::getDestination, String.CASE_INSENSITIVE_ORDER);
            case "seatsAvailable" -> Comparator.comparingInt(Flight::getSeatsAvailable);
            case "arrivalTime" -> Comparator.comparing(Flight::getArrivalTime);
            default -> Comparator.comparing(Flight::getDepartureTime);
        };
        // Stable tiebreaker by id keeps paging deterministic.
        comparator = comparator.thenComparing(Flight::getId);
        return ascending ? comparator : comparator.reversed();
    }

    private FlightDto toDto(Flight f) {
        return new FlightDto(
                f.getId(),
                f.getFlightNumber(),
                f.getAirline(),
                f.getOrigin(),
                f.getDestination(),
                f.getDepartureTime(),
                f.getArrivalTime(),
                f.getPrice(),
                f.getCurrency(),
                f.getSeatsAvailable(),
                f.isActive());
    }

    /** Small Levenshtein helper for typo-tolerant matching. */
    static final class FuzzyText {
        private FuzzyText() {
        }

        static boolean withinDistance(String a, String b, int max) {
            int distance = levenshtein(a, b, max);
            return distance <= max;
        }

        private static int levenshtein(String a, String b, int max) {
            int la = a.length();
            int lb = b.length();
            if (Math.abs(la - lb) > max) {
                return max + 1;
            }
            int[] prev = new int[lb + 1];
            int[] curr = new int[lb + 1];
            for (int j = 0; j <= lb; j++) {
                prev[j] = j;
            }
            for (int i = 1; i <= la; i++) {
                curr[0] = i;
                int rowMin = curr[0];
                for (int j = 1; j <= lb; j++) {
                    int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                    curr[j] = Math.min(Math.min(prev[j] + 1, curr[j - 1] + 1), prev[j - 1] + cost);
                    rowMin = Math.min(rowMin, curr[j]);
                }
                if (rowMin > max) {
                    return max + 1;
                }
                int[] tmp = prev;
                prev = curr;
                curr = tmp;
            }
            return prev[lb];
        }
    }
}
