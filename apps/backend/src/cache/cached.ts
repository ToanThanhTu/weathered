import { LRUCache } from "lru-cache/raw"

/** Options for `cached`: `max` LRU cap, `ttlMs` entry lifetime, `keyFn` derives the cache key. */
export interface CacheOption<TArgs extends readonly unknown[]> {
  max: number // max entries before LRU eviction
  ttlMs: number // entry lifetime
  keyFn: (...args: TArgs) => string // derives a stable cache key from the wrapper function's arguments
}

/** Wraps an async function with an LRU + TTL cache. Caches the promise (single-flight) and evicts failures on reject. */
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
