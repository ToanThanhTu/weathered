# Cache

Generic caching primitive + per-domain cache instances.

See [`apps/backend/CLAUDE.md`](../../CLAUDE.md) for app-level layering.

## Files

### `cached.ts` — generic LRU + TTL HOF

- Exports `cached<TArgs, TResult>(fn, options: CacheOption<TArgs>)` — returns a memoized version of `fn` with the same signature.
- `CacheOption` takes `max` (LRU cap), `ttlMs` (entry lifetime), and `keyFn` (derives a stable key from the wrapped function's arguments).
- Uses `lru-cache` for bounded memory via LRU eviction, not just TTL. Import is `from 'lru-cache/raw'` for the minimal build — saves a few KB and we don't need the optional fetch/async features.
- Caches the **promise**, not the resolved value, so concurrent calls for the same key share one upstream request (inflight deduplication / single-flight).
- **Failures are not cached.** The `.catch()` branch deletes the entry and re-throws so the next call retries. Applies to both thrown errors and rejected promises.
- Domain-agnostic. Never imports from `services/` or `routes/`.

### `weather.cache.ts` — weather-specific instance

- Wraps `services/weather.service.getWeather` via `cached()`.
- Config: 500-entry max, 5-minute TTL, city name normalized via `trim().toLowerCase()` for the cache key.
- Exports `getCachedWeather` — routes import this, not the raw service.
- TTL matches the frontend's TanStack Query `staleTime` so both layers agree on what "fresh" means.

## Rules

- Generic primitives live in this folder and stay domain-free.
- Per-domain cache instances live in this folder too, one file per domain, suffixed `.cache.ts`.
- Services remain cache-unaware. Caching is composed at the route boundary, not inside the service.
- New cache instances should export a function, not the raw `LRUCache` — callers shouldn't touch the store directly.
