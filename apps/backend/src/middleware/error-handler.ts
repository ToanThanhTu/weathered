import type { ErrorRequestHandler } from 'express'
import { AppError } from '../errors/app-error.js'
import { ERROR_CODES, ErrorResponse } from '@weathered/shared'

/**
 * Central Express error handler. Logs every error via the request-scoped
 * pino logger and shapes the response as an `ErrorResponse` envelope. Known
 * `AppError`s pass their `statusCode` / `code` / `message` through; anything
 * else becomes a generic 500 `INTERNAL_ERROR` with no internal detail leaked.
 * Must be registered last, after all routes.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  req.log.error({ err }, 'Request failed.')

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
