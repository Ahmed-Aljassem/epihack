# Frontend ↔ Backend Integration Guide

This document is the contract the frontend expects from the backend.
The whole console is wired through `src/services/dataSources.js`, which
chooses between mock and live API per resource. Flip a single flag from
`"mock"` to `"api"` per resource once its endpoint is ready and verified.

---

## How the swap works

`frontend/src/services/dataSources.js`:

```js
const SOURCES = {
  reports:   "mock",   // ← flip to "api" once /api/reports is live
  alerts:    "mock",
  surveys:   "mock",
  responses: "mock",
  dashboard: "mock",
};
```

Each service module (`reportsService`, `alertsService`, `surveysService`,
`responsesService`, `dashboardService`) exposes methods that hooks &
pages call. The mock implementations live in `src/services/mocks/*`
and document the expected response shape. The live wiring in
`dataSources.js` delegates to the axios clients in `src/services/api.js`.

When you flip a flag:
1. The mock module is no longer loaded for that resource.
2. The hooks (`useReports`, `useData`) call the axios wrapper, which hits
   the backend at `${VITE_API_BASE_URL}/api/...`.
3. If the response shape differs from the mock, **the page will break**
   — that's the integration test. The fix is in the backend, not the
   frontend.

---

## Required endpoints (priority order)

### 1. `/api/reports`  ← most critical

**The mobile app submits here; the console reads/triages from here.**

```
GET    /api/reports
GET    /api/reports/{id}
POST   /api/reports               (called by mobile app, not the console)
PATCH  /api/reports/{id}/status   body: { status: "New"|"In review"|"Routed"|"Resolved" }
POST   /api/reports/{id}/notes    body: { body: string, author: string }
PATCH  /api/reports/{id}/assignee body: { assignee: string }
```

**Report response shape** (one item):

```jsonc
{
  "id": "RPT-1024",
  "type": "animal",                   // "human" | "animal" | "environment" | "vector"
  "category": "Animal",               // display label
  "categorySlug": "animal",           // "people" | "animal" | "env" | "vector"
  "color": "#34d399",                 // optional; frontend can derive
  "status": "New",                    // "New" | "In review" | "Routed" | "Resolved"
  "summary": "Coyote, unsteady in pasture",
  "longitude": -110.987,
  "latitude": 32.286,
  "submittedAt": "2026-05-19T14:14:00Z",
  "submittedShort": "2:14 PM",        // optional; frontend can derive
  "location": {
    "zip": "85719",
    "county": "Pima Co.",
    "coords": "32.286, -110.987"
  },
  "assignee": "L. Romero (Pima · Epi)",  // optional
  "notes": [
    { "author": "L. Romero", "body": "...", "time": "2026-05-19T14:21:00Z" }
  ],

  // Optional rich-detail fields (only used by /agency/reports/{id}):
  "subcategory": "sick",
  "submittedLabel": "Today · 2:14 PM",
  "tags": ["Animal · sick", "Anonymous"],
  "description": "Long-form text from the reporter",
  "facts": {
    "signs": "Unsteady · lethargic",
    "affected": "1 animal",
    "danger": "No (livestock nearby)",
    "observed": "Today · 2:14 PM",
    "reporter": "Anonymous · SMS",
    "photo": "1 attached"
  },
  "photo": { "name": "coyote.jpg", "size": "2.1 MB" },
  "routing": {
    "title": "Auto-routed",
    "rule": "Rule matched",
    "destination": "AZ Game & Fish · Rabies surveillance"
  },
  "activity": [
    { "kind": "check"|"routed"|"note", "title": "...", "meta": "...", "time": "2:14 PM" }
  ]
}
```

**Query parameters** (all optional, all currently honored client-side
in the mock — server should support them too):
- `category` — one of `people`, `animal`, `env`, `vector`, or omit for all
- `status` — one of `new`, `review`, `routed`, `resolved`
- `range` — one of `24h`, `7d`, `30d`, `All`
- `q` — free-text search across id, category, summary, coords
- `ids` — comma-separated list of report IDs (used by cluster view)

**Mobile submission contract**: the mobile app POSTs the minimal record
created by its wizard — at least `{ type, longitude, latitude, submittedAt }`,
plus whatever symptoms / fields the wizard collected. Backend enriches
to the full shape above.

---

### 2. `/api/alerts`

```
GET    /api/alerts
GET    /api/alerts/{id}
POST   /api/alerts
PATCH  /api/alerts/{id}/status  body: { status: "open"|"investigating"|"resolved"|"false_positive" }
```

**Alert response shape**:

```jsonc
{
  "id": "alert-24",
  "title": "Mosquito activity rising — drain standing water",
  "description": "...",
  "severity": "low" | "medium" | "high" | "critical",
  "category": "people" | "animal" | "env" | "vector",
  "status": "open" | "investigating" | "resolved" | "false_positive",
  "anomaly_score": 2.84,             // nullable
  "created_at": "2026-05-19T14:48:00Z",
  "target": "85719 · 85705",          // ZIPs or place names
  "channels": ["Web", "SMS", "Email"],
  "actions": ["Drain standing water", "Use repellent"],
  "message": "Long-form body shown in email/print previews",
  "linked_reports": ["RPT-1022"]
}
```

**Create payload** (POST body) matches the same shape minus
`id`, `status`, `created_at`, `anomaly_score` (server-assigned).

---

### 3. `/api/surveys` + `/api/responses`

These mostly exist on the backend already (`backend/app/routers/surveys.py`,
`responses.py`). Confirm the response wraps match what the mock file
documents in `src/services/mocks/surveys.mock.js`.

---

### 4. `/api/dashboard`

```
GET /api/dashboard/stats
GET /api/dashboard/trend?days=14
```

The dashboard currently derives stats client-side from the reports list,
so this endpoint is **optional** in v1 — if it's missing, no UI breaks.
If you provide it, see `src/services/mocks/dashboard.mock.js` for the
expected shape.

---

## Auth

The console assumes JWT via `Authorization: Bearer <token>` header,
already wired in `src/services/api.js`. Existing endpoints:

```
POST /api/auth/register   body: UserCreate
POST /api/auth/login      body (form-urlencoded): { username, password }
GET  /api/auth/me
```

**Heads-up**: the register form posts 9 fields
(`name, email, password, role, agency, title, phone, license, county`).
The current backend `UserCreate` schema only consumes 4. The extras are
silently dropped — you'll want to extend the schema to capture them.

---

## Dev preview bypass

`?preview=1` on any `/agency/*` URL skips auth in DEV mode only (see
`src/App.jsx`). Strip this for production.

---

## Env vars

`frontend/.env`:

```
VITE_API_BASE_URL=        # leave blank for the Vite proxy / Docker Nginx
VITE_MAPBOX_TOKEN=...     # required for the Reports map
```

---

## Handoff checklist

- [ ] Stand up `/api/reports` with the shape above
- [ ] Verify a hand-rolled `curl POST /api/reports` from mobile-shaped
      payload returns a 201 + the enriched record
- [ ] Flip `SOURCES.reports` → `"api"` in `services/dataSources.js`
- [ ] Verify dashboard, map, reports list, and detail still render
- [ ] Verify status changes, notes, and reassign all persist across reloads
- [ ] Repeat for `alerts`, `surveys`, `responses`, `dashboard`

---

## Notes for the frontend side

If a response shape changes after this doc is written, update both
the mock module (so devs without backend running still see realistic data)
and this doc, in the same PR.
