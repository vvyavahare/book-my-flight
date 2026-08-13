package com.pet.project.airline.booking.service;

import com.pet.project.airline.booking.domain.AncillaryConfig;
import com.pet.project.airline.booking.domain.Booking;
import com.pet.project.airline.booking.domain.Passenger;
import com.pet.project.airline.booking.domain.SeatClass;
import com.pet.project.airline.booking.dto.SeatDto;
import com.pet.project.airline.booking.dto.SeatMapDto;
import com.pet.project.airline.booking.repository.BlockedSeatRepository;
import com.pet.project.airline.booking.repository.BookingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Builds a deterministic cabin layout for a flight and resolves individual seats.
 *
 * <p>Layout (30 rows × columns A–F):</p>
 * <ul>
 *   <li>rows 1–2: First class;</li>
 *   <li>rows 3–7: Business;</li>
 *   <li>rows 8–30: Economy — the front rows (8–14) are paid "extra legroom" seats, the
 *       rest (15–30) are free standard seats.</li>
 * </ul>
 *
 * <p>Two economy seats near the front (8C, 8D) are <strong>accessible</strong> seats,
 * reserved for passengers with reduced mobility and always free. Seat fees come from the
 * admin {@link AncillaryConfig}; availability reflects seats already booked and any seats
 * an admin has blocked.</p>
 */
@Service
public class SeatMapService {

    static final int ROWS = 30;
    static final List<String> COLUMNS = List.of("A", "B", "C", "D", "E", "F");

    private static final int FIRST_LAST_ROW = 2;
    private static final int BUSINESS_LAST_ROW = 7;
    private static final int ECONOMY_PAID_LAST_ROW = 14;
    private static final int ACCESSIBLE_ROW = 8;
    private static final Set<String> ACCESSIBLE_COLUMNS = Set.of("C", "D");

    private final BookingRepository bookingRepository;
    private final BlockedSeatRepository blockedSeatRepository;
    private final AncillaryConfigService configService;

    public SeatMapService(BookingRepository bookingRepository,
                          BlockedSeatRepository blockedSeatRepository,
                          AncillaryConfigService configService) {
        this.bookingRepository = bookingRepository;
        this.blockedSeatRepository = blockedSeatRepository;
        this.configService = configService;
    }

    /** The immutable definition of a seat (independent of who has booked it). */
    public record SeatDefinition(String seatNumber, int row, String column, SeatClass seatClass,
                                 BigDecimal fee, boolean accessible) {
    }

    /** Full seat map for a flight, with occupied and blocked seats marked unavailable. */
    @Transactional(readOnly = true)
    public SeatMapDto seatMap(String flightId) {
        AncillaryConfig config = configService.current();
        Set<String> unavailable = unavailableSeats(flightId);

        List<SeatDto> seats = COLUMNS.stream()
                .flatMap(col -> java.util.stream.IntStream.rangeClosed(1, ROWS)
                        .mapToObj(row -> toDto(define(row, col, config), unavailable)))
                .sorted((a, b) -> a.row() != b.row()
                        ? Integer.compare(a.row(), b.row())
                        : a.column().compareTo(b.column()))
                .toList();

        return new SeatMapDto(flightId, config.getCurrency(), COLUMNS, seats);
    }

    /** Resolve a single seat's definition, or throw if the coordinates are invalid. */
    @Transactional(readOnly = true)
    public SeatDefinition requireSeat(String seatNumber) {
        int[] coord = parse(seatNumber);
        int row = coord[0];
        String column = COLUMNS.get(coord[1]);
        return define(row, column, configService.current());
    }

    /** Seats that cannot be selected: already booked (active bookings) or admin-blocked. */
    @Transactional(readOnly = true)
    public Set<String> unavailableSeats(String flightId) {
        Set<String> taken = bookingRepository.findByFlightId(flightId).stream()
                .filter(b -> !b.isCancelled())
                .flatMap(b -> b.getPassengers().stream())
                .map(Passenger::getSeatNumber)
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.toSet());
        blockedSeatRepository.findByFlightId(flightId)
                .forEach(blocked -> taken.add(blocked.getSeatNumber()));
        return taken;
    }

    // ── Layout rules ────────────────────────────────────────────────────────────

    private SeatDefinition define(int row, String column, AncillaryConfig config) {
        if (row < 1 || row > ROWS || !COLUMNS.contains(column)) {
            throw new IllegalArgumentException("Invalid seat: " + row + column);
        }
        SeatClass seatClass = classForRow(row);
        boolean accessible = row == ACCESSIBLE_ROW && ACCESSIBLE_COLUMNS.contains(column);
        BigDecimal fee = feeFor(row, seatClass, accessible, config);
        return new SeatDefinition(row + column, row, column, seatClass, fee, accessible);
    }

    private SeatClass classForRow(int row) {
        if (row <= FIRST_LAST_ROW) {
            return SeatClass.FIRST;
        }
        if (row <= BUSINESS_LAST_ROW) {
            return SeatClass.BUSINESS;
        }
        return SeatClass.ECONOMY;
    }

    private BigDecimal feeFor(int row, SeatClass seatClass, boolean accessible, AncillaryConfig config) {
        if (accessible) {
            return BigDecimal.ZERO; // accessible seats are free for reduced-mobility travellers
        }
        return switch (seatClass) {
            case FIRST -> config.getFirstSeatFee();
            case BUSINESS -> config.getBusinessSeatFee();
            case ECONOMY -> row <= ECONOMY_PAID_LAST_ROW ? config.getEconomySeatFee() : BigDecimal.ZERO;
        };
    }

    private SeatDto toDto(SeatDefinition d, Set<String> unavailable) {
        return new SeatDto(d.seatNumber(), d.row(), d.column(), d.seatClass(), d.fee(),
                d.accessible(), !unavailable.contains(d.seatNumber()));
    }

    /** Parse a seat number like "12A" into [row, columnIndex]. */
    private int[] parse(String seatNumber) {
        if (seatNumber == null || seatNumber.length() < 2) {
            throw new IllegalArgumentException("Invalid seat number: " + seatNumber);
        }
        String normalized = seatNumber.trim().toUpperCase();
        String column = normalized.substring(normalized.length() - 1);
        String rowPart = normalized.substring(0, normalized.length() - 1);
        int columnIndex = COLUMNS.indexOf(column);
        int row;
        try {
            row = Integer.parseInt(rowPart);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid seat number: " + seatNumber);
        }
        if (columnIndex < 0 || row < 1 || row > ROWS) {
            throw new IllegalArgumentException("Invalid seat number: " + seatNumber);
        }
        return new int[]{row, columnIndex};
    }
}
