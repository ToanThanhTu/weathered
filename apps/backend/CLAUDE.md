# Backend conventions

App-level guidance for `apps/backend`. See the root [`CLAUDE.md`](../../CLAUDE.md) for project-wide rules and the per-layer CLAUDE.md files in each `src/` subfolder for implementation details.

## Layering

```
src/
├── index.ts              # entrypoint — app.listen, graceful shutdown, Happy Eyeballs fix
├── server.ts             # createServer() app factory
├── config.ts             # Zod-validated env; fail-fast on startup
├── logger.ts             # shared pino instance
├── routes/               # thin HTTP adapters  (→ CLAUDE.md)
├── cache/                # generic cached() HOF + per-domain instances (→ CLAUDE.md)
├── services/             # business logic + upstream clients  (→ CLAUDE.md)
├── errors/               # AppError hierarchy  (→ CLAUDE.md)
└── middleware/           # error handler + cross-cutting  (→ CLAUDE.md)
```

Dependency direction is one-way: `routes → cache → services → upstream clients`. Services never import from routes; upstream clients never import from services.

## Files in `src/`

### `index.ts` — entrypoint

- The **only** file that calls `app.listen()`. Everything else is factory-built and testable without a live port.
- Registers `SIGTERM` / `SIGINT` handlers that call `server.close()` before `process.exit(0)`. Required for clean container orchestration (Koyeb, Docker).
- Logs startup and shutdown events with structured fields: `logger.info({ port: config.PORT }, 'Server listening')`.
- Calls `net.setDefaultAutoSelectFamily(false)` at module load to disable Node's Happy Eyeballs. Its 250ms per-address attempt timeout is too short for Open-Meteo's IPv4 endpoint from high-latency locations — TCP handshake doesn't complete before Node gives up. Disabling it reverts to the classic connect path so `AbortSignal.timeout(5000)` in the upstream client becomes the real ceiling. **Do not remove.**

### `server.ts` — app factory

- Exports `createServer(): Express` — a function that returns a configured app **without** calling `listen()`. Enables Supertest integration tests with no port binding.
- Return type annotation (`: Express`) is mandatory under `strictTypeChecked` — otherwise `app.use(path, router)` triggers `no-unsafe-argument` at call sites.
- Middleware registration order, top to bottom:
  1. `helmet()` — security headers
  2. `cors({ origin: config.ALLOWED_ORIGIN })` — explicit allowlist, never `*`
  3. `express.json()` — body parser
  4. `pinoHttp({ genReqId })` — generates or passes through `x-request-id`, attaches `req.log` child logger
  5. `weatherRateLimiter` path-scoped to `/api/weather` — bypasses `/api/health` so infrastructure probes are never throttled
  6. Route routers — `/api/health`, `/api/weather`
  7. `errorHandler` — **must be last**; see [`src/middleware/CLAUDE.md`](src/middleware/CLAUDE.md)
- Adding a new route = add the router in [`routes/`](src/routes/) and register it here **before** the error handler. If the route needs throttling, mount a rate limiter at the same path **before** the route, not inside the handler.

### `config.ts` — env loader

- Parses `process.env` through a Zod schema and exits `1` on failure. Fail-fast at startup, never on first request.
- Schema contents: `NODE_ENV` (enum, default `'development'`), `PORT` (`z.coerce.number()` — env vars are strings), `ALLOWED_ORIGIN` (`z.url()` — not the deprecated `z.string().url()` which rejects localhost), `LOG_LEVEL` (pino level enum).
- Env file is loaded via Node 24's native `--env-file=.env` flag in `package.json` scripts. Do **not** install `dotenv`.
- Errors are pretty-printed with `z.treeifyError(parsed.error)` before exit.
- Exports a single typed `config` object — downstream code imports it, never touches `process.env` directly.

### `logger.ts` — shared pino instance

- Exports a single configured pino logger used for startup, shutdown, and non-request events.
- Uses `pino-pretty` transport **only in development** (gated by `config.NODE_ENV === 'development'`). Production emits raw JSON to stdout so log aggregators can parse it.
- Inside request handlers and middleware, prefer `req.log` — it's a child logger automatically scoped to the request ID by `pino-http`.
- Always structured form: `logger.info({ key: value }, 'message')`. Never string-interpolate data into the message — it breaks JSON parsing.
- Never `console.log` / `console.error` in committed code.

## Testing setup

Tests use Vitest + Supertest and live alongside the code under test (`routes/weather.test.ts` sits beside `routes/weather.ts`).

### `vitest.config.ts`

- `environment: 'node'` — no jsdom; the backend has no browser APIs.
- `globals: false` — forces explicit `import { describe, it, expect } from 'vitest'`.
- `setupFiles: ['./src/test/setup.ts']` — runs **before** any test file is imported, so `config.ts`'s env validation sees the test vars.

### `src/test/setup.ts`

- One line: calls `loadEnvFile()` from `node:process` against `../../.env.test`.
- Must run before `config.ts` is imported. Vitest guarantees setup files run first. **Do not** try to load `.env.test` inline in test files — `createServer()` imports `config.ts` transitively, which validates env at module load.

### `.env.test`

- Committed (contains no secrets).
- `PORT=3001` (not `0`) — `config.ts` schema requires `.positive()`.
- `LOG_LEVEL=fatal` — quietest level the Zod enum accepts. Keeps test output clean.

### Writing backend tests

- **Use Supertest against `createServer()`.** Factory pattern pays off here — each test gets a fresh app instance, no port binding.
- **Mock `fetch` via `vi.stubGlobal('fetch', vi.fn())`.** Reset with `vi.unstubAllGlobals()` in `afterEach`.
- **Queue multiple `mockResolvedValueOnce` calls** when the code under test makes multiple `fetch` calls in sequence (e.g., the happy-path weather flow: geocode then forecast). Plain `mockResolvedValue` would return the same payload to both calls and the second schema parse would fail.
- **Parse success responses with the shared Zod schema** (`WeatherResponseSchema.parse(res.body)`) — doubles as a contract test against `@weathered/shared`.
- **Cast error responses to `ErrorResponse`** — we control both ends of the envelope; a full parse in every test is overkill.
- **Use a different city per test** to avoid the module-scoped LRU cache contaminating state across tests.

## Dockerfile

[`Dockerfile`](Dockerfile) is a multi-stage build:

1. **Builder stage** (`node:24-alpine AS builder`):
   - `npm i -g pnpm`
   - `COPY` workspace root files (`package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig.base.json`, `.npmrc`)
   - `COPY` `packages/shared` and `apps/backend` directories (preserving structure — never flatten them)
   - `RUN pnpm install --frozen-lockfile`
   - `RUN pnpm -r build` — walks the workspace dep graph in topological order, builds `packages/shared` then `apps/backend`
   - `RUN pnpm deploy --filter=@weathered/backend --prod /app/deploy` — produces a self-contained directory with the backend's package.json, dist, and a flattened `node_modules` (including the compiled `@weathered/shared`)

2. **Runner stage** (`node:24-alpine`):
   - `COPY --from=builder /app/deploy ./` — single copy carries everything needed
   - `USER node` — drops to non-root
   - `CMD ["node", "dist/index.js"]` — paths inside `/app/deploy` are flat (the deploy directory has the backend at its root, not nested under `apps/backend/`)

### Why this works

- **`pnpm -r build` order:** pnpm walks dependencies first. `packages/shared` builds before `apps/backend` because backend depends on shared via `workspace:*`.
- **`pnpm deploy` flattens:** the output at `/app/deploy` contains the backend package as if it were a standalone publish — no `apps/backend/` prefix, just `package.json`, `dist/`, `node_modules/` at the root. The runner's CMD path matches.
- **`force-legacy-deploy=true` in `.npmrc`:** required because pnpm 10's default `pnpm deploy` requires `inject-workspace-packages=true` (which would also break dev hot-reload for shared schemas). Legacy mode preserves the old behaviour where workspace deps are copied without injection.
- **Shared package's `files: ["dist"]`:** without it, `pnpm deploy` would fall back to `.gitignore` (which excludes `dist/`) and ship an empty `@weathered/shared` package. The `files` field is the override that makes the compiled output visible to the deploy.

### Common pitfalls (lessons from the build)

- `COPY` with multiple sources flattens them all into the destination. Use separate `COPY` lines for each top-level directory to preserve the workspace structure.
- `tsconfig.base.json` must be COPYed too — the per-package tsconfigs extend it via `../../tsconfig.base.json`. If it's missing, `tsc` exits with `TS5083`.
- `.npmrc` must be COPYed for `force-legacy-deploy` to take effect in the container.
- The CMD path is **`dist/index.js`**, not `apps/backend/dist/index.js` — `pnpm deploy` strips the workspace nesting.

## ESLint notes

- `pino-http`'s return type confuses `no-unsafe-argument`. Narrow via an explicit `RequestHandler` annotation rather than suppressing the rule.
- `app.use(path, router)` triggers `no-unsafe-argument` unless the router is explicitly annotated as `Router` at its declaration site. Same for `createServer(): Express`.
- `restrict-template-expressions` flags `${number}` in template literals. Either wrap in `String(port)` or — preferred — use structured pino logging: `logger.info({ port }, 'msg')`.
