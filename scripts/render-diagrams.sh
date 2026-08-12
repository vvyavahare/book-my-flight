#!/usr/bin/env bash
# Renders committed PlantUML sources to SVG files used by the READMEs.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if command -v plantuml >/dev/null 2>&1; then
  PLANTUML=(plantuml)
elif [[ -n "${PLANTUML_JAR:-}" && -f "$PLANTUML_JAR" ]]; then
  PLANTUML=(java -jar "$PLANTUML_JAR")
else
  echo "PlantUML is required. Install it with 'brew install plantuml'," >&2
  echo "or set PLANTUML_JAR to the path of a PlantUML jar." >&2
  exit 1
fi

"${PLANTUML[@]}" -tsvg \
  "$ROOT/backend/flight-search-service/docs/packages.puml" \
  "$ROOT/backend/flight-search-service/docs/generated/DomainModel.puml" \
  "$ROOT/backend/booking-service/docs/packages.puml" \
  "$ROOT/backend/booking-service/docs/generated/DomainModel.puml"

echo "Rendered PlantUML diagrams to SVG."
