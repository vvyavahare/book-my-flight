package com.pet.project.airline.flightsearch.service;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Maps common alternative / historical city names to a canonical form so a search for
 * "Bombay" resolves the same airports as "Mumbai". Used to expand admin flight searches.
 */
final class CitySynonyms {

    // Each group lists interchangeable names for the same city. Lower-cased at lookup.
    private static final List<Set<String>> GROUPS = List.of(
            Set.of("mumbai", "bombay"),
            Set.of("bengaluru", "bangalore"),
            Set.of("chennai", "madras"),
            Set.of("kolkata", "calcutta"),
            Set.of("delhi", "new delhi"),
            Set.of("beijing", "peking"),
            Set.of("guangzhou", "canton"),
            Set.of("ho chi minh city", "saigon"),
            Set.of("istanbul", "constantinople"),
            Set.of("new york", "nyc", "new york city"),
            Set.of("nur-sultan", "astana"),
            Set.of("yangon", "rangoon")
    );

    private static final Map<String, Set<String>> INDEX = buildIndex();

    private CitySynonyms() {
    }

    private static Map<String, Set<String>> buildIndex() {
        java.util.Map<String, Set<String>> index = new java.util.HashMap<>();
        for (Set<String> group : GROUPS) {
            for (String name : group) {
                index.put(name, group);
            }
        }
        return index;
    }

    /** All names equivalent to the given term (including itself), lower-cased. */
    static Set<String> equivalents(String term) {
        if (term == null) {
            return Set.of();
        }
        String key = term.trim().toLowerCase();
        Set<String> group = INDEX.get(key);
        if (group == null) {
            return Set.of(key);
        }
        return group;
    }
}
