package com.pet.project.airline.booking.web;

import com.pet.project.airline.booking.dto.BlockSeatRequest;
import com.pet.project.airline.booking.dto.SeatMapDto;
import com.pet.project.airline.booking.service.CatalogService;
import com.pet.project.airline.booking.service.SeatMapService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Seat map API. Travellers read the cabin layout for a flight; admins manage seat
 * availability by blocking / unblocking individual seats (enforced at the gateway).
 */
@RestController
@RequestMapping("/api/seatmaps")
public class SeatMapController {

    private final SeatMapService seatMapService;
    private final CatalogService catalogService;

    public SeatMapController(SeatMapService seatMapService, CatalogService catalogService) {
        this.seatMapService = seatMapService;
        this.catalogService = catalogService;
    }

    @GetMapping("/{flightId}")
    public SeatMapDto seatMap(@PathVariable String flightId) {
        return seatMapService.seatMap(flightId);
    }

    @GetMapping("/{flightId}/blocks")
    public List<String> blocks(@PathVariable String flightId) {
        return catalogService.blockedSeats(flightId);
    }

    @PostMapping("/{flightId}/blocks")
    public List<String> block(@PathVariable String flightId, @Valid @RequestBody BlockSeatRequest request) {
        return catalogService.blockSeat(flightId, request.seatNumber());
    }

    @DeleteMapping("/{flightId}/blocks/{seatNumber}")
    public List<String> unblock(@PathVariable String flightId, @PathVariable String seatNumber) {
        return catalogService.unblockSeat(flightId, seatNumber);
    }
}
