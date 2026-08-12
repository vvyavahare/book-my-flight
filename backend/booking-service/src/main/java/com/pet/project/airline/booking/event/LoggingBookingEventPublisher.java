package com.pet.project.airline.booking.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

/**
 * Default event publisher: logs the event. This keeps the service fully runnable with no
 * message broker. When the notification service arrives, add a Kafka-backed publisher
 * (see {@code KafkaBookingEventPublisher} placeholder) and activate it via the 'kafka'
 * profile; this logging bean backs off automatically.
 */
@Component
@ConditionalOnMissingBean(name = "kafkaBookingEventPublisher")
public class LoggingBookingEventPublisher implements BookingEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(LoggingBookingEventPublisher.class);

    @Override
    public void publish(BookingCreatedEvent event) {
        log.info("[event] BookingCreated reference={} flightId={} total={} {} (would be published to Kafka topic 'booking-events')",
                event.reference(), event.flightId(), event.totalPrice(), event.currency());
    }
}
