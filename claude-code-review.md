# Claude Code Review — Weathered

Reviews performed 2026-04-15 against `main` (commit `1af939a`). Two passes: frontend (`apps/frontend`) and backend (`apps/backend`).

---

## Frontend Review

Reviewer persona: Senior Frontend Engineer (React 19 + Vite + Tailwind v4 + shadcn/ui). React Compiler handles memoization, so `useMemo`/`useCallback` findings are skipped.

### Correctness & Logic

🟡 **Warning** — [api-client.ts:15-31](apps/frontend/src/lib/api-client.ts#L15) Non-JSON error bodies collapse to `INTERNAL_ERROR`, discarding HTTP status. A 429 never maps to `RATE_LIMITED`; a 404 never maps to `CITY_NOT_FOUND` when the body isn't parseable. Branch on `res.status` before parsing:

```ts
if (!res.ok) {
  const body = (await res.json().catch(() => null)) as ErrorResponse | null
  if (body?.error?.code) throw new ApiError(body)
  throw new ApiError({
    error: {
      code: res.status === 429 ? 'RATE_LIMITED' : 'INTERNAL_ERROR',
      message: res.statusText,
    },
  })
}
```

🟡 **Warning** — [api-client.ts:33](apps/frontend/src/lib/api-client.ts#L33) Double-cast `as unknown as T` bypasses strict-TS intent. Parse via `WeatherResponseSchema` for a free runtime contract check (the backend's tests already do this).

🔵 **Suggestion** — [useTheme.ts:32-40](apps/frontend/src/hooks/useTheme.ts#L32) Effect re-toggles `.dark` redundantly with `index.html`'s inline script; minor FOUC window if an extension delays CSS.

### Security

Clean. No `dangerouslySetInnerHTML`, no `eval`, no tokens in storage, external links use `rel="noopener noreferrer"`.

### Performance

Clean. React Compiler handles memoization per project rules; TanStack Query caches per city with 5-min `staleTime`.

### Accessibility

🟡 **Warning** — [WeatherPanel.tsx:11-20](apps/frontend/src/components/main/WeatherPanel.tsx#L11) State swaps between loading/error/data aren't announced. A screen-reader user who submits a search hears nothing until they re-navigate. Wrap the panel container:

```tsx
<div role="status" aria-live="polite">
```

🟡 **Warning** — [SearchBar.tsx:53](apps/frontend/src/components/main/SearchBar.tsx#L53) `FieldError` isn't linked to the `<Input>`. Assistive tech has no association from input to error message. Add `aria-invalid` and `aria-describedby`:

```tsx
<Input
  aria-invalid={!!error}
  aria-describedby={error ? 'search-city-error' : undefined}
/>
<FieldError id="search-city-error">{error}</FieldError>
```

🔵 **Suggestion** — [WeatherCard.tsx:56](apps/frontend/src/components/main/WeatherCard.tsx#L56) Bare `°` is read as "23 degree". Add `<span className="sr-only">Celsius</span>` (same for wind direction `180°`).

### Component Design

🔵 **Suggestion** — [ErrorState.tsx:9](apps/frontend/src/components/states/ErrorState.tsx#L9) Use `Partial<Record<ErrorCode, …>>` so missed shared error codes are type-checked.

🔵 **Suggestion** — [App.tsx:18-25](apps/frontend/src/App.tsx#L18) Two sources of truth for `city` (state + URL). A `useUrlState('city')` hook would consolidate `pushState` + `popstate`, but it's not worth the abstraction for one field.

### CSS & Testability

CSS is clean (no `!important`, no inline `style={}`, no magic z-indexes). Tests cover the four panel branches well. Missing:

- A non-`CITY_NOT_FOUND` error-path test (e.g. `UPSTREAM_ERROR`)
- A `SearchBar` empty-input rejection test
- Tests for `useTheme` and for `api-client`'s JSON-parse-failure branch

All are sub-10-line additions.

### Verdict

🟢 **GREEN LIGHT, APPROVED**

No Critical issues. The two Warnings worth fixing before submission are the `api-client` status-code loss (visible behaviour) and the `SearchBar` aria plumbing (one-line a11y win for the interview).

---

## Backend Review

Reviewer persona: Senior Backend Engineer (Express 5 + Zod 4 + pino + lru-cache, Node 24). No DB, no auth by design.

### Correctness & Logic

🟡 **Warning** — [cached.ts:26-32](apps/backend/src/cache/cached.ts#L26) `store.set(key, promise)` stores the `.catch`-derived promise. If ordering ever shifts so `.catch` fires before `store.set`, the cache ends up holding a rejected promise until TTL. Insert the raw promise before attaching `.catch`:

```ts
const promise = fn(...args)
store.set(key, promise)
return promise.catch((err: unknown) => {
  store.delete(key)
  throw err
})
```

🔵 **Suggestion** — [weather.service.ts:80](apps/backend/src/services/weather.service.ts#L80) `localToUtcIso` assumes Open-Meteo's `YYYY-MM-DDTHH:mm` shape. Assert via Zod regex so the function fails loudly if upstream ever adds offset/`Z`.

### Security

🟡 **Warning** — [weather.ts (shared schema)](packages/shared/src/schemas/weather.ts#L6) `city` is only length-capped. URL encoding prevents injection, but a Unicode-letter allowlist is a cheap hardening win and a good interview talking point:

```ts
city: z.string().trim().min(1).max(100).regex(/^[\p{L}\p{M}\s'.-]+$/u)
```

🔵 **Suggestion** — [server.ts:29-34](apps/backend/src/server.ts#L29) Client-supplied `x-request-id` is echoed into header + log field with no cap. Bound length (~128) and reject non-ASCII/newlines to prevent log forging.

### Performance & Scalability

🟡 **Warning** — [index.ts:13](apps/backend/src/index.ts#L13) No outer `server.requestTimeout`. Two sequential upstream calls (5s each) plus a slow client = unbounded request lifetime. Set ~15s:

```ts
server.requestTimeout = 15_000
```

🔵 **Suggestion** — [weather.service.ts:8-16](apps/backend/src/services/weather.service.ts#L8) Consider a second-level `geocode(city)` cache so repeated misses on fresh forecast TTLs reuse geocoding.

### Architecture & API Design

🟡 **Warning** — [rate-limit.ts:10-15](apps/backend/src/middleware/rate-limit.ts#L10) Rate-limiter body literal doesn't `satisfies ErrorResponse` — schema drift goes silent. Use the shared type and code:

```ts
message: {
  error: { code: ERROR_CODES.RATE_LIMITED, message: '...' },
} satisfies ErrorResponse
```

🔵 **Suggestion** — Missing 404 fallback middleware before `errorHandler`. Unknown routes escape the `ErrorResponse` contract with Express 5's default HTML 404.

### Observability

🔵 **Suggestion** — [error-handler.ts:7](apps/backend/src/middleware/error-handler.ts#L7) Log 4xx validation errors at `warn`, reserve `error` for 5xx so dashboards stay clean.

🔵 **Suggestion** — Log `ALLOWED_ORIGIN` / `NODE_ENV` on startup for prod debugging.

### Testability

🟡 **Warning** — [weather.test.ts:35](apps/backend/src/routes/weather.test.ts#L35) Module-scoped LRU leaks between tests. Today's city-per-test discipline works, but one duplicated city gives a silent false green. Expose a `__resetCaches()` helper or use `vi.resetModules()` per test.

🔵 **Suggestion** — No test for the 429 path or for an upstream schema-mismatch collapsing to `UpstreamError`. Both are one-test wins.

### Verdict

🟢 **GREEN LIGHT, APPROVED**

The single fix genuinely worth making before the demo is the `cached()` HOF ordering — a one-line change that locks in single-flight correctness and is a strong interview talking point. Everything else is hardening or test coverage.

---

## Summary

Both layers approved. Suggested pre-submission punch list (all small, interview-visible wins):

1. [cached.ts:26-32](apps/backend/src/cache/cached.ts#L26) — fix promise-ordering in `cached()` HOF.
2. [api-client.ts:15-31](apps/frontend/src/lib/api-client.ts#L15) — branch on HTTP status so 429/404 map correctly when upstream body isn't JSON.
3. [SearchBar.tsx:53](apps/frontend/src/components/main/SearchBar.tsx#L53) — add `aria-invalid` + `aria-describedby`.
4. [WeatherPanel.tsx:11-20](apps/frontend/src/components/main/WeatherPanel.tsx#L11) — wrap the panel in `role="status" aria-live="polite"`.
5. [index.ts:13](apps/backend/src/index.ts#L13) — set `server.requestTimeout = 15_000`.
6. [rate-limit.ts:10-15](apps/backend/src/middleware/rate-limit.ts#L10) — `satisfies ErrorResponse` on the rate-limit body.
