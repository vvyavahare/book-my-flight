package com.pet.project.airline.flightsearch.web;

import com.pet.project.airline.common.dto.PageResponse;
import com.pet.project.airline.flightsearch.dto.AirportDto;
import com.pet.project.airline.flightsearch.dto.CreateFlightRequest;
import com.pet.project.airline.flightsearch.dto.FlightDto;
import com.pet.project.airline.flightsearch.dto.UpdateFlightRequest;
import com.pet.project.airline.flightsearch.service.FlightQueryService;
import com.pet.project.airline.flightsearch.service.FlightSearchService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/flights")
public class FlightController {

    private final FlightSearchService service;
    private final FlightQueryService queryService;

    public FlightController(FlightSearchService service, FlightQueryService queryService) {
        this.service = service;
        this.queryService = queryService;
    }

    /** Search flights by route and (optional) departure date. */
    @GetMapping
    public List<FlightDto> search(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return service.search(origin, destination, date);
    }

    /** Global airport catalog for searchable origin/destination dropdowns. */
    @GetMapping("/airports")
    public List<AirportDto> airports() {
        return service.listAirports();
    }

    /** Paginated, searchable admin listing across all columns. Admin-only (gateway-enforced). */
    @GetMapping("/admin")
    public PageResponse<FlightDto> adminList(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "departureTime,asc") String sort,
            @RequestParam(defaultValue = "true") boolean includeInactive) {
        return queryService.adminSearch(q, page, size, sort, includeInactive);
    }

    /** Create a new flight in the catalog. Admin-only (enforced at the gateway). */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FlightDto create(@Valid @RequestBody CreateFlightRequest request) {
        return service.create(request);
    }

    /** Update an existing flight. Admin-only (enforced at the gateway). */
    @PutMapping("/{id}")
    public FlightDto update(@PathVariable String id, @Valid @RequestBody UpdateFlightRequest request) {
        return service.update(id, request);
    }

    /** Soft-delete a flight. Admin-only (enforced at the gateway). */
    @DeleteMapping("/{id}")
    public FlightDto delete(@PathVariable String id) {
        return service.softDelete(id);
    }

    @GetMapping("/{id}")
    public FlightDto getById(@PathVariable String id) {
        return service.getById(id);
    }
}
