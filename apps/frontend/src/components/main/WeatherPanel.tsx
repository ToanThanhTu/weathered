import { WeatherCard } from '@/components/main/WeatherCard'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { LoadingSkeleton } from '@/components/states/LoadingSkeleton'
import { useWeather } from '@/hooks/useWeather'

interface WeatherPanelProps {
  city: string | null
}

export function WeatherPanel({ city }: WeatherPanelProps) {
  const { data, error, isLoading } = useWeather(city)

  return (
    <div role="status" aria-live="polite">
      {!city && <EmptyState />}
      {city && isLoading && <LoadingSkeleton />}
      {city && !isLoading && error && <ErrorState error={error} />}
      {city && !isLoading && !error && data && <WeatherCard weather={data} />}
    </div>
  )
}
