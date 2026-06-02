# GeoPhoto — Architecture & Project Plan

## 1. Overview

GeoPhoto is a web application that allows authenticated users to upload geotagged photos, view them as interactive markers on a map, and collaborate through comments. An AI layer automatically generates a description for each uploaded image.

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
| **EXIF parsing** | MetadataExtractor (NuGet) | Extracts GPS latitude/longitude directly from image binary |
| **AI descriptions** | Ollama + LLaVA model (local) | Vision-capable, runs entirely on local machine, zero cost, no API key required |
| **Containerization** | Docker + Docker Compose | Single-command local setup, reproducible across machines |

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
│     PostgreSQL      Local /uploads   Ollama (LLaVA)  │
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
  → React sends multipart/form-data to POST /api/photos
  → AuthMiddleware validates JWT
  → MetadataExtractor reads GPS EXIF from binary
      → If no GPS data: return 400 "Image has no geotag"
  → IStorageService.Save(file) → writes to /uploads/{guid}.jpg
  → INSERT Photo(userId, filePath, lat, lng) → return photo JSON
  → Background task: call Ollama REST API (llava model) with image as base64
      → UPDATE Photo SET AiDescription = "..."
  → React receives photo, drops marker on Leaflet map at (lat, lng)
```

---

## 7. Map Performance at Scale (10k+ photos)

**Problem:** Rendering 10,000 individual Leaflet markers causes DOM saturation and degraded pan/zoom performance.

**Solutions (layered by complexity):**

| Strategy | When to use |
|---|---|
| **Marker clustering** (Leaflet.markercluster) | First line of defense — groups nearby markers at high zoom levels into a count bubble. Near-zero implementation cost. |
| **Viewport-based loading** | `GET /api/photos?bbox=lat1,lng1,lat2,lng2` — backend only returns photos visible in the current map bounds. Reduces initial payload dramatically. |
| **Pagination / infinite load** | Combine with bbox: load the 200 closest photos, fetch more on zoom-in. |
| **Tile server (future)** | At true scale (100k+), pre-render photos into map tiles using PostGIS + pg_tileserv. |

For this project, marker clustering + bbox filtering covers the 10k requirement cleanly.

**Image storage trade-offs:**

| Approach | Pros | Cons |
|---|---|---|
| Local filesystem | Zero setup, fast for dev | Doesn't scale, lost on container restart without a volume |
| S3-compatible (Minio locally, AWS S3 in prod) | Scalable, persistent, CDN-ready | Requires credentials, slightly more setup |
| Database BLOBs | Simple queries | Bloats the DB, kills query performance at scale |

**Decision:** Abstract behind `IStorageService` — use local filesystem for the demo, swap to S3 for production without changing business logic.

---

## 8. Deployment

### Local (Docker Compose)

```yaml
services:
  db:        postgres:16
  backend:   dotnet watch run (or published image)
  frontend:  vite dev server (or nginx serving /dist)
  ollama:    ollama/ollama (pull llava model on first run)
```

Single command: `docker compose up` — app runs at `http://localhost:5173`.

> **Note on Ollama:** LLaVA requires ~4GB of disk for the model weights. On first run, `ollama pull llava` downloads automatically inside the container. CPU inference takes ~10–20s per image — acceptable since the description is generated in the background after upload.

### Cloud (optional, production path)

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
| **1 — Setup** | Repo, Docker Compose, ASP.NET scaffold, Vite scaffold, DB connection | 1h |
| **2 — Auth** | User model, register/login endpoints, JWT, React login/register forms | 1.5h |
| **3 — Photo upload** | Photo model, multipart upload endpoint, EXIF parsing, file save | 1.5h |
| **4 — Map** | Leaflet integration, marker rendering, photo popup | 1.5h |
| **5 — Comments** | Comment model, API endpoints, comment UI in popup | 1h |
| **6 — AI descriptions** | Ollama + LLaVA setup in Docker, base64 image call, display in popup | 1h |
| **7 — Polish & delivery** | README, end-to-end test, optional video demo | 1h |
| **Total** | | **~9.5h** |

---

## 10. Key Design Decisions & Trade-offs

- **Monorepo over separate repos** — easier to run locally, simpler for a reviewer to clone and understand.
- **JWT over session cookies** — stateless, SPA-friendly, no server-side session store needed.
- **Ollama over cloud AI APIs** — LLaVA runs locally inside Docker at zero cost. The REST API (`POST /api/generate`) is simple enough that no SDK is needed — a plain `HttpClient` call from the backend suffices.
- **Background AI call** — AI description is generated after the photo is saved, so the upload doesn't block on inference time. The UI shows a "generating description..." placeholder and polls or updates when ready.
- **`IStorageService` abstraction** — swapping local disk to S3 is a one-line config change, not a refactor.
- **Marker clustering over raw markers** — `Leaflet.markercluster` handles 10k markers gracefully with 5 lines of code.