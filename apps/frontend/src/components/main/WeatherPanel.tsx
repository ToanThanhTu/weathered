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

  if (!city) return <EmptyState />
  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorState error={error} />
  if (data) return <WeatherCard weather={data} />

  return null
}
