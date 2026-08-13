package com.pet.project.airline.flightsearch.repository;

import com.pet.project.airline.flightsearch.domain.Flight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface FlightRepository extends JpaRepository<Flight, String> {

    @Query("""
            select f from Flight f
            where upper(f.origin) = upper(:origin)
              and upper(f.destination) = upper(:destination)
              and f.departureTime >= :dayStart
              and f.departureTime < :dayEnd
              and f.active = true
            order by f.departureTime asc
            """)
    List<Flight> search(@Param("origin") String origin,
                        @Param("destination") String destination,
                        @Param("dayStart") LocalDateTime dayStart,
                        @Param("dayEnd") LocalDateTime dayEnd);
}
