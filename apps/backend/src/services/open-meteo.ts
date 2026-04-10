/**
 * Open-Meteo HTTP client. The only module in the backend that knows upstream
 * URLs and upstream JSON shapes. Private Zod schemas validate responses at the
 * trust boundary; any failure (non-2xx, timeout, network, schema mismatch) is
 * collapsed into `UpstreamError` by `fetchJson` so callers only see typed results.
 */

import * as z from 'zod'
import { AppError, UpstreamError } from '../errors/app-error.js'

// Schemas

const ForecastResultSchema = z.object({
  time: z.string(),
  temperature_2m: z.number(),
  relative_humidity_2m: z.number(),
  apparent_temperature: z.number(),
  weather_code: z.number(),
  wind_speed_10m: z.number(),
  wind_direction_10m: z.number(),
})

const ForecastResponseSchema = z.object({
  current: ForecastResultSchema,
})

type ForecastResult = z.infer<typeof ForecastResultSchema>

const GeocodeResultSchema = z.object({
  name: z.string(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
})

const GeocodeResponseSchema = z.object({
  results: z.array(GeocodeResultSchema).optional(),
})

type GeocodeResult = z.infer<typeof GeocodeResultSchema>

/**
 * Fetches a URL, enforces a 5-second timeout, and validates the JSON body
 * against the supplied Zod schema. All failure modes are rethrown as
 * `UpstreamError`; pre-existing `AppError`s pass through unchanged.
 */
async function fetchJson<T>(url: URL, schema: z.ZodType<T>): Promise<T> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })

    if (!res.ok) {
      throw new UpstreamError(
        `Open-Meteo failed to fetch data: ${String(res.status)}`,
      )
    }

    const data: unknown = await res.json()

    return schema.parse(data)
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new UpstreamError('Open-Meteo timeout error')
    }
    if (error instanceof z.ZodError) {
      throw new UpstreamError('Open-Meteo type error')
    }

    throw new UpstreamError('Open-Meteo failed to fetch data')
  }
}

/**
 * Resolves a city name to its first geocoding match. Returns `null` when the
 * upstream response omits the `results` array — callers decide whether to
 * treat that as a `CityNotFoundError`.
 */
export async function geocode(city: string): Promise<GeocodeResult | null> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', city)
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')

  const result = await fetchJson(url, GeocodeResponseSchema)

  return result.results?.[0] ?? null
}

/**
 * Fetches the current-conditions block for a lat/lon pair. A missing `current`
 * field is treated as an upstream contract violation (thrown via the schema).
 * Timestamps come back as naive local time because `timezone=auto` is set.
 */
export async function fetchForecast(
  lat: number,
  lon: number,
): Promise<ForecastResult> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m',
  )
  url.searchParams.set('timezone', 'auto')

  const result = await fetchJson(url, ForecastResponseSchema)

  return result.current
}
