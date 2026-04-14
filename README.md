# Weathered

[![CI](https://github.com/ToanThanhTu/weathered/actions/workflows/ci.yml/badge.svg)](https://github.com/ToanThanhTu/weathered/actions/workflows/ci.yml)

Full-stack weather app consuming the public [Open-Meteo](https://open-meteo.com/) API. Built for the NSW Rural Fire Service Junior Full Stack Developer technical assignment.

Search for a city, see current conditions. Handles empty searches, unknown cities, upstream failures, and rate limits with clean typed error states end-to-end.

<!-- screenshot goes here - replace with ./docs/screenshot.png once captured -->

![Weathered: current conditions for Sydney](docs/screenshot.png)

## Overview

Weathered is a React + Express + TypeScript monorepo. A React 19 single-page app takes a city name, hits a Node backend that orchestrates two Open-Meteo calls (geocode and current forecast), normalizes the result, and renders it with discriminated loading / error / empty / success states. The backend proxy layer adds input validation, structured logging, LRU caching with single-flight deduplication, per-IP rate limiting, and a uniform error envelope.

**Key goals:**

- Strict TypeScript, zero `any`, end-to-end type safety via shared Zod schemas
- Production-ready middleware (security headers, CORS allowlist, request IDs, graceful shutdown)
- One meaningful integration test per critical path, not exhaustive coverage
- Single-command local runs via `pnpm dev` or `docker compose up`

## Architecture

```
┌──────────────┐    /api/*     ┌────────────────┐    HTTPS    ┌──────────────┐
│   Browser    │ ------------> │   Express 5    │ ----------> │  Open-Meteo  │
│  (React 19)  │ <------------ │   (Node 24)    │ <---------- │  (no key)    │
└──────────────┘               └────────────────┘             └──────────────┘
   Vite 8                        Zod env + query validation
   Tailwind v4                   pino structured logging
   shadcn/ui                     request-ID propagation
   TanStack Query                LRU cache + single-flight
   React Compiler                express-rate-limit (path-scoped)
```

**Request lifecycle** (happy path):

1. `SearchBar` validates `city` via `WeatherQuerySchema` (shared Zod) before submit.
2. `useWeather(city)` (TanStack Query) fires `GET /api/weather?city=...`.
3. Backend re-validates the query, checks the LRU cache, then calls Open-Meteo's geocoder → forecast endpoints in sequence.
4. Response is normalized into a shared `WeatherResponse` DTO and cached for 5 minutes.
5. `WeatherPanel` branches on the query state (`idle | loading | error | success`) and renders the matching component.

**Failure modes:** validation errors, city-not-found, upstream 4xx/5xx/timeout, schema drift, and rate-limit hits all funnel through typed `AppError` subclasses into a central error handler that emits a uniform `ErrorResponse` envelope. Nothing leaks stack traces or internal paths to clients.

## Tech stack

| Layer         | Choice                                             | Why                                                                                                 |
| ------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Runtime       | **Node.js 24 LTS**                                 | Native `--env-file`, native `fetch`, top-level `await`, no `dotenv` needed                          |
| Language      | **TypeScript 6** (strict)                          | `noUncheckedIndexedAccess`, no `any` anywhere (grep yields zero)                                    |
| Monorepo      | **pnpm 10 workspaces**                             | Strict dependency isolation, first-class workspace protocol, no extra orchestrator                  |
| Shared types  | **`@weathered/shared`** (Zod 4)                    | Single source of truth for request/response shapes; types derived via `z.infer`, never hand-written |
| Backend       | **Express 5**                                      | Stable, async error propagation, universally readable, zero cognitive tax on the reviewer           |
| Validation    | **Zod 4**                                          | Env vars at startup (fail-fast), query params, upstream responses                                   |
| Logging       | **pino** + **pino-http**                           | Structured JSON, request-ID propagation via `x-request-id`, pretty transport in dev only            |
| Security      | **helmet** + explicit **CORS allowlist**           | Free defense-in-depth; never `*`                                                                    |
| Rate limiting | **express-rate-limit** (draft-8 headers)           | Path-scoped to `/api/weather`; `/api/health` is unlimited for infra probes                          |
| Caching       | **lru-cache** wrapped in a generic HOF             | Bounded memory (LRU), 5-min TTL, **single-flight** (concurrent callers share one upstream promise)  |
| Weather API   | **Open-Meteo**                                     | Free, no key, geocoding + forecast in the same family                                               |
| Frontend      | **React 19** + **Vite 8** + **React Compiler**     | Actions-based forms, auto-memoization (no manual `useMemo`/`useCallback`), Rolldown build           |
| UI            | **Tailwind v4** + **shadcn/ui**                    | CSS-first `@theme`, OKLCH colors, Radix primitives                                                  |
| Data fetching | **TanStack Query v5**                              | `enabled` gating gives idle state for free; `staleTime: 5min` matches backend cache TTL             |
| Forms         | **React 19 form actions**                          | `<form action={handler}>`, no `preventDefault` boilerplate                                          |
| Testing       | **Vitest 4** + **Supertest** + **RTL** + **jsdom** | In-process backend tests via the `createServer()` factory; role-based frontend queries              |
| CI            | **GitHub Actions**                                 | `lint -> typecheck -> test` on push & PR; concurrency groups; frozen lockfile                       |
| Container     | **Multi-stage Docker** + **nginx** proxy           | Compose brings up the whole stack; nginx reverse-proxies `/api` to backend (same-origin)            |

See [`docs/Weathered-plan.md`](docs/Weathered-plan.md) for the full build log and decision history.

## Prerequisites

- **Node.js 24 LTS** (see [`.nvmrc`](.nvmrc))
- **pnpm 10+**
- _(optional)_ **Docker** + **Docker Compose** for the container path

```sh
nvm use              # picks up .nvmrc
node --version       # v24.x
pnpm --version       # 10.x
```

## Getting started

### Option A - pnpm (local dev)

```sh
pnpm install
cp apps/backend/.env.example apps/backend/.env
pnpm dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

The root `dev` script chains `pnpm -r build && pnpm -r --parallel dev` so `packages/shared` compiles once, then backend (`tsx watch`), frontend (`vite`), and shared (`tsc --watch`) all run concurrently with hot reload.

### Option B - Docker (production-like, one command)

```sh
docker compose up --build
```

- App: http://localhost (nginx serves the frontend + proxies `/api/*`)
- Backend (direct): http://localhost:3000

Two multi-stage builds:

- **Backend**: Node 24 alpine, `pnpm deploy --prod` for a flattened runtime image, non-root `USER node`
- **Frontend**: Node 24 alpine builder → `nginx:alpine` runner serving the Vite `dist/` with an SPA fallback and a `/api/` reverse-proxy to the backend container

The backend has a healthcheck and the frontend `depends_on: { backend: { condition: service_healthy } }`, so compose waits for `/api/health` before bringing up nginx. Same-origin through nginx means no CORS preflight in the production path.

> **Note:** if you have another service on host port 80, the frontend container won't be reachable. Either stop the conflict (e.g. `sudo systemctl stop apache2`) or change the published port in `docker-compose.yml` (e.g. `'8080:80'`).

## HTTP API

| Method | Path                         | Description                                                       |
| ------ | ---------------------------- | ----------------------------------------------------------------- |
| `GET`  | `/api/health`                | Liveness probe: `{ status, uptime, timestamp }`. Unlimited.       |
| `GET`  | `/api/weather?city=<string>` | Geocode + forecast + normalize. Cached 5 min per normalized city. |

Rate limit on `/api/weather`: **60 requests per minute per IP** with IETF draft-8 standard headers.

### Success response object

```json
{
  "data": {
    "location": {
      "name": "Sydney",
      "country": "Australia",
      "latitude": -33.87,
      "longitude": 151.21
    },
    "current": {
      "temperature": 22.5,
      "apparentTemperature": 23.1,
      "humidity": 65,
      "windSpeed": 12.4,
      "windDirection": 180,
      "condition": "Mainly clear",
      "observedAt": "2026-04-14T10:00"
    }
  }
}
```

### Error envelope

All failures (validation, not-found, upstream, rate limit, internal) return the same shape. No stack traces, no internal paths.

```json
{
  "error": {
    "code": "CITY_NOT_FOUND",
    "message": "City Xyzzy not found.",
    "details": null
  }
}
```

| HTTP | `code`             | When                                                      |
| ---- | ------------------ | --------------------------------------------------------- |
| 400  | `VALIDATION_ERROR` | Query failed `WeatherQuerySchema.safeParse`               |
| 404  | `CITY_NOT_FOUND`   | Open-Meteo geocoder returned no results                   |
| 429  | `RATE_LIMITED`     | Per-IP rate window exhausted                              |
| 502  | `UPSTREAM_ERROR`   | Non-2xx, timeout, network error, or unexpected JSON shape |
| 500  | `INTERNAL_ERROR`   | Unhandled exception (generic, no internal detail leaked)  |

## Project structure

```
weathered/
├── apps/
│   ├── backend/                   # Express 5 API  → apps/backend/README.md
│   │   └── src/
│   │       ├── index.ts           # entrypoint, listen, graceful shutdown, Happy Eyeballs fix
│   │       ├── server.ts          # createServer() factory (testable, no port binding)
│   │       ├── config.ts          # Zod env validation (fail-fast)
│   │       ├── logger.ts          # shared pino instance
│   │       ├── routes/            # HTTP adapters + colocated .test.ts files
│   │       ├── cache/             # generic cached() HOF + weather instance
│   │       ├── services/          # orchestration + Open-Meteo client
│   │       ├── errors/            # AppError hierarchy
│   │       ├── middleware/        # error handler + rate limiter
│   │       └── test/              # Vitest setup
│   │
│   └── frontend/                  # React 19 SPA  → apps/frontend/README.md
│       └── src/
│           ├── App.tsx            # root + URL sync via pushState/popstate
│           ├── main.tsx           # ErrorBoundary + QueryClientProvider
│           ├── app.css            # Tailwind v4 @theme
│           ├── components/
│           │   ├── ErrorBoundary.tsx  # class component (React 19 still has no hook equivalent)
│           │   ├── main/          # SearchBar, WeatherCard, WeatherPanel (+ colocated tests)
│           │   ├── states/        # Empty / Loading / Error states
│           │   └── ui/            # shadcn/ui primitives (owned, editable)
│           ├── hooks/useWeather.ts
│           ├── lib/               # api-client (typed fetch + ApiError), query-client
│           └── test/              # Vitest setup + renderWithQuery helper
│
├── packages/
│   └── shared/                    # Zod schemas + inferred types (single source of truth)
│
├── docs/                          # Brief, implementation plan, interview prep
├── .github/workflows/ci.yml       # lint + typecheck + test
├── docker-compose.yml
├── CLAUDE.md                      # project-wide AI-session guidance (see also per-layer CLAUDE.md)
├── eslint.config.js               # ESLint 9 flat config, strictTypeChecked
├── tsconfig.base.json             # strict, NodeNext, noUncheckedIndexedAccess
├── pnpm-workspace.yaml
└── .nvmrc
```

The tree above is the shape. Each layer has a nested `CLAUDE.md` documenting per-file conventions.

## Scripts

Run from the repo root:

| Script           | Description                                                             |
| ---------------- | ----------------------------------------------------------------------- |
| `pnpm dev`       | `pnpm -r build && pnpm -r --parallel dev` (shared + backend + frontend) |
| `pnpm build`     | Build all workspaces                                                    |
| `pnpm lint`      | ESLint across all workspaces                                            |
| `pnpm typecheck` | `tsc --noEmit` across all workspaces                                    |
| `pnpm test`      | Vitest across all workspaces                                            |

## Design decisions

**Why a monorepo?** The backend and frontend share a contract. Rather than duplicating TypeScript interfaces on each side and watching them drift, I defined Zod schemas once in `packages/shared` and used `z.infer` to derive the types. Changing a field is a compile error on both sides until they're back in sync.

**Why a backend proxy?** The assignment asks for a Node service that orchestrates or proxies the upstream. That matches the production pattern: a proxy centralizes validation, caching, rate limiting, structured logging, and error normalization in one place. The frontend never talks to Open-Meteo directly, so the upstream is swappable without touching the frontend.

**Why Express 5 over Fastify/NestJS?** Scope-appropriate. NestJS would bring DI/modules/decorators to two endpoints. Fastify is faster but adds a framework to learn. Express 5 is the boring correct choice: stable, async-first since v5, universally readable. The complexity budget goes into the cache and error design, not the framework.

**Why Open-Meteo?** Free, no API key, no rate limit signup. Geocoder and forecast endpoints live in the same family, so one upstream handles both steps. Reviewers can clone and run with zero external setup.

**Why a generic cache HOF instead of inlining?** Separation of concerns: the service orchestrates upstream calls, the cache bounds memory and latency. Each layer is testable in isolation. The cache is generic (`cached<TArgs, TResult>`) so adding a second cached endpoint is three lines in a `*.cache.ts` file. Swapping to Redis tomorrow is one file change; the service never notices.

**Why cache the promise, not the resolved value?** Single-flight. If two concurrent requests for the same city arrive on a cold cache, if we use naive value-caching, both will hit the upstream in parallel. Caching the promise means the second caller awaits the first caller's in-flight promise: one upstream call, two consumers. Failures are evicted in `.catch` so transient errors don't stick.

**Why React 19 + React Compiler?** The compiler auto-memoizes based on dependency analysis, so there's no `useMemo` or `useCallback` anywhere in the source code. Manual memoization is easy to get wrong (e.g., incorrect dep arrays).

**Why no routing library?** The app is a single view. URL state lives in `?city=` via native `URLSearchParams` + `history.pushState`, with a `popstate` listener for back/forward. Adding React Router for one route would be dependency weight without a problem to solve. If there were a second view, I'd add a router.

**Why a shared `packages/shared` with no build step in dev?** Both dev consumers (`tsx` for backend, Vite for frontend) understand TypeScript natively, so the dev path exports `src/index.ts` directly. No intermediate watcher, no stale compiled output. **Production containers compile shared to `dist/`** because Node 24 refuses type stripping under `node_modules`, the dev trick is permanently closed for container builds.

**Why colocate tests with source?** `weather.test.ts` sits beside `weather.ts`. Finding the tests means finding the file. Moving the file moves the tests. No separate `__tests__` folder tree to navigate.

## Testing

Three layers, one meaningful test per critical path.

**Backend:** Vitest + Supertest integration tests that call `createServer()` directly. `fetch` is mocked with `vi.stubGlobal`; no real network, no port binding. Four cases exercise the full stack:

- Happy path (200 + shape validated against the shared `WeatherResponseSchema` as a contract test)
- City not found (404 + `CITY_NOT_FOUND`)
- Missing query (400 + `VALIDATION_ERROR`)
- Upstream 502 (502 + `UPSTREAM_ERROR`)

**Frontend:** Vitest + React Testing Library + jsdom. A `renderWithQuery()` helper provides a fresh `QueryClient` with `retry: false` per test. Four cases cover each branch of `WeatherPanel`'s discriminated state:

- Idle → `EmptyState`
- Pending → `LoadingSkeleton`
- Success → `WeatherCard` with asserted field values
- 404 → `ErrorState` with "City not found"

Queries favour `getByRole` / `getByText` over `data-testid` - RTL queries double as accessibility checks.

```sh
pnpm test          # one-shot (CI)
pnpm test:watch    # watch mode (per-package)
```

## CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and pull request to `main`.

- **Three separate steps** (`lint -> typecheck -> test`) so the GitHub UI surfaces which check failed without parsing a combined log.
- **Concurrency group:** pushing twice in quick succession cancels the older run.
- **`pnpm install --frozen-lockfile`** - CI refuses an out-of-sync lockfile, catches the "forgot to commit the lockfile" mistake before it ships.
- **Node version from `.nvmrc`** via `node-version-file`: one source of truth for dev, CI, and any deploy platform.

## Assumptions

- Single-user, no authentication.
- English-only UI and error messages.
- Metric units (°C, km/h). A toggle would be a half-hour follow-up.
- 5-minute staleness is acceptable for current conditions (Open-Meteo updates on a similar cadence).
- `observedAt` is a real UTC ISO string. The backend converts Open-Meteo's naive local time + `utc_offset_seconds` to UTC and passes the IANA `timezone` through to the frontend, which formats it with `Intl.DateTimeFormat({ timeZone })` in the **city's** local time. A user in Sydney searching London sees London-local observation time, not browser-local.
- The cache is in-memory per backend instance. Multi-instance deployments would want Redis. The `cached()` interface is designed to swap cleanly.

## What I'd do next with more time

Ranked roughly by impact and how they'd show up to a user:

1. **Leaflet map + 7-day forecast strip:** a small Leaflet map pinned at the resolved lat/lon, and a horizontal 7-day forecast strip below the current conditions card. Open-Meteo's `daily` endpoint gives it for free.
2. **Persistence:** search history in `localStorage` (fast) or a small sqlite backend table (better). Users re-check the same cities constantly.
3. **°C/°F toggle:** user preference in `localStorage`, applied at render time. Cheap polish.
4. **Playwright smoke test:** one browser test covering the happy path end-to-end through the nginx proxy and cache. Complements the existing Supertest + RTL pyramid with a full-stack check.
5. **Real deployment (Vercel + Koyeb):** frontend on Vercel, backend on Koyeb's always-on free tier, wired via a single `ALLOWED_ORIGIN` env var. Descoped on 2026-04-14 to protect time for UI/UX polish and this README. The walkthrough runs locally via `pnpm dev` or `docker compose up`.
6. **Multi-instance cache:** swap `LRUCache` for a Redis-backed store so cache state survives restarts and scales horizontally. The `cached()` interface is already designed for this swap.

## AI usage

I used Claude as a research and review partner throughout this project, for checking current stable versions (React 19, Tailwind v4, Express 5, Zod 4, Vite 8, etc.), validating edge-case handling, and auditing architecture decisions. Specific examples:

- **Research:** confirming Zod 4 import syntax changes (`import * as z`), the current `defineConfig` source for ESLint 9 flat config, and express-rate-limit's draft-8 header support.
- **Debugging:** tracking down an `ETIMEDOUT` against Open-Meteo. The root cause was Node's Happy Eyeballs 250ms attempt timeout being too short for the real TCP handshake. The fix (`net.setDefaultAutoSelectFamily(false)`) is commented in `apps/backend/src/index.ts` so future maintainers don't remove it.
- **Review:** auditing the error-mapping table for edge cases, validating the cache single-flight approach before implementing it, and an independent second pass on the test strategy.

**Every line of code in this repo, I wrote or reviewed deliberately.** I can walk through any file and explain the why. When something came from AI research I couldn't immediately verify, I cross-checked against the official docs before committing (example: the `z.url()` change and the `tseslint.config()` deprecation both got doc checks). The project's `CLAUDE.md` hierarchy exists specifically to make future AI-assisted sessions stay consistent with the decisions I've already made. AI as a tool, not a shortcut.
