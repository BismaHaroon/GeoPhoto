# GeoPhoto

A fullstack web application that lets users upload geotagged photos, view them on an interactive map, and collaborate through comments. AI-powered descriptions are automatically generated for each photo using Google Gemini.

## Features

- **Authentication** — Register and log in with JWT-based auth
- **Photo upload** — Upload geotagged photos; GPS coordinates are extracted automatically from EXIF metadata
- **Interactive map** — Photos appear as markers on a Leaflet map at their real-world location
- **AI descriptions** — Google Gemini Vision automatically generates a one-sentence description of each photo
- **Comments** — Click any marker to view the photo and add comments

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Backend | ASP.NET Core 8 Web API |
| Database | PostgreSQL + EF Core |
| Auth | JWT + BCrypt |
| Map | Leaflet.js + react-leaflet |
| AI | Google Gemini 2.5 Flash |
| EXIF parsing | MetadataExtractor |

## Getting Started

### Prerequisites

- .NET 8 SDK
- Node.js 18+
- PostgreSQL 16

### 1. Clone the repo

```bash
git clone https://github.com/BismaHaroon/GeoPhoto.git
cd GeoPhoto
```

### 2. Set up the database

```bash
sudo service postgresql start
sudo -u postgres psql << 'EOF'
CREATE USER geophoto WITH PASSWORD 'geophoto';
CREATE DATABASE geophoto OWNER geophoto;
GRANT ALL PRIVILEGES ON DATABASE geophoto TO geophoto;
EOF
```

### 3. Configure the backend

Create `backend/GeoPhoto.API/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=geophoto;Username=geophoto;Password=geophoto"
  },
  "Jwt": {
    "Key": "super-secret-key-change-this-in-production-min32chars",
    "Issuer": "geophoto",
    "Audience": "geophoto"
  },
  "Gemini": {
    "ApiKey": "YOUR_GEMINI_API_KEY"
  }
}
```

Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com).

### 4. Run the backend

```bash
cd backend/GeoPhoto.API
dotnet ef database update
dotnet run
```

API runs at `http://localhost:5132`. Swagger UI at `http://localhost:5132/swagger`.

### 5. Run the frontend

```bash
cd frontend/geophoto-ui
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system design, data flow, and technical decisions.