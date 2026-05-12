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
    const body = (await res.json().catch(() => null)) as ErrorResponse | null
    if (body?.error) throw new ApiError(body)

    // Non-JSON or malformed body (e.g. CDN HTML page on 502, infra-layer 429).
    // Map known HTTP statuses to typed codes so ErrorState renders the right message.
    const code: ErrorResponse['error']['code'] =
      res.status === 429
        ? 'RATE_LIMITED'
        : res.status === 404
          ? 'CITY_NOT_FOUND'
          : res.status >= 500
            ? 'UPSTREAM_ERROR'
            : 'INTERNAL_ERROR'

    throw new ApiError({
      error: {
        code,
        message: res.statusText || 'An unexpected error occurred',
      },
    })
  }

  const data: T = (await res.json()) as unknown as T
  return data
}
