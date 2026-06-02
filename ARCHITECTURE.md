# GeoPhoto — Architecture & Project Plan

## 1. Overview

GeoPhoto is a web application that allows authenticated users to upload geotagged photos, view them as interactive markers on a map, and collaborate through comments. An AI layer automatically generates a description for each uploaded image using Google Gemini Vision.

---

## 2. Technology Choices

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React + Vite + TypeScript | Fast HMR, strong typing, component model well suited to map-heavy UIs |
| **Backend** | ASP.NET Core 8 Web API | Strong HTTP abstractions, built-in DI, JWT support out of the box |
| **Database** | PostgreSQL + EF Core | Relational integrity for users/photos/comments, mature .NET ORM |
| **File storage** | Local filesystem (dev) → S3-compatible (prod) | Simple to start, easy to swap via an `IStorageService` abstraction |
| **Authentication** | JWT (access token) + BCrypt password hashing | Stateless, works cleanly with a SPA frontend |
| **Map** | Leaflet.js + react-leaflet | Open-source, no API key required, rich marker/popup API |
| **Marker clustering** | react-leaflet-cluster | Groups nearby markers at low zoom levels, handles 10k+ photos performantly |
| **EXIF parsing** | MetadataExtractor (NuGet) | Extracts GPS latitude/longitude directly from image binary |
| **AI descriptions** | Google Gemini 2.5 Flash (REST API) | Vision-capable, free tier, no local GPU required, simple HTTP call from backend |

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Browser (React)                   │
│  Auth forms │ Upload form │ Leaflet map │ Modals     │
└─────────────────────┬────────────────────────────────┘
                      │ HTTPS / JSON
┌─────────────────────▼────────────────────────────────┐
│              ASP.NET Core 8 Web API                  │
│                                                      │
│  /api/auth     → AuthController (register, login)    │
│  /api/photos   → PhotoController (upload, list, get) │
│  /api/photos/{id}/comments → CommentController       │
│                                                      │
│  ┌──────────────┐  ┌────────────────┐                │
│  │ JWT Middleware│  │ IStorageService│                │
│  └──────────────┘  └───────┬────────┘                │
│                            │                         │
│            ┌───────────────┼──────────────┐          │
│            ▼               ▼              ▼          │
│     PostgreSQL      Local /uploads   Gemini API      │
│     (EF Core)       or S3 bucket     (AI description)│
└──────────────────────────────────────────────────────┘
```

---

## 4. Database Models

### User
| Field | Type | Notes |
|---|---|---|
| Id | UUID | PK |
| Email | string | Unique |
| PasswordHash | string | BCrypt |
| CreatedAt | timestamp | |

### Photo
| Field | Type | Notes |
|---|---|---|
| Id | UUID | PK |
| UserId | UUID | FK → User |
| FileName | string | Stored path or S3 key |
| Latitude | double | Extracted from EXIF |
| Longitude | double | Extracted from EXIF |
| AiDescription | string? | Generated asynchronously |
| CreatedAt | timestamp | |

### Comment
| Field | Type | Notes |
|---|---|---|
| Id | UUID | PK |
| PhotoId | UUID | FK → Photo |
| UserId | UUID | FK → User |
| Text | string | |
| CreatedAt | timestamp | |

---

## 5. Authentication Flow

```
1. POST /api/auth/register  { email, password }
   → BCrypt.HashPassword → INSERT User → return 201

2. POST /api/auth/login  { email, password }
   → BCrypt.Verify → generate JWT (userId, email, exp: 24h) → return { token }

3. React stores token in localStorage
   → Axios interceptor adds Authorization: Bearer <token> to every request

4. ASP.NET JWT middleware validates token on every protected route
   → [Authorize] attribute on PhotoController, CommentController
```

---

## 6. Image Upload Flow (end-to-end)

```
User selects file
  → Upload preview modal shown in browser
  → React sends multipart/form-data to POST /api/photos
  → AuthMiddleware validates JWT
  → MetadataExtractor reads GPS EXIF from binary
      → If no GPS data: return 400 "Image has no geotag"
  → IStorageService.Save(file) → writes to /uploads/{guid}.jpg
  → INSERT Photo(userId, filePath, lat, lng) → return photo JSON
  → Background task: call Gemini 2.5 Flash API with image as base64
      → UPDATE Photo SET AiDescription = "..."
  → React receives photo, drops marker on Leaflet map at (lat, lng)
  → Popup polls every 3s until AI description is available
```

---

## 7. Map Performance at Scale (10k+ photos)

**Problem:** Rendering 10,000 individual Leaflet markers causes DOM saturation and degraded pan/zoom performance.

**Solutions (layered by complexity):**

| Strategy | When to use |
|---|---|
| **Marker clustering** (react-leaflet-cluster) | First line of defense — groups nearby markers at low zoom levels into a count bubble. Implemented in this project. |
| **Viewport-based loading** | `GET /api/photos?bbox=lat1,lng1,lat2,lng2` — backend only returns photos visible in the current map bounds. Reduces initial payload dramatically. |
| **Pagination / infinite load** | Combine with bbox: load the 200 closest photos, fetch more on zoom-in. |
| **Tile server (future)** | At true scale (100k+), pre-render photos into map tiles using PostGIS + pg_tileserv. |

For this project, marker clustering covers the 10k requirement. Bbox filtering would be the next step for larger datasets.

**Image storage trade-offs:**

| Approach | Pros | Cons |
|---|---|---|
| Local filesystem | Zero setup, fast for dev | Doesn't scale, lost on server restart without a volume |
| S3-compatible (Minio locally, AWS S3 in prod) | Scalable, persistent, CDN-ready | Requires credentials, slightly more setup |
| Database BLOBs | Simple queries | Bloats the DB, kills query performance at scale |

**Decision:** Abstract behind `IStorageService` — use local filesystem for the demo, swap to S3 for production without changing business logic.

---

## 8. Deployment

### Local Development

Postgres runs natively via `apt install postgresql`. The backend runs with `dotnet run` and the frontend with `npm run dev`. No Docker required for local development.

```
Terminal 1: sudo service postgresql start
Terminal 2: cd backend/GeoPhoto.API && dotnet run      → http://localhost:5132
Terminal 3: cd frontend/geophoto-ui && npm run dev     → http://localhost:5173
```

### Cloud (production path)

| Service | Component |
|---|---|
| Railway or Render | ASP.NET API (free tier) |
| Supabase | PostgreSQL (free tier, 500MB) |
| Cloudflare R2 | Image storage (S3-compatible, generous free tier) |
| Vercel or Netlify | React frontend (free tier) |

---

## 9. Project Plan & Time Estimates

| Phase | Tasks | Estimate |
|---|---|---|
| **0 — Strategist** | Architecture doc, diagrams, tech decisions | 1h |
| **1 — Setup** | Repo, ASP.NET scaffold, Vite scaffold, DB connection | 1h |
| **2 — Auth** | User model, register/login endpoints, JWT, React login/register forms | 1.5h |
| **3 — Photo upload** | Photo model, multipart upload endpoint, EXIF parsing, file save | 1.5h |
| **4 — Map** | Leaflet integration, marker rendering, photo popup | 1.5h |
| **5 — Comments** | Comment model, API endpoints, comment UI in popup | 1h |
| **6 — AI descriptions** | Gemini API integration, background task, polling UI | 1h |
| **7 — Polish & delivery** | README, clustering, upload modal, empty state, end-to-end test | 1h |
| **Total** | | **~9.5h** |

---

## 10. Key Design Decisions & Trade-offs

- **Monorepo over separate repos** — easier to run locally, simpler for a reviewer to clone and understand.
- **JWT over session cookies** — stateless, SPA-friendly, no server-side session store needed.
- **Gemini 2.5 Flash over local AI** — provides high-quality vision descriptions via a free REST API. No local GPU required, no model weights to manage. The free tier is sufficient for a demo workload.
- **Background AI call** — AI description is generated after the photo is saved, so the upload is never blocked by inference latency. The UI shows "⏳ Generating description..." and polls every 3 seconds until the description is ready.
- **`IStorageService` abstraction** — swapping local disk to S3 is a one-line config change, not a refactor. This keeps the business logic clean and environment-agnostic.
- **Marker clustering over raw markers** — react-leaflet-cluster groups nearby markers at low zoom levels, directly addressing the 10k photo performance requirement stated in the brief. Near-zero implementation cost with significant performance gain.
- **Upload preview modal** — showing a thumbnail before confirming the upload reduces accidental uploads and gives the user confidence they selected the right file.
