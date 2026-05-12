import { geocode } from '../services/open-meteo.js'
import { cached } from './cached.js'

const GEOCODE_CACHE_MAX = 1000
// City coordinates are effectively static. 24h is generous headroom over
// any realistic re-fetch interval without making evictions feel stale.
const GEOCODE_CACHE_TTL_MS = 24 * 60 * 60 * 1000

/** Normalizes the city name so casing/whitespace variants share one entry. */
function cityKey(city: string): string {
  return city.trim().toLowerCase()
}

/**
 * Cached facade over `geocode`. Long TTL (24h) because city coordinates don't
 * change in any meaningful timeframe; only the forecast data does. Composed
 * inside `getWeather` so the slow-changing geocode survives forecast-TTL expiry.
 */
export const cachedGeocode = cached(geocode, {
  max: GEOCODE_CACHE_MAX,
  ttlMs: GEOCODE_CACHE_TTL_MS,
  keyFn: cityKey,
})
