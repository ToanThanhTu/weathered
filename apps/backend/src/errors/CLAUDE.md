# Errors

Typed error hierarchy. Defines the only error classes services and routes should throw.

See [`apps/backend/src/middleware/CLAUDE.md`](../middleware/CLAUDE.md) for how these are converted to HTTP responses.

## Rules

### The `AppError` base

Every expected failure extends [`app-error.ts`](app-error.ts)'s `AppError`, which carries four fields:

| Field        | Type        | Notes                                                       |
| ------------ | ----------- | ----------------------------------------------------------- |
| `statusCode` | `number`    | HTTP status to respond with                                 |
| `code`       | `ErrorCode` | String enum from `@weathered/shared` (`ERROR_CODES.*`)      |
| `message`    | `string`    | Human-readable; safe to surface in the `ErrorResponse`      |
| `details`    | `unknown?`  | Optional — used for validation (`z.treeifyError` output)    |

Use TypeScript parameter properties (`public readonly`) on the base constructor. All four fields are immutable after construction.

### `this.name = new.target.name`

Set `this.name` in the base constructor using `new.target.name`. This:

1. Picks up the subclass name automatically so pino logs show `CityNotFoundError`, not `Error`.
2. Avoids repeating the name in each child constructor.

### Subclasses

Current hierarchy:

| Class                | Status | Code               |
| -------------------- | ------ | ------------------ |
| `ValidationError`    | 400    | `VALIDATION_ERROR` |
| `CityNotFoundError`  | 404    | `CITY_NOT_FOUND`   |
| `UpstreamError`      | 502    | `UPSTREAM_ERROR`   |

`ValidationError` also accepts an optional `details` argument — it's the only subclass that forwards `details` to the base.

### No `RateLimitedError` or `InternalError` classes

- `express-rate-limit` produces its own 429 response; no need to throw.
- Unrecognised errors become a generic 500 `INTERNAL_ERROR` in the central error handler. We never throw an `InternalError` ourselves.

### Never throw anything else

- **Never** `throw new Error(...)` or `throw 'some string'` in service or route code. `@typescript-eslint/only-throw-error` will flag the string case; the plain `Error` case silently becomes a 500 with no typed code.
- **Always** use one of the subclasses above. If you need a new error type, add a subclass here and plumb its code into `ERROR_CODES` in `@weathered/shared`.

### Where errors are thrown

- `ValidationError` — only from route handlers, after `safeParse` fails.
- `CityNotFoundError` — from `services/weather.service.ts` when `geocode()` returns `null`.
- `UpstreamError` — from the `fetchJson` helper inside `services/open-meteo.ts`. Services should not throw it directly; they should let it propagate from the upstream client.
