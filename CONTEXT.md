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
| Phase 3 — Collector Experience | ✅ Complete | Mapbox map, PostCard, claim/complete flow, AlertWidget, CreatePostPage |
| Phase 4 — Admin + Applications | ✅ Complete | AdminPage: stats dashboard, application list with filter/approve/reject |
| Phase 5 — Donor Dashboard + Gamification | ✅ Complete | MyDonationsPage (post history), StatsPage (impact + badges) |
| Phase 6 — Polish + Deploy | ✅ Complete | Lazy-loading, mobile nav, 404 page, ErrorBlock, Vercel SPA config |
| Phase 7 — Auth Redesign | ✅ Complete | Custom password auth, removed registration, admin creates users, change password page |
| Phase 8 — Beneficiary Platform | ✅ Complete | Beneficiary profiles, favorites, per-person gamification, messages, caretaker management |
| Phase 9 — Caretaker & Donor UX | ✅ Complete | Role-based home, claim→complete flow, message likes/replies, activity feed, pickup-targeted messages |
| Phase 10 — Admin Panel + Polish | ✅ Complete | Tabbed admin (users/apps/beneficiaries/posts/messages), create accounts, map search, donor-targeted messages from claim modal |

---

## Phase 8: Beneficiary-Centered Platform Redesign

### Vision
Transform from generic recycling pickup app into a **personal connection platform** where donors donate to specific people in need (beneficiaries), managed by caretaker organizations.

### Roles
| Role | Who | Key actions |
|------|-----|-------------|
| `donor` | Public recycling donors | Post recycling (targeted or general), browse beneficiaries, favorite, per-person stats, receive messages |
| `caretaker` | Org staff — was "collector" | Register beneficiaries, claim pickups, assign donations, post messages on behalf |
| `admin` | morganadolfsson | Manage everything (later sprint) |
| beneficiary | NOT a login user — profile managed by caretakers | Pensioners/people in need |

### New Collections
- `beneficiaries` — { name, bio, photoUrl?, caretakerId, organizationName, totalReceivedSEK, supporterCount, isActive, createdAt }
- `favorites` — { donorId, beneficiaryId, createdAt }
- `donation_logs` — { postId, donorId, caretakerId, beneficiaryId, amountSEK, items, createdAt }
- `donor_beneficiary_stats` — { donorId, beneficiaryId, totalSEK, donationCount, level (1-5), updatedAt }
- `messages` — { beneficiaryId, caretakerId, donorId? (null=public), text, photoUrl?, createdAt }
- Modified `posts` — added: targetBeneficiaryId, assignedBeneficiaryId

### Sprint Plan (all complete)
| Sprint | Scope | Status |
|--------|-------|--------|
| 0 | Bug fixes: map size (65vh), error states, collector→caretaker rename | ✅ |
| 1 | Backend: new collections + all new API endpoints, deployed | ✅ |
| 2-3 | Frontend API types + new components | ✅ |
| 4-5 | New pages + modify existing pages | ✅ |
| 6 | i18n keys (EN/SV) + CSS + code review fixes | ✅ |

### Code Review Fixes Applied
- StatCard reused in BeneficiaryProfilePage (was duplicating markup)
- Removed redundant `completingId` state in HomePage (derived from `completingPost`)
- Backend: parallelized writes in post completion (`Promise.all`)
- Backend: eliminated double haversine computation in post listing
- Removed unnecessary comment in LevelBadge

### Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Donor | test@test.com | test |
| Admin | morgan.adolfsson44@gmail.com | admin |
| Caretaker | caretaker@test.com | test |

### Test Beneficiaries (pre-seeded)
- Sven Eriksson — "Retired teacher from Malmö"
- Ingrid Lindqvist — "85-year-old grandmother, former nurse"

### Auth Notes
- Custom JWT auth (not codehooks-auth) — 7-day tokens
- Frontend uses `x-access-token` header (not `Authorization`) to avoid codehooks platform conflict
- Frontend also sends `x-apikey` header for codehooks platform auth
- API key: `[REDACTED-API-KEY]` (stored in `VITE_API_KEY`)
- Seed endpoint: `POST /auth/seed` with secret `[REDACTED-SEED-SECRET]`

### Frontend Structure (Phase 8 — current)
```
src/
├── components/
│   ├── AlertWidget.tsx         # Caretaker nearby-post count
│   ├── BeneficiaryCard.tsx     # Photo/initials, name, bio, stats, favorite heart, level
│   ├── BeneficiarySelector.tsx # Dropdown for selecting beneficiary (create post + completion)
│   ├── ClaimModal.tsx          # Modal: caretaker claims post + assigns beneficiary
│   ├── CompletionModal.tsx     # Modal: caretaker selects beneficiary on pickup completion
│   ├── ErrorBlock.tsx          # Error + retry button
│   ├── LevelBadge.tsx          # 1-5 star visual level indicator
│   ├── MessageCard.tsx         # Thank-you message display
│   ├── Navbar.tsx              # Role-aware nav, hamburger mobile menu
│   ├── PostCard.tsx            # Post summary with claim/complete
│   ├── PostMap.tsx             # Mapbox GL map (markers, pin-drop)
│   ├── ProtectedRoute.tsx      # Auth + role guard
│   └── StatCard.tsx            # Reusable stat display card
├── pages/
│   ├── AdminPage.tsx           # Platform stats + application management
│   ├── ApplyPage.tsx           # Caretaker application form
│   ├── BeneficiariesPage.tsx   # Browse all beneficiaries, search, favorite
│   ├── BeneficiaryProfilePage.tsx # Single profile: bio, stats, messages, donor connection
│   ├── CaretakerBeneficiariesPage.tsx # Manage beneficiaries, register new, post messages
│   ├── ChangePasswordPage.tsx  # Change own password
│   ├── CreatePostPage.tsx      # Item picker, pin-drop, optional beneficiary target
│   ├── DonorDashboardPage.tsx  # Connections, messages, favorites
│   ├── HomePage.tsx            # Map + list, filters, claim, completion modal
│   ├── LoginPage.tsx           # Email/password login (no registration)
│   ├── MyDonationsPage.tsx     # Donor post history
│   ├── NotFoundPage.tsx        # 404
│   └── StatsPage.tsx           # Impact stats + badges
├── contexts/AuthContext.tsx     # User state, login, logout
├── lib/
│   ├── api.ts                  # All API types + endpoints
│   ├── errors.ts               # Error status helper
│   └── formatters.ts           # Shared formatItemSummary, formatTimeRange
├── i18n/ (en.json, sv.json)    # ~200 translation keys
├── App.tsx                     # Routes + lazy loading
├── App.css                     # All component styles
└── index.css                   # CSS variables (light/dark)
```

### API Endpoints (Phase 8 — current)
**Public**: POST /auth/login, POST /auth/seed, GET /pant-prices
**Protected** (x-access-token + x-apikey):
- Posts: GET/POST /api/posts, GET /api/posts/:id, POST /api/posts/:id/claim, POST /api/posts/:id/complete
- Donor: GET /api/my/posts, GET /api/my/stats, PATCH /api/my/profile, PATCH /api/my/password, PATCH /api/my/location
- Donor-beneficiary: GET /api/my/favorites, GET /api/my/beneficiary-stats, GET /api/my/messages
- Favorites: POST /api/favorites, DELETE /api/favorites/:beneficiaryId
- Beneficiaries: GET/POST /api/beneficiaries, GET/PATCH /api/beneficiaries/:id, GET /api/beneficiaries/:id/messages
- Messages: POST /api/messages
- Alerts: GET /api/alerts (caretaker)
- Applications: POST /api/applications, GET/PUT /api/admin/applications/:id
- Admin: GET /api/admin/stats, POST /api/admin/users

### What's Next
- **Phase 10: Admin Panel** — see detailed plan below
- **CreatePostPage** — integrate BeneficiarySelector for targeted donations
- **Notifications** — push/email when donation assigned or message received
- **Photo upload** — actual file upload endpoint (currently data URLs, 2MB limit)
- **Backend query optimization** — activity endpoint does full table scans on message_likes/users
- **Vercel deployment** — connect domain, deploy frontend
- **Commit + push** — all Phase 9 changes are uncommitted

---

## Phase 9: Caretaker & Donor UX (2026-04-08)

### Overview
Complete rework of both donor and caretaker experiences. Donors see a donation-centric home; caretakers get a streamlined claim→complete→message flow. Full message interaction system (likes, replies, activity feed) connects the two roles.

### Donor Experience
- **Home page** (`/`) shows "My Donations" — list of all posts with status badges (waiting/accepted/completed + beneficiary name)
- **Click any donation** → expands inline to show messages, with like/reply
- **Nav**: Home, Post Recycling, Beneficiaries, My Impact
- No map page for donors — that's caretaker-only

### Caretaker Experience
- **Home page** (`/`) shows map + available pickups (unchanged)
- **Claim flow**: Click pickup → ClaimModal with beneficiary selector → claim → "Mark as collected" auto-completes with the pre-selected beneficiary (no second selection)
- **My Beneficiaries** page:
  - Click beneficiary → expandable detail with **Overview** and **Edit** tabs
  - **Overview**: Stats grid (SEK received, supporters, active status), bio, registration date
  - **Messages section**: Compose form with **pickup dropdown** (select which pickup/donor to address), message list with inline replies
  - **Donor activity feed**: Always visible — shows likes and replies from donors
  - **Edit tab**: Name, bio, photo (file picker with 2MB limit + preview)

### Message System
- **Backend collections**: `messages` (now with `postId`, `donorAlias`), `message_likes`, `message_replies`
- **Donor can**: Like messages (heart toggle), reply to messages (inline form)
- **Caretaker can**: Post messages tied to specific pickups/donors, see all donor likes/replies in activity feed, see replies threaded under each message

### Backend Endpoints Added (recycle-backend/index.js)
| Method | Route | Role | Description |
|--------|-------|------|-------------|
| POST | `/api/messages/:id/like` | any | Like a message |
| DELETE | `/api/messages/:id/like` | any | Unlike a message |
| GET | `/api/my/liked-messages` | any | Get IDs of liked messages |
| POST | `/api/messages/:id/reply` | any | Reply to a message |
| GET | `/api/messages/:id/replies` | any | Get replies for a message |
| GET | `/api/beneficiaries/:id/activity` | caretaker | Likes + replies for beneficiary's messages |
| GET | `/api/my/pickups` | caretaker | Posts claimed/completed by this caretaker |

### Backend Schema Changes
- `messages`: added `postId` (string|null), `donorAlias` (string|null)
- `message_likes`: { messageId, userId, createdAt }
- `message_replies`: { messageId, beneficiaryId, userId, userAlias, userRole, text, createdAt }

### New Frontend Files
- `src/components/ClaimModal.tsx` — Post detail + beneficiary selector for claiming
- `src/pages/MessagesPage.tsx` — Standalone messages page (kept as route, not in nav)
- `src/lib/formatters.ts` — Shared `formatItemSummary`, `formatTimeRange`

### Key Frontend Changes
- `src/App.tsx` — Role-based home: donors → MyDonationsPage, caretakers → HomePage
- `src/pages/MyDonationsPage.tsx` — Expandable donation rows with inline messages, like/reply
- `src/pages/HomePage.tsx` — preSelectedBeneficiary carry-through, auto-complete on mark collected
- `src/pages/CaretakerBeneficiariesPage.tsx` — Tabbed detail (overview/edit), pickup dropdown in message compose, activity feed, replies on messages
- `src/components/MessageCard.tsx` — Like button, reply form, inline replies, donorAlias display
- `src/components/Navbar.tsx` — Role-specific nav links
- `src/lib/api.ts` — `caretakerApi.myPickups`, `messagesApi.like/unlike/myLiked/reply/replies`, `activityApi.forBeneficiary`, `MessageReply`, `ActivityItem` types

### Code Review Fixes Applied (2 rounds)
- Removed redundant `photoPreview` state; added file size guard + FileReader error handler
- Consolidated duplicate beneficiary API calls; memoized lookup map
- Derived `claimingPost` from existing state instead of separate variable
- Extracted shared formatters to eliminate PostCard/ClaimModal duplication
- Added try/catch on all async handlers (toggleLike, handleReply, handleCreate, toggleActive, handleSendMessage)
- Added .catch() per-reply fetch to prevent unhandled rejections
- Clear `preSelectedBeneficiary` after completion

### Sprint 3: Donor Home + Message Integration (2026-04-09)
- **Donor home is now "My Donations"** — donors see `/` as their donation list (not the map). Role-based routing via `DonorOrCaretakerHome` wrapper in App.tsx
- **Expandable donation rows** — click any donation to see messages inline with like/reply (no separate Messages page needed)
- **Caretaker message compose** — pickup dropdown uses `GET /api/my/pickups` (new endpoint) to list completed pickups for the beneficiary, with donor alias + amount + date
- **Backend**: Added `GET /api/my/pickups` (caretaker) — returns all posts claimed by this caretaker
- **Backend**: Messages now store `postId` and `donorAlias` fields; backend looks up donor alias on message creation
- **Caretaker activity feed** — always visible (shows empty state when no activity); messages show inline replies from donors
- **UI fix**: Caretaker beneficiary cards now use consistent flexbox layout (`flex: 1`, explicit `line-height`) so all cards align regardless of bio length

---

## Phase 10: Admin Panel + Polish (2026-04-09)

### Admin Panel — Complete
Tabbed admin interface at `/admin` (login: `morgan.adolfsson44@gmail.com` / `admin`):

| Tab | Features |
|-----|----------|
| **Overview** | Platform stats dashboard (posts, users, caretakers, SEK) |
| **Users** | List all users with role badges + filter by role. Create new donor/caretaker accounts. Inline role editing. |
| **Applications** | Caretaker application list with approve/reject, status filter |
| **Beneficiaries** | All beneficiaries across all caretakers. Inline edit name/bio. Activate/deactivate. Error handling + retry. |
| **Posts** | All donations with status filter (open/claimed/completed), donor info, item summary |
| **Messages** | Full message log with beneficiary name, donor alias, date |

### Backend Endpoints Added
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/users` | List all users (optional `?role=` filter) |
| PATCH | `/api/admin/users/:id` | Update user role/alias/displayName |
| GET | `/api/admin/beneficiaries` | List all beneficiaries |
| PATCH | `/api/admin/beneficiaries/:id` | Edit any beneficiary (name/bio/photo/isActive) |
| GET | `/api/admin/posts` | List all posts (optional `?status=` filter) |
| GET | `/api/admin/messages` | List all messages with beneficiary names |
| GET | `/api/my/pickups` | Caretaker: posts they claimed/completed |

### Other Changes
- **Map geocoding search** — PostMap has address/zip code search bar (Mapbox Geocoding API). Flies to location and drops pin.
- **Map wider** — 3:1 grid ratio (75% map, 25% list)
- **Map ResizeObserver** — auto-resizes when container changes
- **CreatePostPage** — favorites dropdown for targeting a beneficiary; date + time range picker (instead of two datetime-local inputs)
- **ClaimModal** — shows meeting instructions; "Message donor" section to send a note tied to the pickup
- **Caretaker sees meeting details** — backend `maskPost` updated to reveal meetingPoint/meetingInstructions to caretakers on open posts
- **Backend fix**: `updateDonorStats` and `/api/my/stats` now handle missing `donor_stats` records (`.catch(() => null)`)

### Code Review Fixes
- **AdminPage**: Replaced fragile `includes('!')` success detection with `createSuccess` boolean state
- **AdminPage**: Used shared `formatItemSummary` from formatters.ts in PostsTab (was duplicating logic)
- **AdminPage**: Added error state + ErrorBlock to BeneficiariesTab (was missing entirely)
- **ClaimModal**: Added error feedback (`msgError` state) on message send failure
- **CreatePostPage**: Fixed variable shadowing (`t` → `type` in `ITEM_TYPES.find`)

### What's Next
- **Pagination** for admin list endpoints (currently unbounded)
- **Admin tab caching** — tabs remount/refetch on every switch; lift state or cache
- **Client-side filtering** — fetch once, filter locally instead of per-filter API calls
- **Notifications** — push/email when donation assigned or message received
- **Photo upload** — actual file upload endpoint (currently data URLs, 2MB limit)
- **Vercel deployment** — connect domain, deploy frontend

---

## Frontend Structure (Phase 5 — current)

```
src/
├── i18n/
│   ├── en.json              # English translations (all phases)
│   ├── sv.json              # Swedish translations (all phases)
│   └── index.ts             # i18next init (persists lang to localStorage)
├── contexts/
│   └── AuthContext.tsx       # user, login, register, logout — persists to localStorage
├── components/
│   ├── Navbar.tsx            # Lang toggle, role-aware nav links (donor: Post Recycling)
│   ├── ProtectedRoute.tsx    # Redirects to /login if unauthenticated, optional role guard
│   ├── PostCard.tsx          # Post summary: items, SEK, status badge, claim/complete buttons
│   ├── PostMap.tsx           # Mapbox GL map — markers (green/red), pin-drop mode, ARIA
│   └── AlertWidget.tsx       # Collector nearby-post count badge (fetches /api/alerts)
├── pages/
│   ├── LoginPage.tsx         # Email/password login
│   ├── RegisterPage.tsx      # Email/password register
│   ├── ApplyPage.tsx         # Collector application form (role-aware)
│   ├── HomePage.tsx          # Map + list view, period filters, claim/complete flow
│   ├── CreatePostPage.tsx    # Item picker, Mapbox pin-drop, time window, instructions
│   ├── AdminPage.tsx         # Stats grid, application list, status filter, approve/reject
│   ├── MyDonationsPage.tsx   # Donor post history (reuses PostCard, read-only)
│   └── StatsPage.tsx         # Impact stats grid + badge cards (earned/locked)
├── lib/
│   └── api.ts               # Typed fetch client for all endpoints
├── App.tsx                   # BrowserRouter + all routes
├── App.css                   # All component styles + responsive breakpoints
└── index.css                 # CSS variables (green theme, light/dark)
```

### Code review (Phases 3–5) — fixes applied:
- **XSS**: PostMap popup switched from `setHTML` to `setText`
- **Validation**: CreatePostPage enforces start < end and future-time checks
- **Bug**: Admin "All" filter now correctly passes no status param
- **Perf**: Removed `t` from useEffect deps to prevent refetch on lang change
- **A11y**: Focus-visible on PostCard, ARIA role/label on map container

### Phase 6 complete — additions:
```
src/pages/
└── NotFoundPage.tsx    # 404 page with link home
src/components/
└── ErrorBlock.tsx      # Reusable error-with-retry block
vercel.json             # SPA rewrite rules for Vercel deployment
```

### Phase 6 changes:
- **Code splitting**: All pages lazy-loaded via React.lazy + Suspense
  - Main bundle: 75kb gzipped (was 566kb)
  - Mapbox chunk: 469kb gzipped, loaded only on map pages
- **Mobile nav**: Hamburger toggle, full-width dropdown menu at <=768px
- **404 page**: Replaces catch-all Navigate, proper not-found UX
- **ErrorBlock**: Used in HomePage and AdminPage with retry button
- **Vercel config**: SPA rewrites for client-side routing

---

## Environment Variables

### Frontend (`.env`)
```
VITE_API_URL=https://recycleapp-8740.api.codehooks.io/dev
VITE_APP_TITLE=Pantaround
VITE_MAPBOX_TOKEN=pk.eyJ1... # Mapbox GL token (set in Phase 3)
```

### Backend (set via `coho set-env`)
```
JWT_ACCESS_TOKEN_SECRET   # encrypted
JWT_REFRESH_TOKEN_SECRET  # encrypted
```
