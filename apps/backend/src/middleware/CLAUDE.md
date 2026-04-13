# Middleware

Cross-cutting Express middleware. Houses the central error handler and the weather rate limiter; request-ID and CORS are configured inline in [`server.ts`](../server.ts).

See [`apps/backend/CLAUDE.md`](../../CLAUDE.md) for app-level middleware order.

## Files

| File                | Purpose                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| `error-handler.ts`  | Central `AppError → ErrorResponse` translator. Must be last.           |
| `rate-limit.ts`     | Per-IP `express-rate-limit` instance scoped to `/api/weather`.         |

## Rate limiter

[`rate-limit.ts`](rate-limit.ts) exports `weatherRateLimiter`, a `RequestHandler` built from `express-rate-limit`. Mounted at `/api/weather` in [`server.ts`](../server.ts) **before** the weather router so it runs on every request to that path.

### Rules

- **Path-scoped, not global.** Register with `app.use('/api/weather', weatherRateLimiter)`, not `app.use(weatherRateLimiter)`. `/api/health` must stay unlimited so load balancers, uptime monitors, and Koyeb's own probes never trip the limiter.
- **Window + limit.** 60 requests per minute per IP. Tunable in one place via the `windowMs` / `limit` fields. Back-of-napkin: ~10× headroom over the fastest human search rate; a script in a loop burns through it in ~1 second and gets blocked.
- **`standardHeaders: 'draft-8'`.** Current IETF draft supported by `express-rate-limit` 8.x. Emits the single combined `RateLimit` header with the new structured-field syntax. Neither draft-7 nor draft-8 is an RFC — prefer draft-8 as the library's most recent supported value.
- **`legacyHeaders: false`.** Don't emit the old `X-RateLimit-*` headers. Noise.
- **Response shape matches `ErrorResponse`.** The `message` option is the body served on limit hit; keep it shaped as `{ error: { code: 'RATE_LIMITED', message } }` so clients can handle it uniformly with other errors.
- **No dynamic key.** Default keyer is `req.ip`. If we ever add authentication, key by user ID for authenticated requests to avoid shared-NAT penalties — not by IP alone.

### What it does not do

- No distributed store. Counters live in-memory per instance — two backend replicas would have independent counters. Acceptable for single-instance deployments; swap for `rate-limit-redis` if we scale out.
- No retry-after logic, no adaptive throttling. Fixed window, fixed limit.

## Error handler

[`error-handler.ts`](error-handler.ts) is the **only** place in the backend that translates errors into HTTP responses. Everything else throws.

### Rules

- **Must be registered last** in [`server.ts`](../server.ts), after all route routers. Express error middleware only catches errors from handlers registered earlier.
- **Four-argument signature** — `(err, req, res, next)`. Express distinguishes error middleware from normal middleware by arity. Typing via `ErrorRequestHandler` from `express` is mandatory — the wrong parameter count silently registers it as a regular middleware that never fires on errors.
- **Unused `next` prefixed with `_`** — `(err, req, res, _next)` — to satisfy the linter without suppressing it.
- **Log via `req.log.error`**, not the module-level logger. `pino-http` attaches a request-scoped child logger that carries the request ID automatically:

  ```ts
  req.log.error({ err }, 'Request failed')
  ```

- **Branch on `instanceof AppError`.** Known errors pass their `statusCode` / `code` / `message` / `details` through to the `ErrorResponse` envelope. Unknown errors become a generic 500:

  ```ts
  { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }
  ```

  **Do not leak** `err.message`, `err.stack`, or any internal detail on the unknown-error branch. Stack traces, file paths, and implementation details must not reach clients.

- **Return after sending.** Either `return res.status(...).json(...)` or send then `return` on a new line. The handler's return type is `void`.

### What it does not do

- No authorization checks, no CORS handling, no rate limiting — those live earlier in the middleware chain, see [`server.ts`](../server.ts).
- No retry logic, no circuit breakers — those would live in the upstream clients, not here.
- No 404 fallback for unmatched routes. If we add one later it goes as a separate middleware registered just before the error handler, not inside it.
