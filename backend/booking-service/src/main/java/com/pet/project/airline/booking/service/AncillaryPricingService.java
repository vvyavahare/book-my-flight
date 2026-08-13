package com.pet.project.airline.booking.service;

import com.pet.project.airline.booking.client.FlightSummary;
import com.pet.project.airline.booking.domain.Amenity;
import com.pet.project.airline.booking.domain.AncillaryConfig;
import com.pet.project.airline.booking.domain.BookingAmenity;
import com.pet.project.airline.booking.domain.MealOption;
import com.pet.project.airline.booking.domain.Passenger;
import com.pet.project.airline.booking.domain.SeatClass;
import com.pet.project.airline.booking.dto.CreateBookingRequest;
import com.pet.project.airline.booking.repository.AmenityRepository;
import com.pet.project.airline.booking.repository.MealOptionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Validates a booking's ancillary selections (seats, meals, baggage, amenities) against the
 * live seat map, catalog and fee policy, and computes the itemised price breakdown. Fees are
 * always derived server-side — the client never dictates a price.
 */
@Service
public class AncillaryPricingService {

    private final SeatMapService seatMapService;
    private final AncillaryConfigService configService;
    private final MealOptionRepository mealRepository;
    private final AmenityRepository amenityRepository;

    public AncillaryPricingService(SeatMapService seatMapService, AncillaryConfigService configService,
                                   MealOptionRepository mealRepository, AmenityRepository amenityRepository) {
        this.seatMapService = seatMapService;
        this.configService = configService;
        this.mealRepository = mealRepository;
        this.amenityRepository = amenityRepository;
    }

    /** The fully-priced result of validating a booking request. */
    public record PricedBooking(
            List<Passenger> passengers,
            List<BookingAmenity> amenities,
            BigDecimal baseFare,
            BigDecimal seatFeesTotal,
            BigDecimal baggageFeesTotal,
            BigDecimal mealFeesTotal,
            BigDecimal amenityFeesTotal,
            BigDecimal totalPrice) {
    }

    public PricedBooking price(CreateBookingRequest request, FlightSummary flight) {
        AncillaryConfig config = configService.current();
        Set<String> unavailable = seatMapService.unavailableSeats(flight.id());
        Set<String> seatsInThisBooking = new LinkedHashSet<>();

        List<Passenger> passengers = new ArrayList<>();
        BigDecimal seatFeesTotal = BigDecimal.ZERO;
        BigDecimal baggageFeesTotal = BigDecimal.ZERO;
        BigDecimal mealFeesTotal = BigDecimal.ZERO;

        int index = 0;
        for (CreateBookingRequest.PassengerRequest p : request.passengers()) {
            index++;

            // ── Seat ─────────────────────────────────────────────────────────
            boolean needsAccessibility = Boolean.TRUE.equals(p.needsAccessibility());
            String seatNumber = null;
            SeatClass seatClass = p.seatClass();
            BigDecimal seatFee = BigDecimal.ZERO;
            if (p.seatNumber() != null && !p.seatNumber().isBlank()) {
                SeatMapService.SeatDefinition seat = seatMapService.requireSeat(p.seatNumber());
                seatNumber = seat.seatNumber();
                if (unavailable.contains(seatNumber) || !seatsInThisBooking.add(seatNumber)) {
                    throw new IllegalArgumentException("Seat " + seatNumber + " is no longer available.");
                }
                if (seat.accessible() && !needsAccessibility) {
                    throw new IllegalArgumentException(
                            "Seat " + seatNumber + " is an accessible seat reserved for passengers "
                                    + "with reduced mobility.");
                }
                seatClass = seat.seatClass();
                seatFee = seat.fee();
            }
            SeatClass baggageClass = seatClass != null ? seatClass : SeatClass.ECONOMY;

            // ── Baggage ──────────────────────────────────────────────────────
            int checkedBags = p.checkedBags() == null ? 0 : p.checkedBags();
            int weight = p.baggageWeightKg() == null ? 0 : p.baggageWeightKg();
            if (checkedBags < 0 || checkedBags > config.getMaxCheckedBags()) {
                throw new IllegalArgumentException(
                        "Passenger " + index + ": up to " + config.getMaxCheckedBags()
                                + " checked bags are allowed.");
            }
            if (checkedBags == 0) {
                weight = 0;
            } else if (weight <= 0 || weight > config.getMaxCheckedWeightKg()) {
                throw new IllegalArgumentException(
                        "Passenger " + index + ": total checked baggage weight must be between 1 and "
                                + config.getMaxCheckedWeightKg() + " kg.");
            }
            BigDecimal baggageFee = BigDecimal.ZERO;
            for (int bag = 1; bag <= checkedBags; bag++) {
                baggageFee = baggageFee.add(config.baggageFeeFor(baggageClass, bag));
            }

            // ── Meal ─────────────────────────────────────────────────────────
            String mealId = null;
            String mealName = null;
            BigDecimal mealPrice = BigDecimal.ZERO;
            if (p.mealId() != null && !p.mealId().isBlank()) {
                MealOption meal = mealRepository.findById(p.mealId())
                        .filter(MealOption::isAvailable)
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Selected meal is not available: " + p.mealId()));
                mealId = meal.getId();
                mealName = meal.getName();
                mealPrice = meal.getPrice();
            }

            passengers.add(new Passenger(
                    p.firstName().trim(), p.lastName().trim(), p.passportNumber(),
                    needsAccessibility, seatNumber, seatClass, seatFee,
                    mealId, mealName, mealPrice, checkedBags, weight, baggageFee));

            seatFeesTotal = seatFeesTotal.add(seatFee);
            baggageFeesTotal = baggageFeesTotal.add(baggageFee);
            mealFeesTotal = mealFeesTotal.add(mealPrice);
        }

        // ── Amenities (booking level) ────────────────────────────────────────
        List<BookingAmenity> amenities = new ArrayList<>();
        BigDecimal amenityFeesTotal = BigDecimal.ZERO;
        if (request.amenityIds() != null) {
            Set<String> ids = new LinkedHashSet<>(request.amenityIds());
            for (String amenityId : ids) {
                if (amenityId == null || amenityId.isBlank()) {
                    continue;
                }
                Amenity amenity = amenityRepository.findById(amenityId)
                        .filter(Amenity::isAvailable)
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Selected amenity is not available: " + amenityId));
                amenities.add(new BookingAmenity(amenity.getId(), amenity.getName(), amenity.getPrice()));
                amenityFeesTotal = amenityFeesTotal.add(amenity.getPrice());
            }
        }

        BigDecimal baseFare = flight.price().multiply(BigDecimal.valueOf(request.passengers().size()));
        BigDecimal totalPrice = baseFare
                .add(seatFeesTotal)
                .add(baggageFeesTotal)
                .add(mealFeesTotal)
                .add(amenityFeesTotal);

        return new PricedBooking(passengers, amenities, baseFare, seatFeesTotal,
                baggageFeesTotal, mealFeesTotal, amenityFeesTotal, totalPrice);
    }
}
