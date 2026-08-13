package com.pet.project.airline.booking.service;

import java.util.Locale;

/**
 * Decides whether a passenger name edit is an allowed typo correction or a prohibited
 * ticket transfer (a wholesale name change). A correction is allowed when the new full name
 * is sufficiently similar to the original — i.e. only a few characters differ.
 */
final class NameSimilarity {

    // Allowed when at least this fraction of characters are unchanged.
    private static final double MIN_SIMILARITY = 0.6;

    private NameSimilarity() {
    }

    /** True when {@code updated} is a plausible typo fix of {@code original} (not a new person). */
    static boolean isTypoCorrection(String original, String updated) {
        String a = normalise(original);
        String b = normalise(updated);
        if (a.isEmpty() || b.isEmpty()) {
            return false;
        }
        if (a.equals(b)) {
            return true;
        }
        int distance = levenshtein(a, b);
        int longest = Math.max(a.length(), b.length());
        double similarity = 1.0 - ((double) distance / longest);
        return similarity >= MIN_SIMILARITY;
    }

    private static String normalise(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
    }

    private static int levenshtein(String a, String b) {
        int[] prev = new int[b.length() + 1];
        int[] curr = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) {
            prev[j] = j;
        }
        for (int i = 1; i <= a.length(); i++) {
            curr[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                curr[j] = Math.min(Math.min(prev[j] + 1, curr[j - 1] + 1), prev[j - 1] + cost);
            }
            int[] tmp = prev;
            prev = curr;
            curr = tmp;
        }
        return prev[b.length()];
    }
}
