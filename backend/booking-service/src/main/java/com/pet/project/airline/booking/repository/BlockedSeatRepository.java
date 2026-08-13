package com.pet.project.airline.booking.repository;

import com.pet.project.airline.booking.domain.BlockedSeat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BlockedSeatRepository extends JpaRepository<BlockedSeat, String> {
    List<BlockedSeat> findByFlightId(String flightId);
}
