# Middleware

Cross-cutting Express middleware. Currently houses the central error handler; request-ID and CORS are configured inline in [`server.ts`](../server.ts).

See [`apps/backend/CLAUDE.md`](../../CLAUDE.md) for app-level middleware order.

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
