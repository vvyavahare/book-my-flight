package com.pet.project.airline.booking.service;

import com.pet.project.airline.booking.domain.AncillaryConfig;
import com.pet.project.airline.booking.dto.AncillaryConfigDto;
import com.pet.project.airline.booking.dto.AncillaryConfigRequest;
import com.pet.project.airline.booking.repository.AncillaryConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Reads and updates the singleton {@link AncillaryConfig} (seat class + baggage fee policy).
 */
@Service
public class AncillaryConfigService {

    private final AncillaryConfigRepository repository;

    public AncillaryConfigService(AncillaryConfigRepository repository) {
        this.repository = repository;
    }

    /** The current fee policy, falling back to built-in defaults if none is stored yet. */
    @Transactional(readOnly = true)
    public AncillaryConfig current() {
        return repository.findById(AncillaryConfig.SINGLETON_ID).orElseGet(this::defaults);
    }

    @Transactional(readOnly = true)
    public AncillaryConfigDto currentDto() {
        return toDto(current());
    }

    @Transactional
    public AncillaryConfigDto update(AncillaryConfigRequest request) {
        AncillaryConfig config = repository.findById(AncillaryConfig.SINGLETON_ID).orElseGet(this::defaults);
        config.update(
                request.economySeatFee(), request.businessSeatFee(), request.firstSeatFee(),
                request.economyBag1Fee(), request.economyBag2Fee(), request.economyBag3Fee(),
                request.businessBag2Fee(), request.businessBag3Fee(),
                request.maxCheckedBags(), request.maxCheckedWeightKg(),
                request.currency().trim().toUpperCase());
        return toDto(repository.save(config));
    }

    private AncillaryConfig defaults() {
        return new AncillaryConfig(
                new BigDecimal("15.00"), new BigDecimal("45.00"), new BigDecimal("90.00"),
                new BigDecimal("25.00"), new BigDecimal("40.00"), new BigDecimal("60.00"),
                new BigDecimal("40.00"), new BigDecimal("60.00"),
                3, 50, "EUR");
    }

    public AncillaryConfigDto toDto(AncillaryConfig c) {
        return new AncillaryConfigDto(
                c.getEconomySeatFee(), c.getBusinessSeatFee(), c.getFirstSeatFee(),
                c.getEconomyBag1Fee(), c.getEconomyBag2Fee(), c.getEconomyBag3Fee(),
                c.getBusinessBag2Fee(), c.getBusinessBag3Fee(),
                c.getMaxCheckedBags(), c.getMaxCheckedWeightKg(), c.getCurrency());
    }
}
