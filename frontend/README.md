# Frontend — AirGo web UI

Modern, responsive airline ticketing UI. Talks **only** to the [api-gateway](../backend/api-gateway)
(`:8080`).

- **Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4
- **Port:** 3000
- **Zero known npm vulnerabilities** (`npm audit` clean at time of writing)

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000  (dev server)
# then sign in with demo / demo
```

The backend gateway + services must be running first (see repo root
[`README.md`](../README.md) or [`../scripts/start-all.sh`](../scripts)).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build (type-checks + optimises) |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint |

## Environment

`.env.local` sets the gateway base URL — the only backend dependency:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

## Screens (App Router)

| Route | File | Purpose |
|-------|------|---------|
| `/login` | `src/app/login/page.tsx` | Sign in → stores JWT + roles; redirects admins to `/admin`, travellers to `/` |
| `/` | `src/app/page.tsx` | Flight search (searchable airport dropdowns) → results → select → booking form (admins are redirected to `/admin`) |
| `/bookings` | `src/app/bookings/page.tsx` | **My bookings** — pay, modify (typo rules), or cancel (with refund preview) |
| `/bookings/[id]` | `src/app/bookings/[id]/page.tsx` | Booking confirmation + payment step |
| `/admin` | `src/app/admin/page.tsx` | **Admin only** — tabbed: Flights (paginated CRUD + fuzzy search) and Bookings (realtime) |

Unauthenticated visits to protected pages redirect to `/login` (`useRequireAuth`); the
admin page additionally bounces non-admins home (`useRequireAdmin`).

## Structure

```
src/
├── app/                 # routes + layout + global styles
│   ├── layout.tsx       # AuthProvider + Navbar shell
│   ├── page.tsx         # search + results + booking
│   ├── login/           # login screen (role-based redirect)
│   ├── admin/           # admin console (flights CRUD + realtime bookings)
│   └── bookings/        # my bookings list + [id] confirmation/payment
├── components/          # Navbar, SearchForm, FlightCard, BookingForm,
│   │                    # AirportSelect (searchable combobox), FlightForm (create/edit),
│   │                    # FlightsAdmin (table + search + pagination), PaymentForm,
│   │                    # ModifyBookingForm, BookingStatusBadge
└── lib/
    ├── api.ts           # typed fetch client (only talks to the gateway) + SSE URL helper
    ├── types.ts         # API types mirroring backend DTOs
    ├── auth.tsx         # AuthProvider / useAuth (JWT + roles in localStorage)
    ├── useRequireAuth.ts# client-side route guard
    ├── useRequireAdmin.ts # admin-only route guard
    ├── useAirports.ts   # loads + caches the global airport catalog
    ├── format.ts        # date / money formatting
    └── stream.ts        # generic SSE helper (admin page uses EventSource directly)
```

## API client

`src/lib/api.ts` centralises all backend calls, attaches the `Bearer` token, and throws a
typed `ApiError` (with the HTTP status) so callers can react — e.g. a `401` clears the token
and bounces to login. Methods: `login`, `searchFlights`, `getAirports`, `createBooking`,
`getBooking`, `listBookings`, `listMyBookings`, `payBooking`, `getRefundQuote`,
`modifyBooking`, `cancelBooking`, `createFlight`, `updateFlight`, `deleteFlight`,
`adminListFlights`. `bookingStreamUrl()` builds the SSE URL with the token as an
`access_token` query param (EventSource cannot set headers).

## Auth

`AuthProvider` stores the JWT, username and roles in `localStorage` and exposes
`login` / `logout` / `isAuthenticated` / `isAdmin` via `useAuth()`. There is no server
session — the token is sent on each request to the gateway. The Navbar shows an **Admin**
link for admins and **My bookings** for travellers.

## Realtime

The admin dashboard opens an `EventSource` to `GET /api/bookings/stream` and **upserts** each
`booking` event into the table, so bookings made (and paid/cancelled) by any traveller show up
live with no refresh.

## Notes

- `next.config.ts` sets `agentRules: false` to stop Next 16 from generating `AGENTS.md` /
  `CLAUDE.md` in this folder.
