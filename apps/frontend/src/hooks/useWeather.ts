import { ApiError, apiGet } from '@/lib/api-client'
import { useQuery } from '@tanstack/react-query'
import type { WeatherResponse } from '@weathered/shared'

/** Fetches current weather for a city. Disabled when `city` is null (idle state). Caches per city via TanStack Query's `queryKey`. */
export function useWeather(city: string | null) {
  const query = useQuery<WeatherResponse, ApiError>({
    queryKey: ['weather', city],
    queryFn: () =>
      apiGet<WeatherResponse>(
        `/api/weather?city=${encodeURIComponent(city ?? '')}`,
      ),
    enabled: city !== null && city.length > 0,
  })

  return query
}
