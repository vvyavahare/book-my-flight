package com.pet.project.airline.booking.service;

import com.pet.project.airline.booking.domain.Amenity;
import com.pet.project.airline.booking.domain.BlockedSeat;
import com.pet.project.airline.booking.domain.MealOption;
import com.pet.project.airline.booking.dto.AmenityDto;
import com.pet.project.airline.booking.dto.AmenityRequest;
import com.pet.project.airline.booking.dto.MealOptionDto;
import com.pet.project.airline.booking.dto.MealOptionRequest;
import com.pet.project.airline.booking.repository.AmenityRepository;
import com.pet.project.airline.booking.repository.BlockedSeatRepository;
import com.pet.project.airline.booking.repository.MealOptionRepository;
import com.pet.project.airline.common.web.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Manages the ancillary catalog: meal options, amenities and per-flight seat blocks.
 * Read methods serve travellers; the create/update/delete methods are admin actions.
 */
@Service
public class CatalogService {

    private final MealOptionRepository mealRepository;
    private final AmenityRepository amenityRepository;
    private final BlockedSeatRepository blockedSeatRepository;
    private final SeatMapService seatMapService;

    public CatalogService(MealOptionRepository mealRepository, AmenityRepository amenityRepository,
                          BlockedSeatRepository blockedSeatRepository, SeatMapService seatMapService) {
        this.mealRepository = mealRepository;
        this.amenityRepository = amenityRepository;
        this.blockedSeatRepository = blockedSeatRepository;
        this.seatMapService = seatMapService;
    }

    // ── Meals ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<MealOptionDto> listMeals(boolean includeUnavailable) {
        List<MealOption> meals = includeUnavailable
                ? mealRepository.findAllByOrderByPriceAsc()
                : mealRepository.findByAvailableTrueOrderByPriceAsc();
        return meals.stream().map(this::toDto).toList();
    }

    @Transactional
    public MealOptionDto createMeal(MealOptionRequest request) {
        String id = "meal-" + UUID.randomUUID().toString().substring(0, 8);
        MealOption meal = new MealOption(id, request.name().trim(), request.description().trim(),
                request.dietary(), request.price(), request.imageUrl().trim(), request.available());
        return toDto(mealRepository.save(meal));
    }

    @Transactional
    public MealOptionDto updateMeal(String id, MealOptionRequest request) {
        MealOption meal = mealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meal not found: " + id));
        meal.update(request.name().trim(), request.description().trim(), request.dietary(),
                request.price(), request.imageUrl().trim(), request.available());
        return toDto(mealRepository.save(meal));
    }

    @Transactional
    public void deleteMeal(String id) {
        if (!mealRepository.existsById(id)) {
            throw new ResourceNotFoundException("Meal not found: " + id);
        }
        mealRepository.deleteById(id);
    }

    // ── Amenities ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AmenityDto> listAmenities(boolean includeUnavailable) {
        List<Amenity> amenities = includeUnavailable
                ? amenityRepository.findAllByOrderByPriceAsc()
                : amenityRepository.findByAvailableTrueOrderByPriceAsc();
        return amenities.stream().map(this::toDto).toList();
    }

    @Transactional
    public AmenityDto createAmenity(AmenityRequest request) {
        String id = "amenity-" + UUID.randomUUID().toString().substring(0, 8);
        Amenity amenity = new Amenity(id, request.name().trim(), request.description().trim(),
                request.price(), request.available());
        return toDto(amenityRepository.save(amenity));
    }

    @Transactional
    public AmenityDto updateAmenity(String id, AmenityRequest request) {
        Amenity amenity = amenityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Amenity not found: " + id));
        amenity.update(request.name().trim(), request.description().trim(),
                request.price(), request.available());
        return toDto(amenityRepository.save(amenity));
    }

    @Transactional
    public void deleteAmenity(String id) {
        if (!amenityRepository.existsById(id)) {
            throw new ResourceNotFoundException("Amenity not found: " + id);
        }
        amenityRepository.deleteById(id);
    }

    // ── Seat blocks (admin seat availability) ──────────────────────────────────

    @Transactional(readOnly = true)
    public List<String> blockedSeats(String flightId) {
        return blockedSeatRepository.findByFlightId(flightId).stream()
                .map(BlockedSeat::getSeatNumber)
                .sorted()
                .toList();
    }

    @Transactional
    public List<String> blockSeat(String flightId, String seatNumber) {
        String normalized = seatMapService.requireSeat(seatNumber).seatNumber();
        blockedSeatRepository.save(new BlockedSeat(flightId, normalized));
        return blockedSeats(flightId);
    }

    @Transactional
    public List<String> unblockSeat(String flightId, String seatNumber) {
        String normalized = seatNumber.trim().toUpperCase(Locale.ROOT);
        blockedSeatRepository.deleteById(flightId + ":" + normalized);
        return blockedSeats(flightId);
    }

    // ── Mapping ────────────────────────────────────────────────────────────────

    private MealOptionDto toDto(MealOption m) {
        return new MealOptionDto(m.getId(), m.getName(), m.getDescription(), m.getDietary(),
                m.getPrice(), m.getImageUrl(), m.isAvailable());
    }

    private AmenityDto toDto(Amenity a) {
        return new AmenityDto(a.getId(), a.getName(), a.getDescription(), a.getPrice(), a.isAvailable());
    }
}
