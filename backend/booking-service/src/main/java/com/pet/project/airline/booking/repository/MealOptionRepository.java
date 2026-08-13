package com.pet.project.airline.booking.repository;

import com.pet.project.airline.booking.domain.MealOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MealOptionRepository extends JpaRepository<MealOption, String> {
    List<MealOption> findByAvailableTrueOrderByPriceAsc();

    List<MealOption> findAllByOrderByPriceAsc();
}
