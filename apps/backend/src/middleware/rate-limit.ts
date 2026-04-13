import { RequestHandler } from "express"
import rateLimit from 'express-rate-limit'

/**
 * Rate limiter for 'api/weather' API
 * 60 requests per minute, prevent DDOS
 */
export const weatherRateLimiter: RequestHandler = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please wait a minute and try again.'
    }
  }
})