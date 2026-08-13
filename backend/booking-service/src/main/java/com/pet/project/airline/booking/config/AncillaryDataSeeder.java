package com.pet.project.airline.booking.config;

import com.pet.project.airline.booking.domain.Amenity;
import com.pet.project.airline.booking.domain.AncillaryConfig;
import com.pet.project.airline.booking.domain.DietaryPreference;
import com.pet.project.airline.booking.domain.MealOption;
import com.pet.project.airline.booking.repository.AmenityRepository;
import com.pet.project.airline.booking.repository.AncillaryConfigRepository;
import com.pet.project.airline.booking.repository.MealOptionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

/**
 * Seeds the ancillary catalog on startup so seat pricing, meals and amenities work
 * out-of-the-box with no external configuration:
 * <ul>
 *   <li>the singleton {@link AncillaryConfig} (seat class + baggage fees);</li>
 *   <li>a menu of {@link MealOption}s covering several dietary preferences with photos;</li>
 *   <li>a set of add-on {@link Amenity}s (Wi-Fi, priority boarding, lounge, …).</li>
 * </ul>
 */
@Configuration
public class AncillaryDataSeeder {

    private static String photo(String keywords) {
        // Keyworded stock photo — resolves to a relevant food image without any local assets.
        return "https://loremflickr.com/400/300/" + keywords;
    }

    @Bean
    CommandLineRunner seedAncillaries(AncillaryConfigRepository configRepository,
                                      MealOptionRepository mealRepository,
                                      AmenityRepository amenityRepository) {
        return args -> {
            if (configRepository.count() == 0) {
                configRepository.save(new AncillaryConfig(
                        new BigDecimal("15.00"),  // economy seat (extra legroom / preferred)
                        new BigDecimal("45.00"),  // business seat
                        new BigDecimal("90.00"),  // first class seat
                        new BigDecimal("25.00"),  // economy 1st checked bag
                        new BigDecimal("40.00"),  // economy 2nd checked bag
                        new BigDecimal("60.00"),  // economy 3rd checked bag
                        new BigDecimal("40.00"),  // business 2nd checked bag
                        new BigDecimal("60.00"),  // business 3rd checked bag
                        3,                        // max checked bags
                        50,                       // max total checked weight (kg)
                        "EUR"));
            }

            if (mealRepository.count() == 0) {
                mealRepository.saveAll(List.of(
                        new MealOption("meal-indian-veg", "Indian Meal (Vegetarian)",
                                "Aromatic basmati rice with paneer butter masala, dal tadka, naan and a side salad.",
                                DietaryPreference.VEGETARIAN, new BigDecimal("12.50"),
                                photo("indian,curry"), true),
                        new MealOption("meal-pasta-veg", "Pasta (Veggie)",
                                "Penne in a rich tomato-basil sauce with roasted vegetables and parmesan.",
                                DietaryPreference.VEGETARIAN, new BigDecimal("9.50"),
                                photo("pasta"), true),
                        new MealOption("meal-pasta-chicken", "Pasta (Chicken)",
                                "Creamy alfredo penne with grilled chicken breast and herbs.",
                                DietaryPreference.NON_VEGETARIAN, new BigDecimal("11.00"),
                                photo("pasta,chicken"), true),
                        new MealOption("meal-sandwich-veg", "Sandwich (Vegetarian)",
                                "Grilled cheese, tomato and pesto on sourdough with mixed leaves.",
                                DietaryPreference.VEGETARIAN, new BigDecimal("6.00"),
                                photo("sandwich"), true),
                        new MealOption("meal-sandwich-vegan", "Sandwich (Vegan)",
                                "Hummus, roasted pepper and avocado wrap on wholegrain bread.",
                                DietaryPreference.VEGAN, new BigDecimal("6.50"),
                                photo("sandwich,vegan"), true),
                        new MealOption("meal-sandwich-chicken", "Sandwich (Chicken)",
                                "Chicken tikka sandwich with mint mayo and crisp lettuce.",
                                DietaryPreference.NON_VEGETARIAN, new BigDecimal("7.00"),
                                photo("sandwich,chicken"), true),
                        new MealOption("meal-momos-veg", "Momos (Vegetarian)",
                                "Steamed dumplings filled with spiced cabbage and carrot, served with chilli dip.",
                                DietaryPreference.VEGETARIAN, new BigDecimal("7.50"),
                                photo("dumpling"), true),
                        new MealOption("meal-momos-vegan", "Momos (Vegan)",
                                "Steamed dumplings with tofu and mushroom, served with soy-sesame sauce.",
                                DietaryPreference.VEGAN, new BigDecimal("7.50"),
                                photo("dumpling,vegetables"), true),
                        new MealOption("meal-momos-chicken", "Momos (Chicken)",
                                "Juicy minced-chicken dumplings with garlic-chilli dip.",
                                DietaryPreference.NON_VEGETARIAN, new BigDecimal("8.50"),
                                photo("dumpling,chicken"), true),
                        new MealOption("meal-noodles-veg", "Noodles (Vegetarian)",
                                "Stir-fried Hakka noodles with seasonal vegetables and soy glaze.",
                                DietaryPreference.VEGETARIAN, new BigDecimal("8.00"),
                                photo("noodles"), true),
                        new MealOption("meal-noodles-vegan", "Noodles (Vegan)",
                                "Wok-tossed noodles with tofu, pak choi and a ginger-garlic sauce.",
                                DietaryPreference.VEGAN, new BigDecimal("8.00"),
                                photo("noodles,vegetables"), true),
                        new MealOption("meal-noodles-chicken", "Noodles (Chicken)",
                                "Chicken chow mein with spring onion and a light sesame dressing.",
                                DietaryPreference.NON_VEGETARIAN, new BigDecimal("9.00"),
                                photo("noodles,chicken"), true),
                        new MealOption("meal-rice-noodles-gf", "Rice Noodles (Gluten-Free)",
                                "Rice noodles with vegetables in a light tamari broth — certified gluten-free.",
                                DietaryPreference.GLUTEN_FREE, new BigDecimal("9.50"),
                                photo("rice,noodles"), true)));
            }

            if (amenityRepository.count() == 0) {
                amenityRepository.saveAll(List.of(
                        new Amenity("amenity-wifi", "Onboard Wi-Fi",
                                "Unlimited high-speed internet for the whole flight.",
                                new BigDecimal("9.99"), true),
                        new Amenity("amenity-priority-boarding", "Priority Boarding",
                                "Board first and settle in before the rush.",
                                new BigDecimal("12.00"), true),
                        new Amenity("amenity-lounge", "Airport Lounge Access",
                                "Relax before departure with food, drinks and Wi-Fi in the lounge.",
                                new BigDecimal("29.00"), true),
                        new Amenity("amenity-comfort-kit", "Comfort Kit",
                                "Blanket, pillow, eye mask and earplugs for a restful journey.",
                                new BigDecimal("7.50"), true),
                        new Amenity("amenity-insurance", "Travel Insurance",
                                "Cover for delays, cancellations and lost baggage.",
                                new BigDecimal("14.00"), true)));
            }
        };
    }
}
