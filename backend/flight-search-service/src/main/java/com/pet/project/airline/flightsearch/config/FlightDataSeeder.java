package com.pet.project.airline.flightsearch.config;

import com.pet.project.airline.flightsearch.domain.Flight;
import com.pet.project.airline.flightsearch.repository.FlightRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Seeds a small in-memory flight catalog on startup so the search API returns data
 * out-of-the-box (no external database required). Generates flights for the next 7 days
 * across a handful of routes.
 */
@Configuration
public class FlightDataSeeder {

    private record Route(String origin, String destination, String airline, String flightNumber,
                         LocalTime departure, int durationMinutes, BigDecimal price) {
    }

    private static final List<Route> ROUTES = List.of(
            // European short-haul
            new Route("AMS", "LHR", "KLM", "KL1007", LocalTime.of(8, 30), 80, new BigDecimal("129.00")),
            new Route("AMS", "LHR", "British Airways", "BA431", LocalTime.of(14, 15), 80, new BigDecimal("142.50")),
            new Route("LHR", "AMS", "KLM", "KL1008", LocalTime.of(10, 0), 80, new BigDecimal("135.00")),
            new Route("AMS", "CDG", "Air France", "AF1341", LocalTime.of(7, 10), 75, new BigDecimal("98.00")),
            new Route("CDG", "AMS", "Air France", "AF1240", LocalTime.of(19, 40), 75, new BigDecimal("104.00")),
            new Route("AMS", "BCN", "Vueling", "VY8301", LocalTime.of(16, 20), 145, new BigDecimal("119.00")),
            new Route("AMS", "FRA", "Lufthansa", "LH991", LocalTime.of(9, 5), 75, new BigDecimal("112.00")),
            new Route("FRA", "AMS", "Lufthansa", "LH994", LocalTime.of(17, 45), 75, new BigDecimal("115.00")),
            new Route("LHR", "MAD", "Iberia", "IB3167", LocalTime.of(12, 30), 150, new BigDecimal("134.00")),
            new Route("CDG", "FCO", "Air France", "AF1104", LocalTime.of(6, 55), 130, new BigDecimal("122.00")),
            new Route("FRA", "IST", "Turkish Airlines", "TK1590", LocalTime.of(10, 40), 180, new BigDecimal("168.00")),
            new Route("MAD", "LIS", "TAP Air Portugal", "TP1023", LocalTime.of(15, 10), 80, new BigDecimal("89.00")),
            new Route("ZRH", "LHR", "Swiss", "LX338", LocalTime.of(7, 25), 105, new BigDecimal("158.00")),
            new Route("DUB", "AMS", "Aer Lingus", "EI604", LocalTime.of(13, 20), 100, new BigDecimal("109.00")),
            // Transatlantic
            new Route("AMS", "JFK", "Delta", "DL71", LocalTime.of(11, 45), 490, new BigDecimal("612.00")),
            new Route("JFK", "AMS", "Delta", "DL72", LocalTime.of(18, 30), 430, new BigDecimal("648.00")),
            new Route("LHR", "JFK", "British Airways", "BA179", LocalTime.of(9, 30), 465, new BigDecimal("585.00")),
            new Route("CDG", "LAX", "Air France", "AF66", LocalTime.of(10, 15), 700, new BigDecimal("742.00")),
            new Route("JFK", "LAX", "American Airlines", "AA118", LocalTime.of(7, 0), 375, new BigDecimal("321.00")),
            new Route("YYZ", "LHR", "Air Canada", "AC856", LocalTime.of(21, 15), 430, new BigDecimal("560.00")),
            // Middle East & Asia long-haul
            new Route("AMS", "DXB", "Emirates", "EK148", LocalTime.of(14, 50), 400, new BigDecimal("498.00")),
            new Route("DXB", "SIN", "Emirates", "EK354", LocalTime.of(3, 45), 445, new BigDecimal("452.00")),
            new Route("LHR", "DEL", "Air India", "AI112", LocalTime.of(13, 5), 520, new BigDecimal("531.00")),
            new Route("DEL", "BOM", "IndiGo", "6E205", LocalTime.of(6, 30), 130, new BigDecimal("74.00")),
            new Route("SIN", "SYD", "Singapore Airlines", "SQ231", LocalTime.of(20, 25), 470, new BigDecimal("389.00")),
            new Route("HKG", "NRT", "Cathay Pacific", "CX500", LocalTime.of(8, 40), 235, new BigDecimal("276.00")),
            new Route("ICN", "SFO", "Korean Air", "KE023", LocalTime.of(15, 20), 640, new BigDecimal("712.00")),
            // Southern hemisphere
            new Route("GRU", "EZE", "LATAM", "LA8014", LocalTime.of(9, 55), 165, new BigDecimal("143.00")),
            new Route("JNB", "CPT", "South African Airways", "SA317", LocalTime.of(12, 10), 120, new BigDecimal("96.00")),
            new Route("SYD", "AKL", "Qantas", "QF143", LocalTime.of(16, 35), 200, new BigDecimal("187.00"))
    );

    @Bean
    CommandLineRunner seedFlights(FlightRepository repository) {
        return args -> {
            if (repository.count() > 0) {
                return;
            }
            List<Flight> flights = new ArrayList<>();
            LocalDate today = LocalDate.now();
            for (int day = 0; day < 7; day++) {
                LocalDate date = today.plusDays(day);
                for (Route route : ROUTES) {
                    LocalDateTime departure = LocalDateTime.of(date, route.departure());
                    LocalDateTime arrival = departure.plusMinutes(route.durationMinutes());
                    String id = "%s-%s".formatted(route.flightNumber(), date);
                    flights.add(new Flight(
                            id,
                            route.flightNumber(),
                            route.airline(),
                            route.origin(),
                            route.destination(),
                            departure,
                            arrival,
                            route.price(),
                            "EUR",
                            180));
                }
            }
            repository.saveAll(flights);
        };
    }
}
