# Recycle App — Project Context

> This file is updated at the end of every phase. Use it to restore full context in a new session.

---

## Project Overview

A web-based platform connecting **recycling donors** with **certified collectors** in Malmö, Sweden. Built on Sweden's pant system — donors post recycling for pickup, certified collectors (pensioners/needy individuals) claim and recycle it for money.

**Core principles:**
- Minimal personal data (GDPR-by-design)
- Donors post a meeting point — not their home address
- Collectors must be manually approved by the app owner (morganadolfsson)
- Bilingual: English + Swedish
- Hosted on Vercel (frontend) + codehooks.io (backend)

---

## Users & Roles

| Role | Access | Notes |
|------|--------|-------|
| `donor` | Default on signup. Create posts, view history, see stats | No real name required — alias only |
| `collector` | Approved by admin. Browse/claim posts, see meeting details after claim | Apply via in-app form |
| `admin` | App owner (morganadolfsson). Approve/reject collector applications | Created manually in DB |

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React + TypeScript (Vite) | `C:\Users\morga\Desktop\cursor\recycle app\` |
| Backend | codehooks.io (Node.js ESM) | `C:\Users\morga\Desktop\cursor\recycle-backend\` |
| Database | codehooks NoSQL (MongoDB-style) | Built into codehooks platform |
| Auth | codehooks-auth (JWT, email/OTP) | `initAuth` — all `/api/*` routes protected |
| Maps | Mapbox (planned Phase 3) | Pin drop + display |
| i18n | react-i18next (planned Phase 2) | English default, Swedish toggle |
| Hosting | Vercel (frontend) + codehooks.io dev space | Deploy: `coho deploy` |

---

## Codehooks Project

- **Project name:** `recycleapp-8740`
- **Team:** morganadolfsson (personal)
- **Active space:** `dev`
- **API base URL:** `https://recycleapp-8740.api.codehooks.io/dev`
- **Alt URL:** `https://blissful-butte-d633.codehooks.io`
- **JWT secrets:** Set as encrypted env vars (`JWT_ACCESS_TOKEN_SECRET`, `JWT_REFRESH_TOKEN_SECRET`)
- **Deploy command:** `cd recycle-backend && coho deploy --projectname recycleapp-8740`

---

## GitHub

- **Repo:** https://github.com/morganadolfsson/recycle-app
- **Git user:** morganadolfsson / morgan.adolfsson44@gmail.com
- **Default branch:** `main`
- **Frontend lives in repo root**

---

## Database Collections

### `users`
Managed by `codehooks-auth`. Extended with:
```json
{
  "_id": "...",
  "email": "...",
  "role": "donor | collector | admin",
  "alias": "string (1–50 chars)",
  "displayName": "string | null (opt-in, max 100)",
  "savedLat": 55.6,
  "savedLng": 13.0,
  "createdAt": "ISO string"
}
```

### `posts`
```json
{
  "_id": "...",
  "donorId": "userId",
  "donorAlias": "string (max 50)",
  "items": [{ "type": "can|pet_small|pet_large|glass_small|glass_large", "quantity": 1–9999 }],
  "estimatedSEK": 12,
  "meetingPoint": { "lat": 55.6, "lng": 13.0 },
  "meetingInstructions": "string (max 500)",
  "timeWindowStart": "ISO string",
  "timeWindowEnd": "ISO string",
  "status": "open | claimed | completed",
  "claimedBy": "userId | null",
  "claimedAt": "ISO string | null",
  "completedAt": "ISO string | null",
  "createdAt": "ISO string"
}
```

### `donor_stats`
```json
{
  "userId": "...",
  "totalSEK": 0,
  "totalItems": 0,
  "postCount": 0,
  "badges": ["first_donation", "regular_donor", "dedicated_donor", "100kr_club", "500kr_club", "1000kr_hero"],
  "createdAt": "ISO string",
  "updatedAt": "ISO string"
}
```

### `applications`
```json
{
  "_id": "...",
  "userId": "...",
  "email": "...",
  "name": "string (max 100)",
  "organization": "string (max 100)",
  "message": "string (max 1000)",
  "status": "pending | approved | rejected",
  "createdAt": "ISO string"
}
```

---

## Pant Prices (SEK)

| Item type | Price |
|-----------|-------|
| `can` | 1 kr |
| `pet_small` | 1 kr |
| `pet_large` | 2 kr |
| `glass_small` | 1 kr |
| `glass_large` | 2 kr |

---

## API Endpoints

All `/api/*` routes require `Authorization: Bearer <access_token>` header.
Auth routes (`/auth/*`) are public — provided by `codehooks-auth`.

### Posts
| Method | Route | Role | Description |
|--------|-------|------|-------------|
| GET | `/api/posts` | any | List open posts. Query: `lat`, `lng`, `radius` (km), `period` (today\|week) |
| POST | `/api/posts` | donor | Create post |
| GET | `/api/posts/:id` | any | Get single post (meeting details hidden until claimed) |
| POST | `/api/posts/:id/claim` | collector | Claim a post |
| POST | `/api/posts/:id/complete` | collector | Mark pickup complete |

### Donor
| Method | Route | Role | Description |
|--------|-------|------|-------------|
| GET | `/api/my/posts` | donor | Own post history |
| GET | `/api/my/stats` | donor | Gamification stats + badges |
| PATCH | `/api/my/profile` | any | Update alias / displayName |
| PATCH | `/api/my/location` | any | Save preferred location for alerts |

### Collector
| Method | Route | Role | Description |
|--------|-------|------|-------------|
| GET | `/api/alerts` | collector | Today's posts near saved/provided location (max 20) |
| POST | `/api/applications` | any | Submit collector application |

### Admin
| Method | Route | Role | Description |
|--------|-------|------|-------------|
| GET | `/api/admin/applications` | admin | List applications by status |
| PUT | `/api/admin/applications/:id` | admin | Approve or reject (`{ decision: "approved"\|"rejected" }`) |
| GET | `/api/admin/stats` | admin | Platform overview stats |

### Public
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/pant-prices` | Returns pant price map |

---

## Key Design Decisions

1. **Location privacy**: `meetingPoint` coords AND `meetingInstructions` are stripped from posts until a collector claims them. Donors can use any meeting point — doesn't have to be home address.
2. **No GDPR-heavy data**: No real names required. Email is login only. Alias shown publicly.
3. **Gamification**: Donor stats tracked in `donor_stats` collection. Badges computed on every new post.
4. **Collector approval**: Manual — admin uses `/api/admin/applications` to approve, which upgrades user's `role` to `collector`.
5. **Distance filtering**: Haversine formula in API — no geospatial DB support needed.
6. **No real-time**: Alert widget polls on login. No WebSockets needed for MVP.

---

## Phase Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1 — Foundation (Backend) | ✅ Complete | codehooks API deployed, auth configured, all routes live |
| Phase 2 — Core Frontend | ✅ Complete | i18n (EN/SV), AuthContext, API client, Login/Register/Apply pages, Navbar, routing |
| Phase 3 — Collector Experience | ⬜ Pending | Map view, claim flow, alert widget |
| Phase 4 — Admin + Applications | ⬜ Pending | Approval UI, collector application form |
| Phase 5 — Donor Dashboard + Gamification | ⬜ Pending | Stats, badges, history |
| Phase 6 — Polish + Deploy | ⬜ Pending | Responsive, Vercel domain, error states |

---

## Frontend Structure (Phase 2 starting point)

```
recycle app/
├── src/
│   ├── components/     # Shared UI components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # API client, utilities
│   ├── App.tsx
│   └── main.tsx
├── CONTEXT.md          # ← this file
├── .env.example        # VITE_API_URL, VITE_APP_TITLE
└── package.json
```

### Phase 2 complete — structure now:
```
src/
├── i18n/
│   ├── en.json         # English translations
│   ├── sv.json         # Swedish translations
│   └── index.ts        # i18next init (persists lang to localStorage)
├── contexts/
│   └── AuthContext.tsx # user, login, register, logout — persists to localStorage
├── components/
│   ├── Navbar.tsx      # Lang toggle (EN/SV), role-aware nav links
│   └── ProtectedRoute.tsx  # Redirects to /login if unauthenticated
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── ApplyPage.tsx   # Collector application form (role-aware)
├── lib/
│   └── api.ts          # Typed fetch client for all endpoints
├── App.tsx             # BrowserRouter + all routes
├── App.css             # Base styles (green accent, auth cards, forms)
└── index.css           # CSS variables (green theme)
```

### Phase 3 will add:
```
src/pages/
├── HomePage.tsx        # Map view + list view of posts, filters, alert widget
└── CreatePostPage.tsx  # Donor post creation form with Mapbox pin drop
src/components/
├── PostCard.tsx        # Post summary card
├── PostMap.tsx         # Mapbox map component
└── AlertWidget.tsx     # Collector alert count widget
```

---

## Environment Variables

### Frontend (`.env`)
```
VITE_API_URL=https://recycleapp-8740.api.codehooks.io/dev
VITE_APP_TITLE=Pantaround
VITE_MAPBOX_TOKEN=       # needed for Phase 3
```

### Backend (set via `coho set-env`)
```
JWT_ACCESS_TOKEN_SECRET   # encrypted
JWT_REFRESH_TOKEN_SECRET  # encrypted
```
