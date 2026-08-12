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
| `/login` | `src/app/login/page.tsx` | Sign in → stores JWT, redirects home |
| `/` | `src/app/page.tsx` | Flight search form → results → select → booking form |
| `/bookings/[id]` | `src/app/bookings/[id]/page.tsx` | Booking confirmation |

Unauthenticated visits to protected pages redirect to `/login` (`useRequireAuth`).

## Structure

```
src/
├── app/                 # routes + layout + global styles
│   ├── layout.tsx       # AuthProvider + Navbar shell
│   ├── page.tsx         # search + results + booking
│   ├── login/           # login screen
│   └── bookings/[id]/   # confirmation screen
├── components/          # Navbar, SearchForm, FlightCard, BookingForm
└── lib/
    ├── api.ts           # typed fetch client (only talks to the gateway)
    ├── types.ts         # API types mirroring backend DTOs
    ├── auth.tsx         # AuthProvider / useAuth (JWT in localStorage)
    ├── useRequireAuth.ts# client-side route guard
    ├── format.ts        # date / money formatting
    └── stream.ts        # placeholder for future WebSocket/SSE
```

## API client

`src/lib/api.ts` centralises all backend calls, attaches the `Bearer` token, and throws a
typed `ApiError` (with the HTTP status) so callers can react — e.g. a `401` clears the token
and bounces to login. Methods: `login`, `searchFlights`, `createBooking`, `getBooking`.

## Auth

`AuthProvider` stores the JWT (and username) in `localStorage` and exposes
`login` / `logout` / `isAuthenticated` via `useAuth()`. There is no server session — the token
is sent on each request to the gateway.

## Future real-time

`src/lib/stream.ts` reserves the shape for a WebSocket/SSE channel (e.g. live seat
availability or booking-status updates) to be wired to the gateway later.

## Notes

- `next.config.ts` sets `agentRules: false` to stop Next 16 from generating `AGENTS.md` /
  `CLAUDE.md` in this folder.
