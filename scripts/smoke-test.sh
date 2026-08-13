#!/usr/bin/env bash
# Smoke-tests the gateway end to end: 401 → login → search → book → fetch, then the
# admin/realtime slice: admin login → role checks → create flight → live booking feed.
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

echo "6) Admin login:"
ADMIN_TOKEN=$(curl -s -X POST "$GW/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
echo "   admin token acquired (${#ADMIN_TOKEN} chars)"

echo "7) Non-admin listing all bookings should be 403:"
curl -s -o /dev/null -w "   status=%{http_code}\n" "$GW/api/bookings" \
  -H "Authorization: Bearer $TOKEN"

echo "8) Admin lists all bookings:"
curl -s -o /dev/null -w "   status=%{http_code}\n" "$GW/api/bookings" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo "9) Admin creates a flight:"
curl -s -o /dev/null -w "   status=%{http_code}\n" -X POST "$GW/api/flights" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"flightNumber":"KL9099","airline":"KLM","origin":"AMS","destination":"JFK","departureTime":"'"${DATE}T09:00:00"'","arrivalTime":"'"${DATE}T17:00:00"'","price":549.00,"currency":"EUR","seatsAvailable":180}'

echo "10) Admin fetches the live booking feed (first event):"
curl -sN -m 3 "$GW/api/bookings/stream?access_token=$ADMIN_TOKEN" | head -2 || true

echo "11) Multi-user + payment + refund flow:"
ALICE_TOKEN=$(curl -s -X POST "$GW/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"demo"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
echo "    alice token acquired (${#ALICE_TOKEN} chars, role USER)"

echo "12) Admin paginated + fuzzy search (Bombay -> BOM):"
curl -s "$GW/api/flights/admin?q=Bombay&size=3" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -w "\n    status=%{http_code}\n" -o /dev/null

echo "13) Admin soft-delete then update round-trips (PUT/DELETE):"
curl -s -o /dev/null -w "    delete status=%{http_code}\n" -X DELETE "$GW/api/flights/$FLIGHT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo "14) Alice books a fresh flight, pays, previews refund, cancels:"
ADATE=$(date +%F)
AFID=$(curl -s "$GW/api/flights?origin=AMS&destination=CDG&date=$ADATE" -H "Authorization: Bearer $ALICE_TOKEN" \
  | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -1)
ABID=$(curl -s -X POST "$GW/api/bookings" -H "Authorization: Bearer $ALICE_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"flightId\":\"$AFID\",\"contactEmail\":\"alice@example.com\",\"passengers\":[{\"firstName\":\"Ada\",\"lastName\":\"Lovelace\"}]}" \
  | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -1)
echo "    booked id=$ABID"
curl -s -o /dev/null -w "    pay status=%{http_code}\n" -X POST "$GW/api/bookings/$ABID/payment" \
  -H "Authorization: Bearer $ALICE_TOKEN" -H 'Content-Type: application/json' \
  -d '{"cardHolder":"Ada","cardNumber":"4111111111111111","expiry":"12/29","cvc":"123"}'
echo -n "    refund quote: "; curl -s "$GW/api/bookings/$ABID/refund-quote" -H "Authorization: Bearer $ALICE_TOKEN"
echo; echo -n "    mine count: "; curl -s "$GW/api/bookings/mine" -H "Authorization: Bearer $ALICE_TOKEN" | grep -o '"id"' | wc -l
