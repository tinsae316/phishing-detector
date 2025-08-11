Phishing URL Detection System

Overview

This project is a complete, production-ready Phishing URL Detection System consisting of:

- Firefox Browser Extension: Monitors active tab URLs, offers a "Scan this link" context menu, warns or blocks unsafe pages.
- Backend API (Node.js + Express + PostgreSQL via Prisma): URL scanning logic, threat database, logs, admin authentication, rate limiting, and integrations with Google Safe Browsing and VirusTotal.
- Admin Dashboard (Next.js + React): Secure admin login, dashboard metrics, threat management (CRUD), and log viewing with filters.

Monorepo Layout

- `backend/` — Node.js + Express API with Prisma and PostgreSQL
- `dashboard/` — Next.js Admin Dashboard
- `extension/` — Firefox WebExtension (MV3)

Quickstart

1) Prerequisites

- Node.js >= 18
- pnpm (recommended) or npm/yarn
- Docker (to run PostgreSQL locally)

2) Environment

Copy the provided examples and customize values:

```bash
cp backend/.env.example backend/.env
```

3) Start Database

```bash
docker compose up -d
```

4) Install Dependencies

```bash
pnpm install -r
# or: npm install --workspaces
```

5) Migrate and Seed (Backend)

```bash
cd backend
pnpm prisma:migrate
pnpm prisma:generate
pnpm prisma:seed
```

6) Run Services (Dev)

Terminal A (backend):

```bash
cd backend
pnpm dev
```

Terminal B (dashboard):

```bash
cd dashboard
pnpm dev
```

7) Load the Firefox Extension

- Open `about:debugging#/runtime/this-firefox`
- Click "Load Temporary Add-on"
- Select the `extension/manifest.json`

Configuration

Backend (`backend/.env`):

- `DATABASE_URL` — Postgres connection string (Docker compose sets this by default)
- `JWT_SECRET` — Secret for JWT signing
- `PORT` — Backend port (default 4000)
- `FORCE_HTTPS` — Set `true` in production to enforce HTTPS
- `SAFE_BROWSING_API_KEY` — Optional Google Safe Browsing API key
- `VIRUSTOTAL_API_KEY` — Optional VirusTotal API key

Admin credentials are seeded (see `backend/prisma/seed.ts`). Change them immediately in production.

API Endpoints (Backend)

- `POST /auth/login` — Admin login (email, password) -> JWT
- `POST /scan-url` — Analyze a URL, returns `{ verdict, score, reasons, matchedThreatIds }`
- `GET /logs` — Admin-only, query filters: `q`, `severity`, `from`, `to`
- `GET /threats` — Admin-only, list/search threats
- `POST /threats` — Admin-only, create threat
- `PUT /threats/:id` — Admin-only, update threat
- `DELETE /threats/:id` — Admin-only, delete threat

Security

- HTTPS-only in production (set `FORCE_HTTPS=true`)
- JWT for admin routes
- Input validation with Zod
- IP rate limiting on scan and auth endpoints
- Basic CORS hardening

Tech Stack

- Backend: Node.js, Express, Prisma, PostgreSQL, Zod, JWT, Helmet, Rate Limit, Axios
- Dashboard: Next.js (React), fetch API
- Extension: Firefox WebExtension (MV3)

Development Plan

- Phase 1: Backend API + URL scanning logic (implemented)
- Phase 2: Firefox extension basic functionality (implemented)
- Phase 3: Admin dashboard (implemented)
- Phase 4: Integrate external threat intelligence APIs (implemented with opt-in via API keys)
- Phase 5: Deploy backend & dashboard (instructions below)

Deploy

Backend

1) Set environment variables for your host (Render, Railway, Fly.io, etc.)
2) Run migrations: `pnpm prisma:migrate` and `pnpm prisma:generate`
3) Start with `pnpm start`

Dashboard

1) Set `NEXT_PUBLIC_API_BASE_URL` to your backend HTTPS URL
2) Build: `pnpm build`
3) Start: `pnpm start`

Extension

- Update `extension/options.html` with your backend HTTPS API base URL or set via options UI

Notes

- External threat lookups are best-effort and skipped if no API keys are configured.
- The ML model hook is scaffolded in the backend scanner; you can connect a model endpoint or local model there.


