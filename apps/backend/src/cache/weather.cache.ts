import { getWeather } from "../services/weather.service.js"
import { cached } from "./cached.js"

const WEATHER_CACHE_MAX = 500
const WEATHER_CACHE_TTL_MS = 5 * 60 * 1000

/** Normalizes city names so variants in case and whitespace share one cache entry. */
function cityKey(city: string): string {
  return city.trim().toLowerCase()
}

/** Cached facade over `getWeather`. 5-min TTL, 500-entry LRU. Routes import this, not the raw service. */
export const getCachedWeather = cached(getWeather, {
  max: WEATHER_CACHE_MAX,
  ttlMs: WEATHER_CACHE_TTL_MS,
  keyFn: cityKey,
})