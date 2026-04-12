import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import type { WeatherResponse } from '@weathered/shared'

interface WeatherCardProps {
  weather: WeatherResponse
}

export function WeatherCard({ weather }: WeatherCardProps) {
  const { location, current } = weather.data

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{location.name} Weather</h2>
        </CardTitle>
        <CardDescription>
          Current weather conditions for {location.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <section>
          <h3 className="font-bold">City details</h3>
          <p>Latitude: {location.latitude}</p>
          <p>Longitude: {location.longitude}</p>
          <p>Country: {location.country}</p>
        </section>
        <section>
          <h3 className="font-bold">Current weather</h3>
          <p>Temperature: {current.temperature}°C</p>
          <p>Apparent temperature: {current.apparentTemperature}°C</p>
          <p>Condition: {current.condition}</p>
          <p>Humidity: {current.humidity}%</p>
          <p>Wind speed: {current.windSpeed}km/h</p>
          <p>Wind direction: {current.windDirection}°</p>
          <p>Observed at: {formatDate(current.observedAt)}</p>
        </section>
      </CardContent>
    </Card>
  )
}
