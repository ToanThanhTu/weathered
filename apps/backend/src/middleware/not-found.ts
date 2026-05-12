import type { RequestHandler } from 'express'
import { ERROR_CODES, type ErrorResponse } from '@weathered/shared'

/**
 * 404 catch-all for unknown routes. Registered after all routers and before
 * the error handler so unmatched paths emit the uniform `ErrorResponse`
 * envelope instead of Express 5's default HTML `Cannot GET /xyz`.
 */
export const notFoundHandler: RequestHandler = (req, res) => {
  const body: ErrorResponse = {
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  }
  res.status(404).json(body)
}
