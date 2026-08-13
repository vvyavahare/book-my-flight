package com.pet.project.airline.booking.repository;

import com.pet.project.airline.booking.domain.Amenity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AmenityRepository extends JpaRepository<Amenity, String> {
    List<Amenity> findByAvailableTrueOrderByPriceAsc();

    List<Amenity> findAllByOrderByPriceAsc();
}
