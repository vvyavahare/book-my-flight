package com.pet.project.airline.booking.event;

/*
 * ============================================================================
 * PLACEHOLDER: Kafka-backed booking event publisher (enable in a later phase)
 * ============================================================================
 *
 * When the notification service is introduced, wire booking events through Kafka:
 *
 *   1. Uncomment the spring-kafka dependency in booking-service/pom.xml.
 *   2. Enable the 'kafka' section in application.yaml and run a Kafka broker
 *      (see infra/docker-compose.yml).
 *   3. Uncomment and finish the implementation below. Naming the bean
 *      "kafkaBookingEventPublisher" makes LoggingBookingEventPublisher back off
 *      automatically (see its @ConditionalOnMissingBean).
 *
 * import org.springframework.context.annotation.Profile;
 * import org.springframework.kafka.core.KafkaTemplate;
 * import org.springframework.stereotype.Component;
 *
 * @Profile("kafka")
 * @Component("kafkaBookingEventPublisher")
 * public class KafkaBookingEventPublisher implements BookingEventPublisher {
 *
 *     private static final String TOPIC = "booking-events";
 *     private final KafkaTemplate<String, BookingCreatedEvent> kafkaTemplate;
 *
 *     public KafkaBookingEventPublisher(KafkaTemplate<String, BookingCreatedEvent> kafkaTemplate) {
 *         this.kafkaTemplate = kafkaTemplate;
 *     }
 *
 *     @Override
 *     public void publish(BookingCreatedEvent event) {
 *         kafkaTemplate.send(TOPIC, event.reference(), event);
 *     }
 * }
 */
