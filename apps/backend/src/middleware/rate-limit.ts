import { ERROR_CODES, type ErrorResponse } from '@weathered/shared'
import { RequestHandler } from "express"
import rateLimit from 'express-rate-limit'

/** Per-IP rate limiter for `/api/weather`. 60 requests per minute, IETF draft-8 headers. */
export const weatherRateLimiter: RequestHandler = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: ERROR_CODES.RATE_LIMITED,
      message: 'Too many requests. Please wait a minute and try again.'
    }
  } satisfies ErrorResponse
})