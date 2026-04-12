import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function EmptyState() {
  return (
    <Card className="mt-6 text-center">
      <CardHeader>
        <CardTitle>Welcome to Weathered</CardTitle>
        <CardDescription>
          Search for a city to see its current weather conditions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Try searching for Sydney, London, or Tokyo.
        </p>
      </CardContent>
    </Card>
  )
}
