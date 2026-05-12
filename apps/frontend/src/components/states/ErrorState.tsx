import { ERROR_CODES, type ErrorCode } from '@weathered/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { ApiError } from '@/lib/api-client'

interface ErrorStateProps {
  error: ApiError
}

interface ErrorMessage {
  title: string
  description: string
}

/**
 * Lookup of friendly user-facing messages per error code. `Partial<Record<...>>`
 * means keys must be real `ErrorCode` values (typos fail at compile time) but
 * not every code needs an entry \u2014 anything missing falls through to `DEFAULT_ERROR`.
 */
const ERROR_MESSAGES: Partial<Record<ErrorCode, ErrorMessage>> = {
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
  [ERROR_CODES.NOT_FOUND]: {
    title: 'Not found',
    description: 'The requested resource doesn\u2019t exist.',
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
