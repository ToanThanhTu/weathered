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

## ESLint notes

- `pino-http`'s return type confuses `no-unsafe-argument`. Narrow via an explicit `RequestHandler` annotation rather than suppressing the rule.
- `app.use(path, router)` triggers `no-unsafe-argument` unless the router is explicitly annotated as `Router` at its declaration site. Same for `createServer(): Express`.
- `restrict-template-expressions` flags `${number}` in template literals. Either wrap in `String(port)` or — preferred — use structured pino logging: `logger.info({ port }, 'msg')`.
