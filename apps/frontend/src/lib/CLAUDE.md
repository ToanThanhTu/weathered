# Lib

Shared utilities and the API client layer. See [`apps/frontend/CLAUDE.md`](../../CLAUDE.md) for app-level patterns.

## Files

### `api-client.ts` — frontend trust boundary

- **`ApiError`** extends `Error` with a typed `response: ErrorResponse` property. Every failure from `apiGet` is wrapped in this class — satisfies `only-throw-error` lint rule and enables `instanceof` narrowing in components.
- **`apiGet<T>(path)`** calls `fetch`, returns typed `T` on success, throws `ApiError` on failure. Three failure modes handled:
  1. Non-2xx with JSON body — parse as `ErrorResponse`, wrap in `ApiError`
  2. Non-2xx with non-JSON body (proxy HTML, network error page) — `res.json()` throws `SyntaxError`, caught and wrapped in a synthetic `ApiError` with `INTERNAL_ERROR`
  3. `ApiError` already created from branch 1 — re-thrown unchanged (prevents double-wrap)
- Success path uses `(await res.json()) as unknown as T` — deliberate assertion. Both sides share types from `@weathered/shared`; runtime re-validation is redundant in a monorepo. For a third-party API, you'd pass a Zod schema and parse.
- No base URL — relative paths work via Vite's dev proxy. Production uses `VITE_API_BASE_URL` env var (Day 4).

### `query-client.ts` — TanStack Query config

- **`staleTime: 5min`** — matches backend LRU cache TTL. Without this, TanStack Query defaults to `staleTime: 0` and refetches on every mount.
- **`retry: 1`** — one retry for transient blips. Three (default) means the user waits 3× longer before seeing an error.
- **`refetchOnWindowFocus: false`** — weather data is valid for 5 minutes; refetching on tab-switch is noise.

### `utils.ts` — shared helpers

- **`cn(...inputs)`** — clsx + tailwind-merge. Prevents class conflicts (`"p-4 p-8"` → `"p-8"`). Used by every shadcn/ui component and custom components for conditional styling.
- **`formatDate(date)`** — formats a naive ISO string to en-AU locale via `Intl.DateTimeFormat`. Note: `new Date()` interprets naive strings as browser-local time, not city-local time. Acceptable for this scope; a future improvement would plumb the UTC offset from the forecast response.
