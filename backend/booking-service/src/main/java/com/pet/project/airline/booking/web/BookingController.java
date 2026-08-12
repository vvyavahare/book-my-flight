package com.pet.project.airline.booking.web;

import com.pet.project.airline.booking.dto.BookingDto;
import com.pet.project.airline.booking.dto.CreateBookingRequest;
import com.pet.project.airline.booking.service.BookingService;
import com.pet.project.airline.booking.service.BookingStreamBroadcaster;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService service;
    private final BookingStreamBroadcaster broadcaster;

    public BookingController(BookingService service, BookingStreamBroadcaster broadcaster) {
        this.service = service;
        this.broadcaster = broadcaster;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingDto create(@Valid @RequestBody CreateBookingRequest request,
                             @RequestHeader(value = "X-Auth-User", required = false) String user) {
        return service.createBooking(request, user);
    }

    /** List every booking. Admin-only (enforced at the gateway). */
    @GetMapping
    public List<BookingDto> list() {
        return service.listAll();
    }

    /** Live stream of created bookings (SSE). Admin-only (enforced at the gateway). */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return broadcaster.subscribe();
    }

    @GetMapping("/{id}")
    public BookingDto getById(@PathVariable String id) {
        return service.getById(id);
    }
}
