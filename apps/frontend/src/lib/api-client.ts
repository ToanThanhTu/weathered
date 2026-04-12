import type { ErrorResponse } from '@weathered/shared'

/** Typed wrapper around the backend `ErrorResponse` envelope. Thrown by `apiGet` on non-2xx responses; TanStack Query surfaces it as `error` in query results. */
export class ApiError extends Error {
  constructor(public readonly response: ErrorResponse) {
    super(response.error.message)
    this.name = 'ApiError'
  }
}

/** Fetches a JSON endpoint. Returns typed data on success; throws `ApiError` on any failure (non-2xx, non-JSON body, network error). */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path)

  if (!res.ok) {
    try {
      const errorResponse = (await res.json()) as ErrorResponse
      throw new ApiError(errorResponse)
    } catch (err) {
      if (err instanceof ApiError) {
        throw err
      }

      throw new ApiError({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      })
    }
  }

  const data: T = (await res.json()) as unknown as T
  return data
}
