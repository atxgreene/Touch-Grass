# 🌱 PlayFinder

**Find the best places to play any sport, anywhere.**

PlayFinder is a location-based sports discovery app. Instead of juggling a
different app for golf, basketball, tennis, and pickleball, open PlayFinder,
pick your sport, and instantly see the best nearby places to play — at home or
while traveling.

This repo contains the MVP web app: a mobile-responsive React + TypeScript
single-page app with an interactive map, rich facility details, filters, and
persistent user features (favorites, recently viewed, reviews).

![sports](https://img.shields.io/badge/sports-9-2f8f4e) ![stack](https://img.shields.io/badge/stack-React%20%2B%20TS%20%2B%20Vite-159a4f) ![map](https://img.shields.io/badge/map-Leaflet%20%2F%20OSM-22b563)

---

## Quick start

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
```

Other scripts:

```bash
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build
npm run lint     # type-check only (tsc --noEmit)
```

No API keys are required. Maps use free OpenStreetMap tiles via Leaflet, and
facility data is seeded locally (centered on Austin, TX) so the app is fully
functional out of the box.

---

## Features (MVP)

### 📍 Location services
- Detects the user's location via the browser Geolocation API.
- Falls back gracefully to Austin, TX when permission is denied or unavailable,
  with a one-tap "Use my location" prompt.
- Distances are computed with the haversine formula and results are sorted
  nearest-first.

### 🏀 Sport selection
Search or tap to browse across **9 sports**: Golf, Basketball, Pickleball,
Tennis, Volleyball, Soccer, Disc Golf, Baseball/Softball, and Hockey. New
sports are a one-line addition to `src/data/sports.ts`.

### 🔍 Filters
- **Open now** (live, based on each facility's weekly hours)
- **Public / Private**
- **Indoor / Outdoor**
- **Free / Paid**
- **Distance** — within 5, 10, 25, or 50 miles
- Free-text search over name, city, and address.

### 📋 Facility information
Each place shows photos (placeholder gradients — no external assets),
address, one-tap directions, hours of operation, ratings & reviews, amenities
(lights, restrooms, parking, water, etc.), and contact info / website.

**Sport-specific details** where relevant:
- **Golf** — green fees, driving range, tee-time booking link, course rating, holes
- **Basketball** — full / half court, indoor/outdoor, condition
- **Pickleball / Tennis / Volleyball** — court count, reservations, surface

### ❤️ User features
- **Save favorites** — persisted to `localStorage`
- **Recently viewed** — automatically tracked
- **Leave ratings & reviews** — your reviews persist locally and appear
  alongside seeded reviews

All user state survives a page reload; nothing is sent to a server.

---

## Tech & architecture

| Concern            | Choice                                            |
| ------------------ | ------------------------------------------------- |
| Framework          | React 18 + TypeScript                             |
| Build tool         | Vite 5                                            |
| Map                | Leaflet + react-leaflet, OpenStreetMap tiles      |
| Persistence        | `localStorage` (favorites, recents, reviews)      |
| Assets             | None — placeholder photos are generated gradients |

```
src/
├── main.tsx               # React entry
├── App.tsx                # top-level state & layout
├── types.ts               # domain models (Facility, Filters, Review, …)
├── data/
│   ├── sports.ts          # sport catalog
│   └── facilities.ts      # seed facilities (swap for an API in production)
├── hooks/
│   ├── useGeolocation.ts  # location w/ graceful fallback
│   └── useLocalStorage.ts # persisted state + id-list helper
├── lib/
│   ├── distance.ts        # haversine + formatting
│   ├── hours.ts           # weekly hours, "open now", next-open logic
│   ├── filters.ts         # query/rank pipeline
│   └── gradient.ts        # deterministic placeholder "photos"
└── components/
    ├── SportSelector.tsx
    ├── FilterBar.tsx
    ├── FacilityCard.tsx
    ├── MapView.tsx
    ├── FacilityDetail.tsx
    └── StarRating.tsx
```

### Swapping in a real backend
The seed data in `src/data/facilities.ts` matches the `Facility` type in
`src/types.ts`. Replace that module (or the `FACILITIES` import in `App.tsx`)
with a fetch against a places API returning the same shape, and the rest of the
app works unchanged.

---

## Roadmap (future features)

These are intentionally out of scope for the MVP but the data model leaves room
for them:

- 🎮 Live pickup-game postings ("Need 2 more for basketball at 6 PM")
- 📊 Community check-ins showing how busy a place is
- 🏆 Tournament and league listings
- 🎖️ Achievement badges (courts / courses visited)
- 👥 Friend profiles and activity
- ✈️ Travel mode — plan places to play before arriving in a new city

---

## Goal

Become the go-to app for finding the best places to play sports anywhere — one
platform to discover, compare, and enjoy sports facilities near you.
