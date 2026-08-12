package com.pet.project.airline.booking.event;

/**
 * Publishes booking domain events. The default implementation simply logs; a Kafka-backed
 * implementation is a placeholder for when the notification service is introduced.
 *
 * @see LoggingBookingEventPublisher
 */
public interface BookingEventPublisher {
    void publish(BookingCreatedEvent event);
}
