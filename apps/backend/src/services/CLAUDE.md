# Services

Business logic layer. Two flavours live here — **upstream clients** and **orchestration services** — and they have distinct rules.

See [`apps/backend/CLAUDE.md`](../../CLAUDE.md) for app-level patterns.

## Upstream clients

Files that talk to external HTTP APIs (e.g. [`open-meteo.ts`](open-meteo.ts)).

### Rules

- **Private Zod schemas.** The response schemas for the upstream API are `const` declarations at module scope — never exported. The rest of the app has no business knowing what `current_units` looks like.
- **Shared `fetchJson` helper.** One generic function per client file does fetch + timeout + schema parse + error collapse. Avoid duplicating that logic across per-endpoint functions.
- **Collapse all failures into `UpstreamError`.** Four failure modes get caught in the `fetchJson` try/catch:
  1. Non-2xx response (`!res.ok`)
  2. Timeout — `DOMException` with `name: 'AbortError'` from `AbortSignal.timeout(5000)`
  3. Network / DNS — `TypeError: fetch failed` (the catch-all branch)
  4. Schema mismatch — `z.ZodError` from `schema.parse()`

  Pre-existing `AppError`s pass through unchanged so the non-2xx throw isn't double-wrapped.

- **URL building.** Always use `new URL(...)` + `url.searchParams.set(key, value)`. Never template-literal user input into a URL — it's an injection vector and `URLSearchParams` percent-encodes for you.
- **Timeout.** `AbortSignal.timeout(5000)` on every request. The 5s ceiling is enforced app-wide because [`index.ts`](../index.ts) disables Happy Eyeballs — see the backend CLAUDE.md.
- **Narrow return types.** `geocode()` returns `GeocodeResult | null`, not the whole response envelope. Unwrap upstream quirks (optional `results` array, nested `current` object) at the boundary so callers don't have to.
- **Expected misses return `null`.** Contract violations throw. Rule of thumb: if the upstream says "no match found" that's `null`; if it says something incoherent that's `UpstreamError`.

### Example shape

```ts
const FooResponseSchema = z.object({ ... })  // private

async function fetchJson<T>(url: URL, schema: z.ZodType<T>): Promise<T> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new UpstreamError(`Foo ${res.status}`)
    const data: unknown = await res.json()
    return schema.parse(data)
  } catch (error) {
    if (error instanceof AppError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new UpstreamError('Foo request timed out')
    }
    if (error instanceof z.ZodError) {
      throw new UpstreamError('Foo returned an unexpected response shape')
    }
    throw new UpstreamError('Foo request failed')
  }
}

export async function getFoo(id: string): Promise<FooResult | null> { ... }
```

## Orchestration services

Files that compose upstream clients + business logic into a `@weathered/shared` DTO (e.g. [`weather.service.ts`](weather.service.ts)).

### Rules

- **Return shared DTOs.** The function's return type comes from `@weathered/shared`. TypeScript's structural checking is the only contract enforcement — do not `WeatherResponseSchema.parse(...)` the output. Runtime validation is for untrusted boundaries, not trusted internal builds.
- **Trust the caller.** Input validation happens at the route layer via Zod `safeParse`. Services accept already-validated arguments and assume they're well-formed.
- **Throw typed errors.** Use `CityNotFoundError` for expected misses, `UpstreamError` is propagated from upstream clients. Never `throw new Error(...)`.
- **Explicit field mapping.** When building the DTO, spell out each field assignment even if the source object happens to match structurally. Makes refactors safer and the DTO → upstream mapping visible at a glance.
- **Side-effect-free except for the network calls.** No logging (the error handler logs), no mutation of inputs, no caching (that's a wrapper concern).
- **Helpers live in the same file.** Small pure functions like `weatherCodeToCondition` go inline unless they're reused across services. Premature extraction just fragments the reading flow.
