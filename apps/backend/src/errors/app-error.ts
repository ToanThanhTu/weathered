import { ERROR_CODES, type ErrorCode } from '@weathered/shared'

/** Base class for all expected application errors. The central error handler translates any `AppError` into its `statusCode` + `ErrorResponse` envelope. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = new.target.name
  }
}

/** 400 — request failed schema validation. `details` carries `z.treeifyError` output. */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, ERROR_CODES.VALIDATION_ERROR, message, details)
  }
}

/** 404 — the Open-Meteo geocoder returned no results for the supplied city. */
export class CityNotFoundError extends AppError {
  constructor(message: string) {
    super(404, ERROR_CODES.CITY_NOT_FOUND, message)
  }
}

/** 502 — upstream call failed: non-2xx, timeout, network error, or unexpected response shape. */
export class UpstreamError extends AppError {
  constructor(message: string) {
    super(502, ERROR_CODES.UPSTREAM_ERROR, message)
  }
}
