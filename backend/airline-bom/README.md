# airline-bom

**Bill of Materials** — the single source of truth for dependency versions across all
airline microservices. Packaged as `pom` and imported (scope `import`) by the parent POM so
every module inherits consistent, vetted versions. Bumping a version here updates every
service at once, minimising the number of vulnerability fixes needed over time.

## What it manages

| Area | Managed via | Notes |
|------|-------------|-------|
| Spring Cloud (Gateway, …) | `spring-cloud-dependencies` `2025.1.2` | Aligned with Spring Boot 4.1.x |
| JWT | `io.jsonwebtoken:jjwt-*` `0.12.6` | Used by gateway auth + `airline-common` |
| Architecture guardrails | `com.tngtech.archunit:archunit-junit5` `1.5.0` | `PackagesArchTest` |
| Internal library | `com.pet.project.airline:airline-common` | Version pinned to the reactor |

> Spring Boot itself is managed by `spring-boot-starter-parent` (the parent of
> `airline-parent`), not here. This BOM adds the *extra* trains/libraries on top.

## Adding or bumping a version

1. Edit the `<properties>` (or add a `<dependency>` under `<dependencyManagement>`) in
   [`pom.xml`](pom.xml).
2. Reference the dependency in a module **without** a `<version>` — it is inherited.
3. Rebuild: `./mvnw -pl airline-bom install` then the dependent modules.
