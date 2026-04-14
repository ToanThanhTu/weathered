import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function LoadingSkeleton() {
  return (
    <Card className="border-2">
      <CardHeader className="border-b">
        <div
          className={cn(
            'flex flex-col items-start gap-2',
            'sm:flex-row sm:items-start sm:justify-between sm:gap-4',
          )}
        >
          <div className="flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-48 mt-2" />
          </div>
          <Skeleton className="h-3 w-32" />
        </div>
      </CardHeader>

      <CardContent className="pt-8 pb-6">
        <div
          className={cn(
            'flex flex-col items-start gap-2',
            'sm:flex-row sm:items-end sm:gap-4',
          )}
        >
          <Skeleton
            className={cn(
              'h-20 w-32',
              'sm:h-24 sm:w-40',
            )}
          />
          <div className="pb-2 space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardContent>

      <div className="grid grid-cols-3 border-t">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'p-3',
              'sm:p-4',
              i > 0 && 'border-l',
            )}
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-16 mt-2" />
          </div>
        ))}
      </div>

      <div className="border-t px-6 py-3">
        <Skeleton className="h-3 w-48" />
      </div>
    </Card>
  )
}
