package com.pet.project.airline.booking.service;

import com.pet.project.airline.booking.client.FlightClient;
import com.pet.project.airline.booking.client.FlightSummary;
import com.pet.project.airline.booking.domain.Booking;
import com.pet.project.airline.booking.domain.Passenger;
import com.pet.project.airline.booking.event.BookingCreatedEvent;
import com.pet.project.airline.booking.event.BookingEventPublisher;
import com.pet.project.airline.booking.repository.BookingRepository;
import com.pet.project.airline.booking.dto.BookingDto;
import com.pet.project.airline.booking.dto.CreateBookingRequest;
import com.pet.project.airline.common.web.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    private final BookingRepository repository;
    private final FlightClient flightClient;
    private final BookingEventPublisher eventPublisher;
    private final BookingStreamBroadcaster broadcaster;

    public BookingService(BookingRepository repository, FlightClient flightClient,
                          BookingEventPublisher eventPublisher, BookingStreamBroadcaster broadcaster) {
        this.repository = repository;
        this.flightClient = flightClient;
        this.eventPublisher = eventPublisher;
        this.broadcaster = broadcaster;
    }

    @Transactional
    public BookingDto createBooking(CreateBookingRequest request, String bookedBy) {
        FlightSummary flight = flightClient.findFlight(request.flightId())
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found: " + request.flightId()));

        List<Passenger> passengers = request.passengers().stream()
                .map(p -> new Passenger(p.firstName(), p.lastName(), p.passportNumber()))
                .toList();

        if (flight.seatsAvailable() < passengers.size()) {
            throw new IllegalArgumentException("Not enough seats available on flight " + flight.flightNumber());
        }

        BigDecimal totalPrice = flight.price().multiply(BigDecimal.valueOf(passengers.size()));

        Booking booking = new Booking(
                UUID.randomUUID().toString(),
                generateReference(),
                flight.id(),
                flight.flightNumber(),
                flight.origin(),
                flight.destination(),
                flight.departureTime(),
                request.contactEmail(),
                bookedBy != null && !bookedBy.isBlank() ? bookedBy : "unknown",
                passengers,
                totalPrice,
                flight.currency());

        Booking saved = repository.save(booking);

        eventPublisher.publish(new BookingCreatedEvent(
                saved.getId(),
                saved.getReference(),
                saved.getFlightId(),
                saved.getContactEmail(),
                saved.getTotalPrice(),
                saved.getCurrency(),
                Instant.now()));

        BookingDto dto = toDto(saved);
        broadcaster.broadcast(dto);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<BookingDto> listAll() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public BookingDto getById(String id) {
        Booking booking = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + id));
        return toDto(booking);
    }

    private String generateReference() {
        return UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    private BookingDto toDto(Booking b) {
        List<BookingDto.PassengerDto> passengers = b.getPassengers().stream()
                .map(p -> new BookingDto.PassengerDto(p.getFirstName(), p.getLastName(), p.getPassportNumber()))
                .toList();
        return new BookingDto(
                b.getId(),
                b.getReference(),
                b.getFlightId(),
                b.getFlightNumber(),
                b.getOrigin(),
                b.getDestination(),
                b.getDepartureTime(),
                b.getContactEmail(),
                b.getBookedBy(),
                passengers,
                b.getTotalPrice(),
                b.getCurrency(),
                b.getStatus().name(),
                b.getCreatedAt());
    }
}
