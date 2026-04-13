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
        const existing = req.headers['x-request-id']
        const id = typeof existing === 'string' ? existing : randomUUID()

        res.setHeader('x-request-id', id)

        return id
      },
    }),
  )

  app.use('/api/weather', weatherRateLimiter)

  app.use('/api/health', healthRouter)
  app.use('/api/weather', weatherRouter)

  app.use(errorHandler)

  return app
}
