import { getWeather } from "../services/weather.service.js"
import { cached } from "./cached.js"

const WEATHER_CACHE_MAX = 500
const WEATHER_CACHE_TTL_MS = 5 * 60 * 1000

/** Normalizes city names so `"Sydney"`, `" sydney "`, and `"SYDNEY"` all share one cache entry. */
function cityKey(city: string): string {
  return city.trim().toLowerCase()
}

/**
 * Cached facade over `weather.service.getWeather`. 5-minute TTL matches the
 * frontend's TanStack Query `staleTime`; bounded at 500 entries via LRU
 * eviction. Route handlers import this, not the raw service.
 */
export const getCachedWeather = cached(getWeather, {
  max: WEATHER_CACHE_MAX,
  ttlMs: WEATHER_CACHE_TTL_MS,
  keyFn: cityKey,
})