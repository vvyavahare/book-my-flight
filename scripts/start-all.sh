#!/usr/bin/env bash
# Starts all backend microservices (H2 profile -- no external infra needed) plus the
# gateway, then the frontend dev server. Logs go to /tmp/airline-*.log.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/backend"

echo "==> Building backend (skip tests)..."
(cd "$BACKEND" && ./mvnw -q -DskipTests install)

start_jar() {
  local name="$1" jar="$2"
  echo "==> Starting ${name}..."
  nohup java -jar "$jar" > "/tmp/airline-${name}.log" 2>&1 &
  echo "    pid=$! log=/tmp/airline-${name}.log"
}

start_jar flight-search "$BACKEND/flight-search-service/target/flight-search-service-0.0.1-SNAPSHOT.jar"
start_jar booking        "$BACKEND/booking-service/target/booking-service-0.0.1-SNAPSHOT.jar"
start_jar gateway        "$BACKEND/api-gateway/target/api-gateway-0.0.1-SNAPSHOT.jar"

echo "==> Waiting for gateway health..."
for _ in $(seq 1 30); do
  if curl -sf http://localhost:8080/actuator/health >/dev/null 2>&1; then
    echo "    gateway is up on :8080"
    break
  fi
  sleep 2
done

echo "==> Starting frontend (http://localhost:3000)..."
(cd "$ROOT/frontend" && npm run dev)
