package com.pet.project.airline.booking.service;

import com.pet.project.airline.booking.client.FlightClient;
import com.pet.project.airline.booking.client.FlightSummary;
import com.pet.project.airline.booking.domain.Booking;
import com.pet.project.airline.booking.domain.BookingAmenity;
import com.pet.project.airline.booking.domain.Passenger;
import com.pet.project.airline.booking.event.BookingCreatedEvent;
import com.pet.project.airline.booking.event.BookingEventPublisher;
import com.pet.project.airline.booking.repository.BookingRepository;
import com.pet.project.airline.booking.dto.BookingDto;
import com.pet.project.airline.booking.dto.CreateBookingRequest;
import com.pet.project.airline.booking.dto.ModifyBookingRequest;
import com.pet.project.airline.common.web.ForbiddenException;
import com.pet.project.airline.common.web.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    private final BookingRepository repository;
    private final FlightClient flightClient;
    private final BookingEventPublisher eventPublisher;
    private final BookingStreamBroadcaster broadcaster;
    private final RefundPolicy refundPolicy;
    private final AncillaryPricingService pricingService;

    public BookingService(BookingRepository repository, FlightClient flightClient,
                          BookingEventPublisher eventPublisher, BookingStreamBroadcaster broadcaster,
                          RefundPolicy refundPolicy, AncillaryPricingService pricingService) {
        this.repository = repository;
        this.flightClient = flightClient;
        this.eventPublisher = eventPublisher;
        this.broadcaster = broadcaster;
        this.refundPolicy = refundPolicy;
        this.pricingService = pricingService;
    }

    @Transactional
    public BookingDto createBooking(CreateBookingRequest request, String bookedBy) {
        FlightSummary flight = flightClient.findFlight(request.flightId())
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found: " + request.flightId()));

        if (flight.seatsAvailable() < request.passengers().size()) {
            throw new IllegalArgumentException("Not enough seats available on flight " + flight.flightNumber());
        }

        AncillaryPricingService.PricedBooking priced = pricingService.price(request, flight);

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
                priced.passengers(),
                priced.amenities(),
                priced.baseFare(),
                priced.seatFeesTotal(),
                priced.baggageFeesTotal(),
                priced.mealFeesTotal(),
                priced.amenityFeesTotal(),
                priced.totalPrice(),
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

    /** Confirm a booking by taking (mock) payment. Owner-only. */
    @Transactional
    public BookingDto pay(String id, String user) {
        Booking booking = requireOwned(id, user);
        booking.markPaid("PAY-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase());
        BookingDto dto = toDto(repository.save(booking));
        broadcaster.broadcast(dto);
        return dto;
    }

    /**
     * Modify passenger details / contact email. Enforces the correction rules:
     * the passenger count is fixed, and each name may only be adjusted as a typo fix —
     * a wholesale name change (ticket transfer) is rejected. Passport edits are free.
     */
    @Transactional
    public BookingDto modify(String id, String user, ModifyBookingRequest request) {
        Booking booking = requireOwned(id, user);
        if (booking.isCancelled()) {
            throw new IllegalStateException("A cancelled booking cannot be modified");
        }

        List<Passenger> existing = booking.getPassengers();
        List<ModifyBookingRequest.PassengerRequest> incoming = request.passengers();
        if (incoming.size() != existing.size()) {
            throw new IllegalArgumentException(
                    "Passengers cannot be added or removed (ticket transfer is not allowed)");
        }

        List<Passenger> revised = new ArrayList<>();
        for (int i = 0; i < existing.size(); i++) {
            Passenger current = existing.get(i);
            ModifyBookingRequest.PassengerRequest update = incoming.get(i);
            String oldName = current.getFirstName() + " " + current.getLastName();
            String newName = update.firstName() + " " + update.lastName();
            if (!NameSimilarity.isTypoCorrection(oldName, newName)) {
                throw new IllegalArgumentException(
                        "Passenger %d: transferring a ticket or changing the passenger name is not allowed. "
                                .formatted(i + 1)
                                + "Only minor spelling corrections are permitted.");
            }
            revised.add(new Passenger(update.firstName().trim(), update.lastName().trim(),
                    update.passportNumber(), current.isNeedsAccessibility(),
                    current.getSeatNumber(), current.getSeatClass(), current.getSeatFee(),
                    current.getMealId(), current.getMealName(), current.getMealPrice(),
                    current.getCheckedBags(), current.getBaggageWeightKg(), current.getBaggageFee()));
        }

        booking.reviseDetails(revised, request.contactEmail());
        BookingDto dto = toDto(repository.save(booking));
        broadcaster.broadcast(dto);
        return dto;
    }

    /** Cancel a booking and compute the refund per the policy. Owner-only. */
    @Transactional
    public BookingDto cancel(String id, String user) {
        Booking booking = requireOwned(id, user);
        if (booking.isCancelled()) {
            throw new IllegalStateException("Booking is already cancelled");
        }
        RefundPolicy.RefundQuote quote = refundPolicy.quote(booking.getAmountPaid(), booking.getDepartureTime());
        booking.cancel(quote.amount());
        BookingDto dto = toDto(repository.save(booking));
        broadcaster.broadcast(dto);
        return dto;
    }

    /** A refund preview for a booking without cancelling it. Owner-only. */
    @Transactional(readOnly = true)
    public RefundPolicy.RefundQuote refundQuote(String id, String user) {
        Booking booking = requireOwned(id, user);
        return refundPolicy.quote(booking.getAmountPaid(), booking.getDepartureTime());
    }

    @Transactional(readOnly = true)
    public List<BookingDto> listAll() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingDto> listMine(String user) {
        if (user == null || user.isBlank()) {
            throw new ForbiddenException("Authentication required");
        }
        return repository.findByBookedByOrderByCreatedAtDesc(user).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public BookingDto getById(String id) {
        Booking booking = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + id));
        return toDto(booking);
    }

    private Booking requireOwned(String id, String user) {
        Booking booking = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + id));
        if (user == null || user.isBlank() || !user.equals(booking.getBookedBy())) {
            throw new ForbiddenException("You can only manage your own bookings");
        }
        return booking;
    }

    private String generateReference() {
        return UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    private BookingDto toDto(Booking b) {
        List<BookingDto.PassengerDto> passengers = b.getPassengers().stream()
                .map(p -> new BookingDto.PassengerDto(
                        p.getFirstName(), p.getLastName(), p.getPassportNumber(),
                        p.isNeedsAccessibility(), p.getSeatNumber(), p.getSeatClass(), p.getSeatFee(),
                        p.getMealId(), p.getMealName(), p.getMealPrice(),
                        p.getCheckedBags(), p.getBaggageWeightKg(), p.getBaggageFee()))
                .toList();
        List<BookingDto.AmenitySelectionDto> amenities = b.getAmenities().stream()
                .map(a -> new BookingDto.AmenitySelectionDto(a.getAmenityId(), a.getName(), a.getPrice()))
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
                amenities,
                b.getBaseFare(),
                b.getSeatFeesTotal(),
                b.getBaggageFeesTotal(),
                b.getMealFeesTotal(),
                b.getAmenityFeesTotal(),
                b.getTotalPrice(),
                b.getCurrency(),
                b.getStatus().name(),
                b.getAmountPaid(),
                b.getRefundAmount(),
                b.getPaymentReference(),
                b.getCreatedAt());
    }
}
