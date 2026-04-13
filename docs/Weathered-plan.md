# Weathered — Technical Assignment Plan

**Candidate:** Junior Full Stack Developer — NSW Rural Fire Service  
**Assignment:** Full-stack weather app (React + TypeScript + Node.js)  
**Submission deadline:** End of day **Tuesday 14 April 2026**  
**Interview:** **Thursday 16 April 2026** — 20–30 min code walkthrough + behavioural questions  
**Repo:** `weathered` on GitHub (invite `pobmail@gmail.com` if private)

---

## 1. Assignment Recap

Build a small full-stack app that consumes a public weather API and displays current conditions for a user-specified city.

**Hard requirements from the brief:**

- Frontend: React with Functional Components + Hooks
- Strictly typed TypeScript — **no `any`**, clear interfaces
- Modern CSS framework (Tailwind / shadcn / MUI / Styled Components)
- Backend: Node.js service acting as a **proxy or orchestrator**
- Basic error handling and loading states ("production-ready" mindset)
- Handle empty searches and API errors gracefully
- GitHub repo with README (run instructions + tech choices + assumptions)
- Must be able to **audit, verify, and explain every line** (AI use is allowed and encouraged)

**Evaluation rubric (NSW PSC Capabilities):**
| Capability | Level | What it means for us |
|---|---|---|
| Technology | Adept | Strict TS, React state management, modern tooling |
| Deliver Results | Intermediate | Error handling, loading states, production-ready feel |
| Think and Solve Problems | Intermediate | Edge cases (empty input, API errors, "not found") |
| Communicate Effectively | Intermediate | Clear explanation of decisions and code during walkthrough |

---

## 2. Solution Overview

**App name:** Weathered
**Core flow:**

1. User types a city name into a search bar.
2. Frontend calls our Node/Express backend (`/api/weather?city=...`).
3. Backend validates input → geocodes the city → fetches current weather → returns a normalized DTO.
4. Frontend renders current conditions with proper loading / error / empty / "not found" states.
5. Search is reflected in the URL (`?city=Sydney`) so it's shareable and survives refresh.

**Stretch goals** (only if Day 3 finishes early):

- Leaflet map pinned at the resolved lat/lon — directly addresses the JD's "GIS exposure" signal
- 7-day forecast strip

---

## 3. Architecture

```
┌──────────────┐    HTTP/JSON    ┌────────────────┐    HTTPS    ┌──────────────┐
│   Browser    │ ───────────────▶│  Express API   │ ──────────▶│  Open-Meteo  │
│  (React 19)  │ ◀─────────────── │  (Node 24)     │ ◀────────── │  (free, no   │
└──────────────┘                  └────────────────┘             │   API key)   │
     Vite 8                        - Input validation            └──────────────┘
     Tailwind v4                   - Geocode → Forecast
     shadcn/ui                     - Normalization
     TanStack Query                - Error mapping
     RHF + Zod 4                   - In-memory LRU cache
                                   - Rate limiting
                                   - Structured logging
```

**Why a backend proxy (the brief asks for this)?**

- Hides upstream API details; we can swap Open-Meteo for OpenWeatherMap without touching the frontend
- Centralizes error handling and response normalization
- Adds caching and rate limiting in one place
- In a real system, it's where you'd add auth, secrets, and observability
- Frontend never leaks keys (Open-Meteo doesn't need one, but it's the correct pattern for when it does)

---

## 4. Tech Stack (April 2026, current stable)

| Layer           | Choice                          | Version            | Why                                                                 |
| --------------- | ------------------------------- | ------------------ | ------------------------------------------------------------------- |
| Runtime         | **Node.js**                     | 24 LTS             | Current Active LTS                                                  |
| Language        | **TypeScript**                  | 6.0                | Latest stable; strict defaults                                      |
| Package manager | **pnpm**                        | latest             | Workspace support, fast, disk-efficient                             |
| Monorepo layout | **pnpm workspaces**             | —                  | Simple, no extra tooling                                            |
| Weather API     | **Open-Meteo**                  | —                  | Free, no API key, geocoding + forecast endpoints                    |
| **Frontend**    |                                 |                    |                                                                     |
| Framework       | **React**                       | 19.2               | Actions, `use()`, Server Components mature                          |
| Compiler        | **React Compiler**              | v1.0               | Auto-memoization — no manual `useMemo`/`useCallback`                |
| Build tool      | **Vite**                        | 8                  | Rolldown bundler, 10–30× faster                                     |
| Styling         | **Tailwind CSS**                | 4.2                | CSS-first `@theme` config, default engine                           |
| Components      | **shadcn/ui**                   | Tailwind v4-native | Explicitly named in the JD                                          |
| Data fetching   | **TanStack Query**              | v5                 | Production-ready caching/retries/states                             |
| Forms           | **React Hook Form**             | v7                 | Standard, composable                                                |
| Validation      | **Zod**                         | 4                  | Shared schemas FE/BE                                                |
| Routing         | **None** (single page)          | —                  | Not needed for this scope                                           |
| **Backend**     |                                 |                    |                                                                     |
| Framework       | **Express**                     | 5                  | Stable since Apr 2025; async error handling; universally understood |
| Validation      | **Zod 4**                       | —                  | Same schemas as frontend via `packages/shared`                      |
| HTTP client     | **native fetch**                | —                  | Built into Node 24                                                  |
| Logging         | **pino**                        | latest             | Structured, fast, request IDs                                       |
| Rate limit      | **express-rate-limit**          | latest             | Simple, well-known                                                  |
| Cache           | **lru-cache**                   | latest             | In-memory, 5 min TTL                                                |
| **Testing**     |                                 |                    |                                                                     |
| Test runner     | **Vitest**                      | 4.1                | Vite 8 compatible, fast                                             |
| React tests     | **React Testing Library**       | latest             | Role/label queries                                                  |
| API tests       | **Supertest**                   | latest             | Standard for Express                                                |
| **Tooling**     |                                 |                    |                                                                     |
| Lint            | **ESLint**                      | latest             | Typescript-eslint preset                                            |
| Format          | **Prettier**                    | latest             | Zero-config                                                         |
| CI              | **GitHub Actions**              | —                  | Lint + typecheck + test on push                                     |
| Container       | **Docker** + **docker-compose** | —                  | One-command run for reviewers                                       |

**Key deltas from older stacks (for talking points):**

- React 18 → **19.2** (+ Compiler v1)
- Node 20 → **24 LTS**
- TypeScript 5 → **6.0**
- Vite 5/6 → **8** (Rolldown)
- Tailwind 3 → **4.2** (CSS-first)
- Express 4 → **5** (async-first)
- Zod 3 → **4**
- Vitest 1/2 → **4.1**

---

## 5. Repository Layout

```
weathered/
├── .github/
│   └── workflows/
│       └── ci.yml                    # lint + typecheck + test
├── .nvmrc                            # 24
├── .gitignore
├── .env.example
├── package.json                      # pnpm workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json                # shared strict TS config
├── README.md                         # evaluated directly — see §11
├── docker-compose.yml                # one-command run
│
├── packages/
│   └── shared/                       # shared Zod schemas + types
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           └── schemas/
│               ├── weather.ts        # WeatherQuery, WeatherResponse, ErrorResponse
│               └── index.ts
│
├── apps/
│   ├── backend/                       # Express 5 backend
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── Dockerfile
│   │   ├── .env.example
│   │   └── src/
│   │       ├── index.ts              # app bootstrap
│   │       ├── server.ts             # express app factory (testable)
│   │       ├── config.ts             # env parsing with Zod
│   │       ├── logger.ts             # pino
│   │       ├── middleware/
│   │       │   ├── error-handler.ts
│   │       │   ├── request-id.ts
│   │       │   └── rate-limit.ts
│   │       ├── routes/
│   │       │   ├── health.ts         # GET /api/health
│   │       │   └── weather.ts        # GET /api/weather
│   │       ├── services/
│   │       │   ├── open-meteo.ts     # geocode + forecast clients
│   │       │   └── weather.service.ts # orchestration
│   │       ├── cache/
│   │       │   └── lru.ts
│   │       ├── errors/
│   │       │   └── app-error.ts      # typed error classes
│   │       └── __tests__/
│   │           ├── weather.route.test.ts
│   │           └── weather.service.test.ts
│   │
│   └── frontend/                      # React 19 frontend
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html
│       ├── Dockerfile
│       ├── .env.example
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── app.css               # Tailwind v4 @theme config
│           ├── lib/
│           │   ├── api-client.ts     # fetch wrapper, typed
│           │   ├── query-client.ts   # TanStack Query setup
│           │   └── cn.ts             # clsx + tailwind-merge
│           ├── components/
│           │   ├── ui/               # shadcn/ui generated components
│           │   ├── SearchBar.tsx
│           │   ├── WeatherCard.tsx
│           │   ├── LoadingSkeleton.tsx
│           │   ├── ErrorState.tsx
│           │   ├── EmptyState.tsx
│           │   └── ErrorBoundary.tsx
│           ├── hooks/
│           │   └── useWeather.ts     # TanStack Query hook
│           ├── schemas/
│           │   └── search-form.ts    # RHF + Zod
│           └── __tests__/
│               ├── SearchBar.test.tsx
│               └── WeatherCard.test.tsx
```

---

## 6. Backend Design (Express 5)

### 6.1 Endpoints

| Method | Path                         | Purpose                                             |
| ------ | ---------------------------- | --------------------------------------------------- |
| `GET`  | `/api/health`                | Liveness check — returns `{ status: 'ok', uptime }` |
| `GET`  | `/api/weather?city=<string>` | Orchestrated weather lookup                         |

### 6.2 `/api/weather` flow

1. **Validate query** with Zod (`city`: non-empty string, 1–100 chars, trimmed)
2. **Check cache** — key is normalized (lowercase, trimmed) city name
3. **Geocode**: `GET https://geocoding-api.open-meteo.com/v1/search?name=<city>&count=1`
   - If `results` is empty → throw `CityNotFoundError` → HTTP 404
4. **Fetch forecast**: `GET https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m`
5. **Normalize** the response into our `WeatherResponse` shape
6. **Cache** and return

### 6.3 Response shapes (in `packages/shared`)

```ts
// Success
{
  data: {
    location: { name: string; country: string; latitude: number; longitude: number };
    current: {
      temperature: number;          // °C
      apparentTemperature: number;  // °C
      humidity: number;             // %
      windSpeed: number;            // km/h
      windDirection: number;        // degrees
      weatherCode: number;          // WMO code
      condition: string;            // human-readable mapped from weatherCode
      observedAt: string;           // ISO 8601
    };
  };
}

// Error
{
  error: {
    code: 'VALIDATION_ERROR' | 'CITY_NOT_FOUND' | 'UPSTREAM_ERROR' | 'RATE_LIMITED' | 'INTERNAL_ERROR';
    message: string;
    details?: unknown;
  };
}
```

### 6.4 Error mapping

| Scenario                    | HTTP | Error code         |
| --------------------------- | ---- | ------------------ |
| Empty/invalid `city`        | 400  | `VALIDATION_ERROR` |
| Geocoder returns no results | 404  | `CITY_NOT_FOUND`   |
| Upstream 4xx (other)        | 502  | `UPSTREAM_ERROR`   |
| Upstream 5xx / timeout      | 502  | `UPSTREAM_ERROR`   |
| Rate limit hit              | 429  | `RATE_LIMITED`     |
| Unhandled                   | 500  | `INTERNAL_ERROR`   |

### 6.5 Cross-cutting concerns

- **CORS**: explicit allowlist (`http://localhost:5173` in dev) — never `*`
- **Helmet** for basic security headers
- **Rate limit**: 60 requests/min per IP
- **Request ID** middleware (UUID per request, logged + returned in header)
- **pino logger**: structured JSON logs with request ID
- **Graceful shutdown**: handle `SIGTERM` / `SIGINT`
- **Env validation**: parse `process.env` through a Zod schema at startup; fail fast

---

## 7. Frontend Design (React 19)

### 7.1 Component tree

```
<App>
  <ErrorBoundary>
    <QueryClientProvider>
      <main>
        <Header />
        <SearchBar onSubmit={setCity} />
        <WeatherPanel city={city} />  // branches by query state
      </main>
    </QueryClientProvider>
  </ErrorBoundary>
</App>
```

`WeatherPanel` uses a **discriminated union** on the query state, rendering one of:

- `<EmptyState />` — no city yet (idle)
- `<LoadingSkeleton />` — fetching
- `<ErrorState kind="not-found" | "network" | "unknown" />` — failure branches
- `<WeatherCard data={...} />` — success

### 7.2 Key decisions

- **React 19 Actions** for the form's pending state — avoids hand-rolled `isSubmitting`
- **React Compiler** handles memoization — no `useMemo`/`useCallback` in our source
- **TanStack Query** owns server state. Config: `staleTime: 5min`, `retry: 1`, `refetchOnWindowFocus: false`
- **URL as state**: current city lives in `?city=` via `URLSearchParams` — no router library needed
- **RHF + Zod resolver**: form schema is a subset of the backend schema, imported from `packages/shared`
- **Loading skeleton, not spinner** — feels more production-ready
- **Error boundary** at app root catches render failures
- **Accessibility**: labeled input, `aria-live="polite"` on the result region, full keyboard nav

### 7.3 Tailwind v4 setup

- No `tailwind.config.js`. Theme goes in `app.css`:

  ```css
  @import 'tailwindcss';

  @theme {
    --color-rfs-orange: oklch(0.72 0.18 45);
    --font-sans: 'Inter', system-ui, sans-serif;
  }
  ```

- shadcn/ui CLI initialized against Tailwind v4 → uses OKLCH colors and `data-slot` attributes

---

## 8. Testing Strategy

Not exhaustive — **one meaningful test per critical path**. Goal: show testing discipline without burning day-3 budget.

### 8.1 Backend (Vitest + Supertest)

- `GET /api/weather?city=Sydney` → 200 with valid shape (with mocked Open-Meteo fetch)
- `GET /api/weather?city=Zzzzznotacity` → 404 with `CITY_NOT_FOUND`
- `GET /api/weather?city=` → 400 with `VALIDATION_ERROR`
- `GET /api/weather` (missing param) → 400
- Service unit test: weather code → human-readable condition mapping

**Mocking policy:** mock only the `fetch` to Open-Meteo. Everything internal runs for real.

### 8.2 Frontend (Vitest + React Testing Library)

- `SearchBar` renders, submits with valid input, shows validation error on empty submit
- `WeatherCard` renders all fields from a sample `WeatherResponse`
- `WeatherPanel` renders loading → success flow (with MSW or mocked query client)
- `WeatherPanel` renders "city not found" error state

Queries use `getByRole` / `getByLabelText` — never test IDs.

### 8.3 CI (GitHub Actions)

Single workflow, runs on push + PR to `main`:

1. Setup Node 24 + pnpm
2. `pnpm install --frozen-lockfile`
3. `pnpm lint`
4. `pnpm typecheck` (`tsc --noEmit` across workspaces)
5. `pnpm test`

---

## 9. Security & Production Hygiene (talking points)

Even though this is a small app, drop these in for the "production-ready" signal:

- ✅ Server-side input validation (Zod)
- ✅ CORS allowlist — not `*`
- ✅ Helmet for security headers
- ✅ Rate limiting on `/api/weather`
- ✅ No secrets in code; `.env.example` committed, `.env` gitignored
- ✅ Structured logging with request IDs (debuggable in production)
- ✅ Graceful shutdown handlers
- ✅ Typed errors, no stack traces in responses
- ✅ Dependencies pinned via `pnpm-lock.yaml`
- ✅ Docker images for reproducible runs

---

## 10. Day-by-Day Schedule

> Assumes ~4–6 focused hours per day. Friday 11 Apr through Monday 14 Apr. Buffer day Tue 15. Interview Thu 16.

### Day 1 — Friday 11 April: Foundation & backend happy path

**Morning** ✅

- [x] Create GitHub repo `weathered` (public, SSH clone)
- [x] `.nvmrc` → `24`, `.gitignore`, `README.md` stub
- [x] pnpm workspace init: root `package.json`, `pnpm-workspace.yaml`
- [x] Root `tsconfig.base.json` with strict settings
- [x] ESLint flat config + Prettier at repo root
- [x] Move brief + assignment docs + plan into `docs/`

**Afternoon** (in progress)

- [x] `packages/shared`: Zod 4 schemas (`WeatherQuerySchema`, `WeatherResponseSchema`, `ErrorResponseSchema`) + inferred types
- [x] `apps/backend`: Express 5 + TS 6 setup, `tsx` for dev
- [x] `/api/health` endpoint
- [x] Config loader with Zod env validation (fail-fast)
- [x] pino logger + pino-http request-ID middleware
- [x] CORS (explicit allowlist) + Helmet
- [x] Graceful shutdown on `SIGTERM` / `SIGINT`
- [x] Root `README.md`, `CLAUDE.md`, TSDoc on public exports
- [ ] `services/open-meteo.ts`: geocode + forecast client functions
- [ ] `services/weather.service.ts`: orchestration (geocode → forecast → normalize)
- [ ] `/api/weather` route with Zod query validation
- [ ] Typed error classes + central error handler
- [ ] Manual smoke test: `curl 'http://localhost:3000/api/weather?city=Sydney'`
- [ ] Commit: `chore(scaffold): initialize pnpm monorepo with Express 5 backend health endpoint`

**End-of-day check:** curl returns a correctly shaped weather response for a real city.

#### Detailed checkpoint log

Captures the walkthrough-style checkpoints we followed during Day 1 so future sessions can resume without re-deriving decisions.

| #   | Checkpoint                        | Status | Notes                                                                                                                                      |
| --- | --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Create GitHub repo + clone        | ✅     | Public, SSH clone via `github-trevor` host alias                                                                                           |
| 2   | Toolchain check                   | ✅     | Node v24.12.0, pnpm 10.30.3, git 2.43.0                                                                                                    |
| 3   | `.nvmrc` → `24`                   | ✅     | Picked up by `nvm use`, Vercel, Koyeb                                                                                                      |
| 4   | pnpm workspace scaffold           | ✅     | `pnpm-workspace.yaml` → `apps/*` + `packages/*`; root `package.json` private, recursive scripts, `engines.node >= 24`                      |
| 5   | `tsconfig.base.json`              | ✅     | Strict, `NodeNext`, `noUncheckedIndexedAccess`, `declaration: true` (apps override to `false`)                                             |
| 6   | ESLint 9 flat config + Prettier   | ✅     | `defineConfig` from `eslint/config`, `strictTypeChecked` preset, `projectService: true`; no `.npmrc` (pnpm 10 auto-installs peers already) |
| 7   | `packages/shared` Zod schemas     | ✅     | `import * as z from 'zod'` (Zod 4 docs style); exports `./src/index.ts` directly — no build step for shared                                |
| 8a  | Backend dependencies installed    | ✅     | express, cors, helmet, pino, pino-http, express-rate-limit, lru-cache, zod (+ dev: tsx, pino-pretty, @types/\*, typescript)                |
| 8b  | `apps/backend/package.json`       | ✅     | `@weathered/backend`, ESM, `tsx watch --env-file=.env` (Node 24 native env loading)                                                        |
| 8c  | `apps/backend/tsconfig.json`      | ✅     | Extends base; **override `declaration: false`** before first `tsc` build                                                                   |
| 8d  | `.env.example` + `.env`           | ✅     | `NODE_ENV`, `PORT`, `ALLOWED_ORIGIN`, `LOG_LEVEL`                                                                                          |
| 8e  | `config.ts` with Zod env schema   | ✅     | Use `z.url()` for `ALLOWED_ORIGIN` (not deprecated `z.string().url()`)                                                                     |
| 8f  | `logger.ts` (pino + pino-pretty)  | ✅     | Pretty transport in dev only                                                                                                               |
| 8g  | `server.ts` app factory           | ✅     | `createServer(): Express` explicit return type; middleware order: helmet → cors → json → pinoHttp → routes                                 |
| 8h  | `routes/health.ts`                | ✅     | `healthRouter: Router` explicit annotation to satisfy `strictTypeChecked` on `app.use(path, router)`                                       |
| 8i  | `index.ts` entrypoint             | ✅     | Structured log `logger.info({ port }, 'Server listening')`; graceful shutdown on `SIGTERM`/`SIGINT`                                        |
| 8j  | Smoke test `/api/health`          | ✅     | Returns 200 + `x-request-id` header                                                                                                        |
| 9   | `/api/weather` route (Open-Meteo) | ⏳     | Next                                                                                                                                       |

#### Lessons learned (Day 1)

- **Zod 4:** `z.string().url()` rejects localhost; use the top-level `z.url()` instead. Parse errors via `z.treeifyError(error)`.
- **Express 5 + `strictTypeChecked`:** `app.use(path, router)` triggers `no-unsafe-argument` unless the router is explicitly annotated as `Router`. Same applies to `createServer(): Express`.
- **Template literals with numbers:** `restrict-template-expressions` flags `${port}`. Either wrap in `String(port)` or (better) use structured pino logging: `logger.info({ port }, 'msg')`.
- **Env loading:** Node 24's native `--env-file=.env` flag eliminates the need for `dotenv`.
- **Root `package.json` needs `"type": "module"`** to silence ESLint's module-type warning on `eslint.config.js`.
- **pnpm monorepo declarations:** `declaration: true` at the base tsconfig level causes portability errors when apps import from `node_modules`. Apps override with `declaration: false`; only `packages/shared` needs declarations.
- **`pino-http` + lint:** its return type confuses `no-unsafe-argument`. Narrow via an explicit `RequestHandler` annotation rather than suppressing the rule.

### Day 2 — Saturday 12 April: Frontend core

**Morning**

- [ ] `apps/frontend`: Vite 8 + React 19 + TS 6 scaffold
- [ ] Tailwind v4 install + `app.css` with `@theme`
- [ ] shadcn/ui init; generate `button`, `input`, `card`, `skeleton`, `alert`
- [ ] Import shared types from `packages/shared`
- [ ] `lib/api-client.ts`: typed fetch wrapper returning `Result<T, ApiError>`
- [ ] `lib/query-client.ts`: TanStack Query setup
- [ ] `hooks/useWeather.ts`

**Afternoon**

- [ ] `SearchBar` with RHF + Zod resolver + React 19 Action for pending state
- [ ] `WeatherCard` component — displays all fields
- [ ] `LoadingSkeleton`, `ErrorState`, `EmptyState` components
- [ ] `WeatherPanel` with discriminated union state branching
- [ ] URL sync: read/write `?city=` on mount and on submit
- [ ] App-root `ErrorBoundary`
- [ ] Basic layout, header, RFS-inspired color in Tailwind theme
- [ ] ~~Dark mode toggle~~ → moved to Day 4 (leave for last)

**End-of-day check:** typing "Sydney" in the browser shows weather end-to-end. Refreshing the page preserves the search.

### Day 3 — Sunday 13 April: Hardening, tests, stretch

**Morning — hardening**

- [ ] Backend: in-memory LRU cache (5 min TTL)
- [ ] Backend: `express-rate-limit` on `/api/weather`
- [ ] Backend: verify error mapping for all failure modes (empty, not found, upstream 500, timeout)
- [ ] Frontend: polish all four states (empty, loading, error variants, success)
- [ ] Frontend: verify accessibility (tab nav, aria-live, labels)

**Afternoon — tests + CI**

- [ ] Backend tests (Vitest + Supertest): 4 cases from §8.1
- [ ] Frontend tests (Vitest + RTL): 4 cases from §8.2
- [ ] GitHub Actions CI workflow
- [ ] Push, verify green build

**Evening — stretch (only if on schedule)**

- [ ] Leaflet map component showing resolved city location (GIS signal)
- [ ] 7-day forecast strip (extra Open-Meteo params)
- [ ] °C/°F toggle (cheap polish)

**End-of-day check:** CI green. App feels polished. Stretch items land or are cut cleanly.

### Day 4 — Monday 14 April: Polish, README, submit

**Morning — README (this is evaluated directly — spend real time here)**

- [ ] Screenshot or short GIF of the app
- [ ] Overview + architecture diagram (ASCII is fine)
- [ ] Tech stack table with **rationale** for each choice
- [ ] Prerequisites (Node 24, pnpm)
- [ ] Run instructions — both `pnpm` and `docker compose up`
- [ ] Env vars (reference `.env.example`)
- [ ] Project structure
- [ ] Design decisions & assumptions
- [ ] Trade-offs and "what I'd do next with more time"
- [ ] How to run tests

**Afternoon — polish, dark mode, deployment (in this order)**

- [x] `Dockerfile` for `apps/backend` and `apps/frontend` ✅
- [x] `docker-compose.yml` — one-command run ✅
- [x] Sweep: remove dead code, TODOs, `console.log`s, unused imports ✅
- [x] Verify no `any` anywhere (`grep -rn "any" apps packages --include="*.ts"`) ✅
- [ ] **Dark mode toggle** (shadcn pattern, ~30 min)
- [ ] **Deploy backend to Koyeb** (see §18)
- [ ] **Deploy frontend to Vercel** (see §18)
- [ ] Wire CORS between deployed instances, smoke test live URLs
- [ ] Add "Live demo" section + live URLs to README
- [ ] Take README screenshot from the deployed app
- [ ] Final commit history review — messages should read cleanly
- [ ] Verify CI still green on final commit

#### Dockerization checkpoint log (completed 2026-04-13)

| #   | Step                                                | Status | Notes                                                                                                                                                            |
| --- | --------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | `.dockerignore` at repo root                        | ✅     | Excludes `node_modules`, `.git`, real `.env`, `dist`. Keeps `.env.example` and `.env.test`.                                                                       |
| D2  | `apps/backend/Dockerfile` multi-stage               | ✅     | Builder: pnpm install → `pnpm -r build` → `pnpm deploy --filter=@weathered/backend --prod /app/deploy`. Runner: `node:24-alpine`, single COPY, `USER node`, `node dist/index.js`. |
| D3  | `apps/frontend/Dockerfile` multi-stage              | ✅     | Builder: same pattern, ends at `pnpm -r build` (Vite emits to `dist/`). Runner: `nginx:alpine`, copies `dist` to docroot, replaces `default.conf`.                 |
| D4  | `apps/frontend/nginx.conf`                          | ✅     | `proxy_pass http://backend:3000` (Compose service-name DNS) + `try_files ... /index.html` SPA fallback.                                                           |
| D5  | `docker-compose.yml`                                | ✅     | Backend with healthcheck, frontend `depends_on: { backend: { condition: service_healthy } }`. Same-origin via nginx proxy — no CORS preflight in the prod path.   |
| D6  | `.npmrc` with `force-legacy-deploy=true`            | ✅     | Required by pnpm 10's new `pnpm deploy` default. Legacy mode preserves dev hot reload via symlinks.                                                                |
| D7  | `packages/shared` build step                        | ✅     | `tsc` emits `dist/index.js` + `dist/index.d.ts`. `package.json` adds `files: ["dist"]` (overrides `.gitignore` for `pnpm deploy`) and `exports` points at `./dist/index.js`. |
| D8  | Root `dev` script chains build + parallel watch    | ✅     | `pnpm -r build && pnpm -r --parallel dev` — synchronous build once so `tsx watch` and `vite` find `dist/index.js` on first start. Subsequent shared edits hot-reload via `tsc --watch`. |
| D9  | `docker compose up` end-to-end smoke test           | ✅     | All 11 verification steps from the Docker plan passed. Frontend on `:80`, backend direct on `:3000`, health/weather/not-found/validation/rate-limit all green.    |

#### Lessons learned (Dockerization)

- **`COPY a b c /dest/`** flattens all sources into `/dest`, destroying workspace structure. Use one COPY per top-level directory.
- **`tsconfig.base.json` must be COPYed** — per-package tsconfigs extend `../../tsconfig.base.json`. Forgetting it makes `tsc` exit with `TS5083`.
- **Node 24 type stripping is disabled under `node_modules`** (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`). The "no build step for shared" trick works in dev (via tsx fallback) but is permanently closed for production containers. Shared must compile to dist.
- **`pnpm deploy` file inclusion priority:** `files` field → `.npmignore` → `.gitignore` → everything. Without `files: ["dist"]`, `dist/` is excluded by gitignore and the deploy ships an empty package.
- **`pnpm deploy` flattens** — output at `/app/deploy` has no `apps/backend/` prefix; the CMD path is just `dist/index.js`.
- **pnpm 10's `pnpm deploy` requires `inject-workspace-packages=true` by default**, which kills dev hot reload (every shared edit needs a `pnpm install` to re-copy). `force-legacy-deploy=true` in `.npmrc` reverts to the symlink-friendly behaviour.

#### Dead-code sweep notes (2026-04-13)

- **No `any` anywhere** — `strictTypeChecked` ESLint preset has held throughout. Verified with grep.
- **No TODO / FIXME / HACK / XXX comments** in committed code.
- **No skipped tests** (`it.skip`, `xit`, `.only`).
- **Two intentional `console.error` calls** survive the sweep, both with explanatory why-comments:
  - [`config.ts`](../apps/backend/src/config.ts) line 17 — runs **before** pino is initialised (pino reads from `config.ts`, so config can't log via pino during its own startup error).
  - [`ErrorBoundary.tsx`](../apps/frontend/src/components/ErrorBoundary.tsx) line 28 — frontend has no pino; `console.error` in `componentDidCatch` is React's standard error-boundary reporting pattern.
- One commented-out boundary test (`// if (city === 'throw error') throw new Error('boundary test')`) removed from `App.tsx`.

**Evening — rehearsal & submit**

- [ ] First full walkthrough rehearsal, out loud, timed (target 20–25 min)
- [ ] Note any rough spots, fix or prepare explanation
- [ ] **SUBMIT**: email/portal the GitHub link by end of day

### Day 5 — Tuesday 15 April: Buffer & interview prep (NO code)

- [ ] Re-read README end to end as if you'd never seen it
- [ ] Read through every source file once
- [ ] Second walkthrough rehearsal
- [ ] Prepare answers to likely questions (see §13)
- [ ] Prepare behavioural question answers mapped to Focus Capabilities
- [ ] Prepare 2–3 thoughtful questions to ask the panel
- [ ] Early night

### Day 6 — Thursday 16 April: Interview day

- [ ] Pull repo fresh locally — verify it still runs
- [ ] Screen-share tested before the call
- [ ] Water, notes, calm
- [ ] Walkthrough → behavioural → your questions

---

## 11. README Structure (evaluated directly)

```markdown
# Weathered

Small full-stack weather app built for the NSW Rural Fire Service Junior Full Stack Developer technical assignment.

![screenshot](./docs/screenshot.png)

## Overview

One-paragraph description. What it does, what it uses.

## Architecture

ASCII diagram. Request lifecycle in 3 sentences.

## Tech Stack

Table with **why** for each choice.

## Prerequisites

- Node.js 24 LTS
- pnpm 9+
- (optional) Docker + Docker Compose

## Running Locally

### Option A: pnpm

1. `pnpm install`
2. `cp apps/backend/.env.example apps/backend/.env`
3. `pnpm dev` (runs api + web concurrently)
4. Open http://localhost:5173

### Option B: Docker

1. `docker compose up`
2. Open http://localhost:5173

## Environment Variables

Reference `.env.example`. Note: Open-Meteo requires no API key.

## Project Structure

Tree + one-line descriptions.

## Design Decisions

- Why a backend proxy
- Why Open-Meteo
- Why Express 5
- Why TanStack Query
- Why Tailwind v4 + shadcn/ui
- Why a pnpm monorepo with `packages/shared`
- Why no routing library

## Assumptions

- Single-user, no auth
- English-only UI
- Metric units only (stretch: toggle)
- 5-minute cache is acceptable for current conditions

## Error Handling

Table of error codes → HTTP status → user-facing message.

## Testing

- `pnpm test` runs all tests
- Backend: Vitest + Supertest
- Frontend: Vitest + RTL

## What I'd Do Next

- Persistence (search history)
- Unit toggle (°C/°F)
- Multiple cities dashboard
- Server-side rendering (Next.js) if SEO mattered
- Observability (OpenTelemetry)
- E2E tests (Playwright)

## AI Usage

Honest disclosure of which parts were AI-assisted and how I verified them.
```

---

## 12. Walkthrough Script (20–30 min)

**Minute 0–2: Context**

- What the app does in one sentence
- Show it running (search "Sydney", show result, show "not found" error, show loading state)

**Minute 2–5: Architecture**

- Open the architecture diagram in the README
- Explain the request lifecycle: browser → Express → Open-Meteo → normalized response → React
- Why a backend proxy (map to the brief's "proxy or orchestrator" wording)

**Minute 5–10: Backend walkthrough**

- Open `services/weather.service.ts` — orchestration logic
- Open `routes/weather.ts` — Zod validation + error mapping
- Show the shared schema in `packages/shared` and point out it's used by both sides
- Mention caching, rate limiting, request IDs, structured logging

**Minute 10–18: Frontend walkthrough**

- `useWeather` hook — TanStack Query config, explain `staleTime` choice
- `SearchBar` — RHF + Zod, React 19 Actions
- `WeatherPanel` — discriminated union state branching (call this out explicitly)
- Tailwind v4 `@theme` in `app.css`
- shadcn/ui component example
- Call out: "No `useMemo` or `useCallback` — React Compiler handles it"

**Minute 18–22: Quality & testing**

- Show one backend test and one frontend test
- Show CI workflow green in GitHub
- Show `tsconfig` strict settings, no `any` anywhere

**Minute 22–27: Reflection**

- What you'd do with more time (pull from README)
- Honest AI disclosure — which parts, how verified

**Minute 27–30: Questions**

---

## 13. Likely Panel Questions (prep answers)

1. **"Walk me through what happens when I type a city and hit search."**
   → Lifecycle answer: RHF validates → `useWeather` hook → `/api/weather` → Zod validates → cache check → Open-Meteo geocode → forecast → normalize → response → TanStack Query updates state → `WeatherPanel` re-renders.

2. **"Why a backend proxy instead of calling Open-Meteo directly from the browser?"**
   → Decoupling, centralizing error handling, caching, rate limiting, keeping keys server-side (not needed here but correct pattern), swappable upstream.

3. **"What parts did AI help you write, and how did you verify them?"**
   → Be honest and specific. E.g., "I used Claude to scaffold the Tailwind v4 config because I hadn't used v4 before; I verified it by reading the Tailwind v4 docs and checking it compiled. I wrote the weather service orchestration myself, then asked Claude to review it for edge cases."

4. **"What would break if Open-Meteo went down?"**
   → Cache serves stale-ish results for 5 min; after that, users see our `UPSTREAM_ERROR` (502) with a friendly message. No cascading failure. In a real system I'd add circuit breaker + stale-while-revalidate.

5. **"How do you handle invalid input?"**
   → Client: RHF + Zod schema rejects empty/too-long before submit. Server: Zod validates query params independently (never trust the client). Both return clear messages.

6. **"Why TypeScript strict mode, and did you actually follow it?"**
   → Catches bugs at compile time, forces thinking about null/undefined. Show `tsconfig.base.json`, show grep for `any` returns nothing.

7. **"Why Express over Fastify or NestJS?"**
   → Scope-appropriate. Express 5 is stable, universally understood, async-first now. NestJS would be overkill for 2 endpoints. Fastify is faster but the panel shouldn't have to learn a framework to review my code.

8. **"How did you decide what to test?"**
   → Happy path + critical error paths for each layer. One integration test per endpoint is worth more than ten unit tests on trivial code.

9. **"If I gave you another week, what would you add?"**
   → Persistence, multi-city dashboard, OpenTelemetry, Playwright E2E, i18n, PWA, unit toggle — pick 2–3 and explain tradeoffs.

10. **"Why React 19 / Tailwind v4 / Vite 8 — aren't these risky for production?"**
    → All stable releases. React 19 shipped late 2024, Tailwind v4 is default now, Vite 8 is stable. Being current reduces future migration debt.

---

## 14. Scope Discipline — Do NOT Build

Explicit anti-scope. Resist unless Day 3 finishes with genuine hours to spare:

- ❌ Authentication / user accounts
- ❌ Database / persistence / search history
- ❌ Multi-city comparison
- ❌ PWA / offline support / service workers
- ❌ Internationalization
- ❌ Server-side rendering
- ❌ Monorepo build orchestration (Turbo, Nx)
- ❌ E2E tests (Playwright)
- ❌ Complex animations
- ❌ Custom design system beyond shadcn/ui defaults
- ❌ Micro-frontends, module federation
- ❌ GraphQL
- ❌ Redis / external cache
- ❌ Kubernetes manifests

A **tight, polished small app** beats a sprawling half-finished one on every rubric line.

---

## 15. Risk Register

| Risk                                                | Mitigation                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| Open-Meteo down during demo                         | Cache + clear error state; have a screenshot backup                      |
| Tailwind v4 quirk burns half a day                  | Fall back to Tailwind v3 if stuck for >1 hour                            |
| shadcn/ui CLI compat issue                          | Manually copy components from their docs                                 |
| React 19 Actions unfamiliar                         | Fall back to `useTransition` if needed                                   |
| Scope creep into stretch goals before core is solid | Hard gate: no stretch until Day 3 afternoon, and only if all checks pass |
| Test setup rabbit hole                              | Cap tests at 8 total; one-per-path, not exhaustive                       |
| Day 4 crunch                                        | Protect Day 4 morning for README — it's evaluated directly               |
| Live demo fails during walkthrough                  | Have a local backup recording + screenshots                              |

---

## 16. Definition of Done

Before submitting on Day 4, all of these must be true:

- [x] App runs with `pnpm dev` from a clean `pnpm install` ✅
- [x] App runs with `docker compose up` ✅
- [x] Searching "Sydney" shows current weather ✅
- [x] Searching "Zzznotreal" shows a clear "city not found" state ✅
- [x] Empty search is blocked client-side with a validation message ✅
- [x] Loading skeleton appears during fetch ✅
- [x] URL updates with `?city=` and page reload preserves the search ✅
- [x] `pnpm typecheck` passes with zero errors ✅
- [x] `pnpm lint` passes with zero errors ✅
- [x] `pnpm test` passes with zero failures ✅
- [x] GitHub Actions CI is green on the latest commit ✅
- [ ] `grep -rn "any" apps packages --include="*.ts"` returns nothing meaningful
- [ ] README has every section from §11
- [ ] `.env.example` committed; no real `.env` committed
- [ ] No `console.log` debugging statements
- [ ] Commit history is clean and readable
- [ ] Repo is **public** on GitHub
- [ ] Dark mode toggle works
- [ ] Frontend deployed to Vercel, live URL in README
- [ ] Backend deployed to Koyeb, `/api/health` responds
- [ ] Live end-to-end search works against deployed URLs
- [ ] One full walkthrough rehearsal completed

---

## 17. Confirmed Decisions

- ✅ **Repo visibility:** Public
- ✅ **Dark mode:** Include — scheduled last (Day 4 afternoon, after core polish)
- ✅ **Leaflet map:** Optional stretch only — Day 3 evening if strictly on track
- ✅ **README media:** Static screenshot (not animated GIF)
- ✅ **Deployment:** Yes — **Vercel (frontend) + Koyeb (backend)** — scheduled last (Day 4 afternoon)

---

## 18. Deployment Plan

### Why Vercel + Koyeb

Researched April 2026 options for a low-traffic demo where **cold starts during the live walkthrough would be the worst possible outcome**.

**Frontend → Vercel**

- Free Hobby tier, trivial git-based deploy for Vite apps
- Custom domain, edge CDN, automatic HTTPS
- Zero cold-start concern (it's static assets)

**Backend → Koyeb** (recommended over Render/Fly/Railway/Cloudflare)

| Option considered  | Verdict                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Koyeb** ✅       | Free "nano" web service stays **always-on** (no forced sleep), deploys from git, real Docker/Express runtime, 512 MB RAM, custom domain. **Best fit.** |
| Render             | Free tier spins down after 15 min idle, up to **~30 s cold start** — exactly the embarrassment we want to avoid during the demo.                       |
| Railway            | No real permanent free tier in 2026 (trial credit only).                                                                                               |
| Fly.io             | Free allowances removed Oct 2024 for new users.                                                                                                        |
| Cloudflare Workers | Zero cold starts, but would require rewriting Express as a Workers handler — breaks the "real Node.js service" story the brief asks for.               |
| Vercel (backend)   | Serverless-only; would require abandoning Express-as-server. Warm instance ("Scale to One") is Pro-only.                                               |

**Recommendation: Koyeb for backend** — it lets us keep Express 5 as Express 5 (matching the brief's "Node.js service" wording), stays warm on the free tier, and deploys from a Dockerfile directly from the GitHub repo. The panel clicks the link, it responds instantly, story stays coherent.

### Deployment steps (Day 4 afternoon, ~45–60 min total)

1. **Backend on Koyeb**
   - Sign up, connect GitHub
   - Create a new web service pointing at `apps/backend/Dockerfile`
   - Set env vars (port, allowed origin)
   - Note the public URL (e.g. `weathered-api.koyeb.app`)
   - Smoke test: `curl https://<url>/api/health`

2. **Frontend on Vercel**
   - Import the GitHub repo into Vercel
   - Set root directory to `apps/frontend`, framework preset to Vite
   - Set env var `VITE_API_BASE_URL=https://<koyeb-url>`
   - Deploy, note the URL (e.g. `weathered.vercel.app`)

3. **Wire up CORS**
   - Update backend `ALLOWED_ORIGIN` env var on Koyeb to the Vercel URL
   - Redeploy backend
   - End-to-end smoke test from the live frontend

4. **Update README**
   - Add "Live demo" section at the top with both URLs
   - Add the screenshot

### Risk mitigation

- If Koyeb signup/deploy hits any friction → **fall back to Render** and accept the cold start; mention it in the walkthrough as "I'd warm it with a cron ping in production"
- If Vercel build fails on Vite 8 → check for Rolldown-related issues; fall back to Netlify if needed
- **Do not attempt deployment before core app is done and tested locally.** Deployment is polish, not scope.
