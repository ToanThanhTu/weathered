import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn, formatDate } from '@/lib/utils'
import type { WeatherResponse } from '@weathered/shared'
import { Droplets, MapPin, Wind } from 'lucide-react'
import type { ReactNode } from 'react'

interface WeatherCardProps {
  weather: WeatherResponse
}

export function WeatherCard({ weather }: WeatherCardProps) {
  const { location, current } = weather.data

  return (
    <Card className="border-2">
      <CardHeader className="border-b">
        <div
          className={cn(
            'flex flex-col items-start gap-2',
            'sm:flex-row sm:items-start sm:justify-between sm:gap-4',
          )}
        >
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{location.country}</span>
            </div>
            <h2 className="font-heading text-2xl font-bold mt-1">
              {location.name}
            </h2>
          </div>
          <div
            className={cn(
              'text-left text-xs text-muted-foreground font-mono',
              'sm:text-right',
            )}
          >
            {location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-8 pb-6">
        <div
          className={cn(
            'flex flex-col items-start gap-2',
            'sm:flex-row sm:items-end sm:gap-4',
          )}
        >
          <span
            className={cn(
              'font-heading font-black leading-none tabular-nums text-7xl',
              'sm:text-8xl',
            )}
          >
            {Math.round(current.temperature)}°
          </span>
          <div className="pb-2">
            <div className="font-heading text-2xl">{current.condition}</div>
            <div className="text-sm text-muted-foreground">
              Feels like {Math.round(current.apparentTemperature)}°
            </div>
          </div>
        </div>
      </CardContent>

      <div className="grid grid-cols-3 border-t">
        <Metric
          icon={<Droplets className="h-4 w-4" />}
          label="Humidity"
          value={`${String(current.humidity)}%`}
        />
        <Metric
          icon={<Wind className="h-4 w-4" />}
          label="Wind"
          value={`${String(current.windSpeed)} km/h`}
          className="border-l"
        />
        <Metric
          label="Direction"
          value={`${String(current.windDirection)}°`}
          className="border-l"
        />
      </div>

      <div className="border-t px-6 py-3 text-xs uppercase tracking-widest text-muted-foreground">
        Observed {formatDate(current.observedAt, current.timezone)}
      </div>
    </Card>
  )
}

interface MetricProps {
  icon?: ReactNode
  label: string
  value: string
  className?: string
}

function Metric({ icon, label, value, className }: MetricProps) {
  return (
    <div
      className={cn(
        'p-3',
        'sm:p-4',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className={cn(
          'mt-1 font-heading font-bold tabular-nums text-lg',
          'sm:text-xl',
        )}
      >
        {value}
      </div>
    </div>
  )
}
