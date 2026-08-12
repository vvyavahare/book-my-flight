#!/usr/bin/env bash
# Stops locally started airline services by matching their jar/log names.
# Reads PIDs from `jobs`-style discovery via pgrep on the artifact names.
set -uo pipefail

for name in flight-search-service booking-service api-gateway; do
  pids=$(pgrep -f "$name-0.0.1-SNAPSHOT.jar" || true)
  if [ -n "$pids" ]; then
    echo "==> Stopping $name (pids: $pids)"
    for pid in $pids; do kill "$pid" 2>/dev/null || true; done
  else
    echo "==> $name not running"
  fi
done

echo "Done. (The frontend dev server, if started via start-all.sh, stops with Ctrl-C.)"
