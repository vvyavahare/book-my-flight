package com.pet.project.airline.booking.guardrail;

import com.tngtech.archunit.core.importer.ImportOption.DoNotIncludeTests;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.tngtech.archunit.library.plantuml.rules.PlantUmlArchCondition.Configuration.consideringOnlyDependenciesInAnyPackage;
import static com.tngtech.archunit.library.plantuml.rules.PlantUmlArchCondition.adhereToPlantUmlDiagram;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Keeps {@code docs/packages.puml} in sync with the actual package structure.
 * Adopted from github.com/victorrentea/petclinic. Two guarantees:
 * <ul>
 *   <li>every cross-package dependency in the code is an edge the diagram allows
 *       (ArchUnit {@code adhereToPlantUmlDiagram});</li>
 *   <li>the diagram's {@code <<..pkg>>} stereotype set equals the code's subpackages
 *       exactly — no drawn package missing from code, no code package missing from the
 *       drawing.</li>
 * </ul>
 */
@AnalyzeClasses(
        packages = "com.pet.project.airline.booking",
        importOptions = DoNotIncludeTests.class)
class PackagesArchTest {

    private static final Path DIAGRAM = Paths.get("docs/packages.puml");
    private static final Path SOURCE_ROOT =
            Paths.get("src/main/java/com/pet/project/airline/booking");

    @ArchTest
    static final ArchRule adheresToDiagram = classes().should(adhereToPlantUmlDiagram(
            DIAGRAM,
            consideringOnlyDependenciesInAnyPackage("..booking..")));

    @Test
    void diagramPackagesMatchCodePackages() throws IOException {
        Set<String> diagramPackages = parsePackagesFromDiagram();
        Set<String> codePackages = listCodePackages();

        assertThat(diagramPackages)
                .as("packages.puml stereotypes must match the actual subpackages of "
                        + "com.pet.project.airline.booking exactly")
                .isEqualTo(codePackages);
    }

    private static Set<String> parsePackagesFromDiagram() throws IOException {
        String puml = Files.readString(DIAGRAM);
        Pattern stereotype = Pattern.compile("<<\\.\\.([a-zA-Z0-9.]+)>>");
        Matcher matcher = stereotype.matcher(puml);
        Set<String> result = new TreeSet<>();
        while (matcher.find()) {
            result.add(matcher.group(1));
        }
        return result;
    }

    private static Set<String> listCodePackages() throws IOException {
        try (Stream<Path> paths = Files.walk(SOURCE_ROOT)) {
            return paths.filter(Files::isDirectory)
                    .filter(dir -> !dir.equals(SOURCE_ROOT))
                    .filter(PackagesArchTest::containsJavaFile)
                    .map(dir -> SOURCE_ROOT.relativize(dir).toString().replace('/', '.'))
                    .collect(Collectors.toCollection(TreeSet::new));
        }
    }

    private static boolean containsJavaFile(Path dir) {
        try (Stream<Path> entries = Files.list(dir)) {
            return entries.anyMatch(p -> p.toString().endsWith(".java"));
        } catch (IOException e) {
            return false;
        }
    }
}
