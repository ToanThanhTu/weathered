# @weathered/backend

Express 5 API that proxies Open-Meteo, validates input with Zod, and returns normalized weather data to the frontend.

See [`CLAUDE.md`](./CLAUDE.md) for conventions and per-layer rules, and the root [`README.md`](../../README.md) for workspace-level setup.

## Stack

- **Node.js 24** — native `--env-file` flag (no `dotenv`), native `fetch`
- **Express 5** — async error propagation (no `try`/`catch` in handlers)
- **TypeScript 6** — strict, `NodeNext` module resolution
- **Zod 4** — env validation + request validation + upstream response validation
- **pino** + **pino-http** — structured JSON logging with per-request IDs
- **helmet** — security headers
- **express-rate-limit** — per-IP throttling on `/api/weather`
- **lru-cache** — bounded memory cache with 5-min TTL

## Getting started

From the repo root:

```sh
pnpm install
cp apps/backend/.env.example apps/backend/.env
pnpm --filter @weathered/backend dev
```

Dev server runs on `http://localhost:3000` via `tsx watch` with Node 24's `--env-file=.env` flag.

## Environment variables

| Variable         | Required | Default           | Description                                         |
| ---------------- | -------- | ----------------- | --------------------------------------------------- |
| `NODE_ENV`       | no       | `development`     | `development` \| `production` \| `test`             |
| `PORT`           | no       | `3000`            | HTTP listen port                                    |
| `ALLOWED_ORIGIN` | **yes**  | —                 | Frontend origin for CORS allowlist                  |
| `LOG_LEVEL`      | no       | `info`            | pino level (`fatal` → `trace`)                      |

Validated at startup via Zod — missing or invalid values cause immediate `process.exit(1)`.

## Scripts

| Script           | Description                                              |
| ---------------- | -------------------------------------------------------- |
| `pnpm dev`       | `tsx watch` with native env-file loading                 |
| `pnpm build`     | `tsc` to `dist/`                                         |
| `pnpm start`     | `node dist/index.js` with native env-file loading        |
| `pnpm typecheck` | `tsc --noEmit`                                           |
| `pnpm lint`      | `eslint src`                                             |
| `pnpm test`      | `vitest` (Supertest integration tests — pending Day 3)   |

## HTTP API

| Method | Path                           | Description                                                         |
| ------ | ------------------------------ | ------------------------------------------------------------------- |
| `GET`  | `/api/health`                  | Liveness probe — `{ status, uptime, timestamp }`                    |
| `GET`  | `/api/weather?city=<string>`   | Geocode + forecast + normalize. Cached for 5 minutes per city name. |

Rate limit: 60 requests per minute per IP on `/api/weather`. `/api/health` is unlimited for infrastructure checks.

### Error envelope

All failures return a uniform `ErrorResponse`:

```json
{
  "error": {
    "code": "CITY_NOT_FOUND",
    "message": "City Xyzzy not found.",
    "details": null
  }
}
```

| HTTP | `code`             | When                                                 |
| ---- | ------------------ | ---------------------------------------------------- |
| 400  | `VALIDATION_ERROR` | Query failed `WeatherQuerySchema.safeParse`          |
| 404  | `CITY_NOT_FOUND`   | Open-Meteo geocoder returned no results              |
| 429  | `RATE_LIMITED`     | IP exceeded `express-rate-limit` window              |
| 502  | `UPSTREAM_ERROR`   | Non-2xx, timeout, network error, or bad schema       |
| 500  | `INTERNAL_ERROR`   | Unhandled exception (no internal detail leaked)      |

## Project structure

```
src/
├── index.ts          # entrypoint — listen, graceful shutdown, Happy Eyeballs fix
├── server.ts         # createServer() app factory
├── config.ts         # Zod-validated env
├── logger.ts         # pino instance
├── routes/           # HTTP adapters (→ CLAUDE.md)
├── cache/            # generic cached() HOF + per-domain instances (→ CLAUDE.md)
├── services/         # orchestration + upstream clients (→ CLAUDE.md)
├── errors/           # AppError hierarchy (→ CLAUDE.md)
└── middleware/       # error handler + rate limiter (→ CLAUDE.md)
```

Dependency direction is one-way: **`routes → cache → services → upstream clients`**.
