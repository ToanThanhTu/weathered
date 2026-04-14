import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function EmptyState() {
  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          No city selected
        </div>
        <h2 className="font-heading text-2xl font-bold mt-1">
          Welcome to Weathered
        </h2>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Search for a city to see its current weather conditions.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {['Sydney', 'London', 'Tokyo'].map((city) => (
            <span
              key={city}
              className="font-mono text-xs border px-2 py-1 text-muted-foreground"
            >
              {city}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
