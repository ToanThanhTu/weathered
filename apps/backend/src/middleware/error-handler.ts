import type { ErrorRequestHandler } from 'express'
import { AppError } from '../errors/app-error.js'
import { ERROR_CODES, ErrorResponse } from '@weathered/shared'

/** Central error handler. Translates `AppError` to its HTTP status and code; unknown errors become a generic 500 with no internal detail leaked. Must be registered last. */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // 4xx are user/client faults (validation, not-found, etc.) — log at `warn`
  // so dashboards don't conflate them with genuine 5xx bugs.
  const level =
    err instanceof AppError && err.statusCode < 500 ? 'warn' : 'error'
  req.log[level]({ err }, 'Request failed.')

  if (err instanceof AppError) {
    const errorResponse: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    }

    res.status(err.statusCode).json(errorResponse)
    return
  }

  const errorResponse: ErrorResponse = {
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Internal server error',
    },
  }

  res.status(500).json(errorResponse)
}
