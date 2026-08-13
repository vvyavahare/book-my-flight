package com.pet.project.airline.booking.web;

import com.pet.project.airline.booking.dto.BookingDto;
import com.pet.project.airline.booking.dto.CreateBookingRequest;
import com.pet.project.airline.booking.dto.ModifyBookingRequest;
import com.pet.project.airline.booking.dto.PaymentRequest;
import com.pet.project.airline.booking.service.BookingService;
import com.pet.project.airline.booking.service.BookingStreamBroadcaster;
import com.pet.project.airline.booking.service.RefundPolicy;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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

    /** List the authenticated user's own bookings. */
    @GetMapping("/mine")
    public List<BookingDto> mine(@RequestHeader(value = "X-Auth-User", required = false) String user) {
        return service.listMine(user);
    }

    /** Live stream of created/updated bookings (SSE). Admin-only (enforced at the gateway). */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return broadcaster.subscribe();
    }

    /** Take (mock) payment to confirm a booking. Owner-only. */
    @PostMapping("/{id}/payment")
    public BookingDto pay(@PathVariable String id,
                          @Valid @RequestBody PaymentRequest request,
                          @RequestHeader(value = "X-Auth-User", required = false) String user) {
        return service.pay(id, user);
    }

    /** Preview the refund for cancelling a booking now. Owner-only. */
    @GetMapping("/{id}/refund-quote")
    public RefundPolicy.RefundQuote refundQuote(@PathVariable String id,
                                                @RequestHeader(value = "X-Auth-User", required = false) String user) {
        return service.refundQuote(id, user);
    }

    /** Modify passenger details / contact email (typo corrections only). Owner-only. */
    @PutMapping("/{id}")
    public BookingDto modify(@PathVariable String id,
                             @Valid @RequestBody ModifyBookingRequest request,
                             @RequestHeader(value = "X-Auth-User", required = false) String user) {
        return service.modify(id, user, request);
    }

    /** Cancel a booking and compute the refund. Owner-only. */
    @PostMapping("/{id}/cancel")
    public BookingDto cancel(@PathVariable String id,
                             @RequestHeader(value = "X-Auth-User", required = false) String user) {
        return service.cancel(id, user);
    }

    @GetMapping("/{id}")
    public BookingDto getById(@PathVariable String id) {
        return service.getById(id);
    }
}
