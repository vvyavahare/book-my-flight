package com.pet.project.airline.booking.service;

import com.pet.project.airline.booking.dto.BookingDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Fans out newly created bookings to connected clients over Server-Sent Events (SSE).
 * The admin dashboard subscribes to receive live updates the moment a booking is made.
 * Emitters are held in-memory; dead connections are pruned on send failure.
 */
@Component
public class BookingStreamBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(BookingStreamBroadcaster.class);
    private static final long TIMEOUT_MS = 30 * 60 * 1000L;

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    /** Register a new subscriber and return its emitter. */
    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));
        emitters.add(emitter);
        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            emitters.remove(emitter);
        }
        return emitter;
    }

    /** Push a created booking to every connected subscriber. */
    public void broadcast(BookingDto booking) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("booking").data(booking));
            } catch (Exception e) {
                log.debug("Removing dead SSE emitter: {}", e.getMessage());
                emitters.remove(emitter);
            }
        }
    }
}
