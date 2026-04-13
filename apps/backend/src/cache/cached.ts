import { LRUCache } from "lru-cache/raw"

/** Configuration for a `cached` wrapper. `max` bounds memory via LRU eviction; `ttlMs` caps entry age; `keyFn` derives a stable cache key from the wrapped function's arguments. */
export interface CacheOption<TArgs extends readonly unknown[]> {
  max: number // max entries before LRU eviction
  ttlMs: number // entry lifetime
  keyFn: (...args: TArgs) => string // derives a stable cache key from the wrapper function's arguments
}

/**
 * Wraps an async function with an LRU + TTL cache. Returns a function with the
 * same signature as `fn`. Caches the *promise* (not the resolved value) so two
 * concurrent calls for the same key share one upstream request (single-flight
 * / inflight deduplication). Failures are evicted in the `.catch` branch so
 * the next call retries fresh.
 */
export function cached<TArgs extends readonly unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: CacheOption<TArgs>
): (...args: TArgs) => Promise<TResult> {
  const store = new LRUCache<string, Promise<TResult>>({
    max: options.max,
    ttl: options.ttlMs
  })

  return async (...args: TArgs): Promise<TResult> => {
    const key = options.keyFn(...args)
    const existing = store.get(key)

    if (existing) return existing

    const promise = fn(...args).catch((err: unknown) => {
      // Failures are not to be cached
      store.delete(key)
      throw err
    })

    store.set(key, promise)
    return promise
  }
}