package com.pet.project.airline.flightsearch.service;

import com.pet.project.airline.flightsearch.dto.AirportDto;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Static catalog of major world airports used to populate searchable origin/destination
 * dropdowns. Kept in-memory (no external data source) so the service runs with zero infra.
 */
@Component
public class AirportCatalog {

    private static final List<AirportDto> AIRPORTS = List.of(
            new AirportDto("AMS", "Amsterdam Schiphol", "Amsterdam", "Netherlands"),
            new AirportDto("LHR", "London Heathrow", "London", "United Kingdom"),
            new AirportDto("LGW", "London Gatwick", "London", "United Kingdom"),
            new AirportDto("CDG", "Paris Charles de Gaulle", "Paris", "France"),
            new AirportDto("ORY", "Paris Orly", "Paris", "France"),
            new AirportDto("FRA", "Frankfurt am Main", "Frankfurt", "Germany"),
            new AirportDto("MUC", "Munich", "Munich", "Germany"),
            new AirportDto("BER", "Berlin Brandenburg", "Berlin", "Germany"),
            new AirportDto("MAD", "Adolfo Suárez Madrid–Barajas", "Madrid", "Spain"),
            new AirportDto("BCN", "Barcelona El Prat", "Barcelona", "Spain"),
            new AirportDto("FCO", "Rome Fiumicino", "Rome", "Italy"),
            new AirportDto("MXP", "Milan Malpensa", "Milan", "Italy"),
            new AirportDto("ZRH", "Zurich", "Zurich", "Switzerland"),
            new AirportDto("VIE", "Vienna International", "Vienna", "Austria"),
            new AirportDto("BRU", "Brussels", "Brussels", "Belgium"),
            new AirportDto("CPH", "Copenhagen Kastrup", "Copenhagen", "Denmark"),
            new AirportDto("ARN", "Stockholm Arlanda", "Stockholm", "Sweden"),
            new AirportDto("OSL", "Oslo Gardermoen", "Oslo", "Norway"),
            new AirportDto("HEL", "Helsinki Vantaa", "Helsinki", "Finland"),
            new AirportDto("DUB", "Dublin", "Dublin", "Ireland"),
            new AirportDto("LIS", "Lisbon Humberto Delgado", "Lisbon", "Portugal"),
            new AirportDto("ATH", "Athens International", "Athens", "Greece"),
            new AirportDto("IST", "Istanbul", "Istanbul", "Turkey"),
            new AirportDto("SVO", "Moscow Sheremetyevo", "Moscow", "Russia"),
            new AirportDto("WAW", "Warsaw Chopin", "Warsaw", "Poland"),
            new AirportDto("PRG", "Václav Havel Prague", "Prague", "Czechia"),
            new AirportDto("JFK", "New York John F. Kennedy", "New York", "United States"),
            new AirportDto("EWR", "Newark Liberty", "Newark", "United States"),
            new AirportDto("LAX", "Los Angeles International", "Los Angeles", "United States"),
            new AirportDto("SFO", "San Francisco International", "San Francisco", "United States"),
            new AirportDto("ORD", "Chicago O'Hare", "Chicago", "United States"),
            new AirportDto("ATL", "Hartsfield–Jackson Atlanta", "Atlanta", "United States"),
            new AirportDto("MIA", "Miami International", "Miami", "United States"),
            new AirportDto("BOS", "Boston Logan", "Boston", "United States"),
            new AirportDto("SEA", "Seattle–Tacoma", "Seattle", "United States"),
            new AirportDto("IAD", "Washington Dulles", "Washington", "United States"),
            new AirportDto("YYZ", "Toronto Pearson", "Toronto", "Canada"),
            new AirportDto("YVR", "Vancouver International", "Vancouver", "Canada"),
            new AirportDto("MEX", "Mexico City International", "Mexico City", "Mexico"),
            new AirportDto("GRU", "São Paulo Guarulhos", "São Paulo", "Brazil"),
            new AirportDto("GIG", "Rio de Janeiro Galeão", "Rio de Janeiro", "Brazil"),
            new AirportDto("EZE", "Buenos Aires Ezeiza", "Buenos Aires", "Argentina"),
            new AirportDto("SCL", "Santiago International", "Santiago", "Chile"),
            new AirportDto("BOG", "Bogotá El Dorado", "Bogotá", "Colombia"),
            new AirportDto("LIM", "Lima Jorge Chávez", "Lima", "Peru"),
            new AirportDto("DXB", "Dubai International", "Dubai", "United Arab Emirates"),
            new AirportDto("AUH", "Abu Dhabi International", "Abu Dhabi", "United Arab Emirates"),
            new AirportDto("DOH", "Hamad International", "Doha", "Qatar"),
            new AirportDto("RUH", "Riyadh King Khalid", "Riyadh", "Saudi Arabia"),
            new AirportDto("TLV", "Tel Aviv Ben Gurion", "Tel Aviv", "Israel"),
            new AirportDto("CAI", "Cairo International", "Cairo", "Egypt"),
            new AirportDto("JNB", "Johannesburg O. R. Tambo", "Johannesburg", "South Africa"),
            new AirportDto("CPT", "Cape Town International", "Cape Town", "South Africa"),
            new AirportDto("NBO", "Nairobi Jomo Kenyatta", "Nairobi", "Kenya"),
            new AirportDto("LOS", "Lagos Murtala Muhammed", "Lagos", "Nigeria"),
            new AirportDto("DEL", "Indira Gandhi Delhi", "Delhi", "India"),
            new AirportDto("BOM", "Chhatrapati Shivaji Mumbai", "Mumbai", "India"),
            new AirportDto("BLR", "Kempegowda Bengaluru", "Bengaluru", "India"),
            new AirportDto("HYD", "Rajiv Gandhi Hyderabad", "Hyderabad", "India"),
            new AirportDto("MAA", "Chennai International", "Chennai", "India"),
            new AirportDto("SIN", "Singapore Changi", "Singapore", "Singapore"),
            new AirportDto("BKK", "Bangkok Suvarnabhumi", "Bangkok", "Thailand"),
            new AirportDto("KUL", "Kuala Lumpur International", "Kuala Lumpur", "Malaysia"),
            new AirportDto("CGK", "Jakarta Soekarno–Hatta", "Jakarta", "Indonesia"),
            new AirportDto("HKG", "Hong Kong International", "Hong Kong", "Hong Kong"),
            new AirportDto("PVG", "Shanghai Pudong", "Shanghai", "China"),
            new AirportDto("PEK", "Beijing Capital", "Beijing", "China"),
            new AirportDto("CAN", "Guangzhou Baiyun", "Guangzhou", "China"),
            new AirportDto("NRT", "Tokyo Narita", "Tokyo", "Japan"),
            new AirportDto("HND", "Tokyo Haneda", "Tokyo", "Japan"),
            new AirportDto("ICN", "Seoul Incheon", "Seoul", "South Korea"),
            new AirportDto("SYD", "Sydney Kingsford Smith", "Sydney", "Australia"),
            new AirportDto("MEL", "Melbourne Tullamarine", "Melbourne", "Australia"),
            new AirportDto("BNE", "Brisbane International", "Brisbane", "Australia"),
            new AirportDto("AKL", "Auckland International", "Auckland", "New Zealand")
    );

    private static final Map<String, AirportDto> BY_CODE = AIRPORTS.stream()
            .collect(Collectors.toMap(AirportDto::code, Function.identity()));

    /** All airports in the catalog, ordered by IATA code. */
    public List<AirportDto> findAll() {
        return AIRPORTS.stream()
                .sorted((a, b) -> a.code().compareTo(b.code()))
                .toList();
    }

    /** Look up a single airport by IATA code (case-insensitive). */
    public Optional<AirportDto> findByCode(String code) {
        if (code == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(BY_CODE.get(code.trim().toUpperCase()));
    }
}
