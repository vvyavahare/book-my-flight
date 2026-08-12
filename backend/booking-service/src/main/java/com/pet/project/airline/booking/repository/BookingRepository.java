package com.pet.project.airline.booking.repository;

import com.pet.project.airline.booking.domain.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, String> {
    Optional<Booking> findByReference(String reference);

    List<Booking> findAllByOrderByCreatedAtDesc();
}
