#!/usr/bin/env bash
# Smoke-tests the end-to-end slice through the gateway: 401 → login → search → book.
set -euo pipefail
GW="${GATEWAY_URL:-http://localhost:8080}"

echo "1) Unauthenticated search should be 401:"
curl -s -o /dev/null -w "   status=%{http_code}\n" "$GW/api/flights?origin=AMS&destination=LHR"

echo "2) Login:"
TOKEN=$(curl -s -X POST "$GW/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"username":"demo","password":"demo"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
echo "   token acquired (${#TOKEN} chars)"

echo "3) Search flights:"
DATE=$(date +%F)
FLIGHTS=$(curl -s "$GW/api/flights?origin=AMS&destination=LHR&date=$DATE" -H "Authorization: Bearer $TOKEN")
FLIGHT_ID=$(echo "$FLIGHTS" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -1)
echo "   picked flightId=$FLIGHT_ID"

echo "4) Create booking:"
BOOKING=$(curl -s -X POST "$GW/api/bookings" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"flightId\":\"$FLIGHT_ID\",\"contactEmail\":\"traveler@example.com\",\"passengers\":[{\"firstName\":\"Ada\",\"lastName\":\"Lovelace\"}]}")
echo "   $BOOKING"

BOOKING_ID=$(echo "$BOOKING" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -1)
echo "5) Fetch booking $BOOKING_ID:"
curl -s "$GW/api/bookings/$BOOKING_ID" -H "Authorization: Bearer $TOKEN" -w "\n   status=%{http_code}\n"
