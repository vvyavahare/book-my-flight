package com.pet.project.airline.booking.web;

import com.pet.project.airline.booking.dto.AmenityDto;
import com.pet.project.airline.booking.dto.AmenityRequest;
import com.pet.project.airline.booking.dto.AncillaryConfigDto;
import com.pet.project.airline.booking.dto.AncillaryConfigRequest;
import com.pet.project.airline.booking.dto.MealOptionDto;
import com.pet.project.airline.booking.dto.MealOptionRequest;
import com.pet.project.airline.booking.service.AncillaryConfigService;
import com.pet.project.airline.booking.service.CatalogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Ancillary catalog API: meal options, amenities and the seat/baggage fee policy.
 * Read endpoints are open to authenticated travellers; create/update/delete and the fee
 * policy update are admin-only (enforced at the gateway).
 */
@RestController
@RequestMapping("/api/catalog")
public class CatalogController {

    private final CatalogService catalogService;
    private final AncillaryConfigService configService;

    public CatalogController(CatalogService catalogService, AncillaryConfigService configService) {
        this.catalogService = catalogService;
        this.configService = configService;
    }

    // ── Meals ────────────────────────────────────────────────────────────────

    @GetMapping("/meals")
    public List<MealOptionDto> meals(@RequestParam(defaultValue = "false") boolean includeUnavailable) {
        return catalogService.listMeals(includeUnavailable);
    }

    @PostMapping("/meals")
    @ResponseStatus(HttpStatus.CREATED)
    public MealOptionDto createMeal(@Valid @RequestBody MealOptionRequest request) {
        return catalogService.createMeal(request);
    }

    @PutMapping("/meals/{id}")
    public MealOptionDto updateMeal(@PathVariable String id, @Valid @RequestBody MealOptionRequest request) {
        return catalogService.updateMeal(id, request);
    }

    @DeleteMapping("/meals/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMeal(@PathVariable String id) {
        catalogService.deleteMeal(id);
    }

    // ── Amenities ──────────────────────────────────────────────────────────────

    @GetMapping("/amenities")
    public List<AmenityDto> amenities(@RequestParam(defaultValue = "false") boolean includeUnavailable) {
        return catalogService.listAmenities(includeUnavailable);
    }

    @PostMapping("/amenities")
    @ResponseStatus(HttpStatus.CREATED)
    public AmenityDto createAmenity(@Valid @RequestBody AmenityRequest request) {
        return catalogService.createAmenity(request);
    }

    @PutMapping("/amenities/{id}")
    public AmenityDto updateAmenity(@PathVariable String id, @Valid @RequestBody AmenityRequest request) {
        return catalogService.updateAmenity(id, request);
    }

    @DeleteMapping("/amenities/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAmenity(@PathVariable String id) {
        catalogService.deleteAmenity(id);
    }

    // ── Fee policy ─────────────────────────────────────────────────────────────

    @GetMapping("/config")
    public AncillaryConfigDto config() {
        return configService.currentDto();
    }

    @PutMapping("/config")
    public AncillaryConfigDto updateConfig(@Valid @RequestBody AncillaryConfigRequest request) {
        return configService.update(request);
    }
}
