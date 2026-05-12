import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'
import { randomUUID } from 'node:crypto'
import { pinoHttp } from 'pino-http'
import { config } from './config.js'
import { logger } from './logger.js'
import { healthRouter } from './routes/health.js'
import { weatherRouter } from './routes/weather.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFoundHandler } from './middleware/not-found.js'
import { weatherRateLimiter } from './middleware/rate-limit.js'

/** Builds and returns a configured Express app without starting it. Testable with Supertest. */
export function createServer(): Express {
  const app = express()

  app.use(helmet())
  app.use(
    cors({
      origin: config.ALLOWED_ORIGIN,
    }),
  )
  app.use(express.json())

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const id = sanitizeRequestId(req.headers['x-request-id']) ?? randomUUID()
        res.setHeader('x-request-id', id)
        return id
      },
    }),
  )

  app.use('/api/weather', weatherRateLimiter)

  app.use('/api/health', healthRouter)
  app.use('/api/weather', weatherRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

/**
 * Validates a client-supplied `x-request-id` header. Returns the trimmed value
 * if it's a non-empty URL-safe string up to 128 chars; otherwise `null` so the
 * caller falls back to a fresh UUID. Guards against log forging, header
 * injection, and resource waste from oversized IDs.
 */
const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/

function sanitizeRequestId(raw: string | string[] | undefined): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return REQUEST_ID_PATTERN.test(trimmed) ? trimmed : null
}
