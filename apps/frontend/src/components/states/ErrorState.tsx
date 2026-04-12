import { ERROR_CODES } from '@weathered/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { ApiError } from '@/lib/api-client'

interface ErrorStateProps {
  error: ApiError
}

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  [ERROR_CODES.CITY_NOT_FOUND]: {
    title: 'City not found',
    description:
      'We couldn\u2019t find that city. Check the spelling and try again.',
  },
  [ERROR_CODES.UPSTREAM_ERROR]: {
    title: 'Weather service unavailable',
    description:
      'The weather service is temporarily unavailable. Please try again in a few minutes.',
  },
  [ERROR_CODES.VALIDATION_ERROR]: {
    title: 'Invalid search',
    description: 'Please enter a valid city name.',
  },
  [ERROR_CODES.RATE_LIMITED]: {
    title: 'Too many requests',
    description:
      'You\u2019re searching too fast. Please wait a moment and try again.',
  },
}

const DEFAULT_ERROR = {
  title: 'Something went wrong',
  description: 'An unexpected error occurred. Please try again later.',
}

export function ErrorState({ error }: ErrorStateProps) {
  const { code } = error.response.error
  const isNotFound = code === ERROR_CODES.CITY_NOT_FOUND
  const { title, description } = ERROR_MESSAGES[code] ?? DEFAULT_ERROR

  return (
    <Alert variant={isNotFound ? 'default' : 'destructive'} className="mt-6">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  )
}
