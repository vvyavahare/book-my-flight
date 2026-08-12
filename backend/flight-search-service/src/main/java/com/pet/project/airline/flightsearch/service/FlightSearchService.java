package com.pet.project.airline.flightsearch.service;

import com.pet.project.airline.common.web.ResourceNotFoundException;
import com.pet.project.airline.flightsearch.domain.Flight;
import com.pet.project.airline.flightsearch.repository.FlightRepository;
import com.pet.project.airline.flightsearch.dto.AirportDto;
import com.pet.project.airline.flightsearch.dto.CreateFlightRequest;
import com.pet.project.airline.flightsearch.dto.FlightDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class FlightSearchService {

    private final FlightRepository repository;
    private final AirportCatalog airportCatalog;

    public FlightSearchService(FlightRepository repository, AirportCatalog airportCatalog) {
        this.repository = repository;
        this.airportCatalog = airportCatalog;
    }

    public List<FlightDto> search(String origin, String destination, LocalDate date) {
        if (origin == null || origin.isBlank() || destination == null || destination.isBlank()) {
            throw new IllegalArgumentException("origin and destination are required");
        }
        LocalDate day = date != null ? date : LocalDate.now();
        return repository.search(origin, destination, day.atStartOfDay(), day.plusDays(1).atStartOfDay())
                .stream()
                .map(this::toDto)
                .toList();
    }

    public FlightDto getById(String id) {
        Flight flight = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found: " + id));
        return toDto(flight);
    }

    /** Global airport catalog powering the searchable origin/destination dropdowns. */
    public List<AirportDto> listAirports() {
        return airportCatalog.findAll();
    }

    /** Create a new flight in the catalog (admin action). */
    @Transactional
    public FlightDto create(CreateFlightRequest request) {
        if (!request.arrivalTime().isAfter(request.departureTime())) {
            throw new IllegalArgumentException("arrivalTime must be after departureTime");
        }
        String origin = request.origin().trim().toUpperCase();
        String destination = request.destination().trim().toUpperCase();
        if (origin.equals(destination)) {
            throw new IllegalArgumentException("origin and destination must differ");
        }

        String flightNumber = request.flightNumber().trim().toUpperCase();
        String id = "%s-%s".formatted(flightNumber, request.departureTime().toLocalDate());
        Flight flight = new Flight(
                id,
                flightNumber,
                request.airline().trim(),
                origin,
                destination,
                request.departureTime(),
                request.arrivalTime(),
                request.price(),
                request.currency().trim().toUpperCase(),
                request.seatsAvailable());
        return toDto(repository.save(flight));
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
                f.getSeatsAvailable());
    }
}
