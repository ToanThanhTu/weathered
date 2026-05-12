import net from 'node:net'

import { config } from './config.js'
import { logger } from './logger.js'
import { createServer } from './server.js'

// Disable Node's Happy Eyeballs timeout
// Default timeout 250ms is too short for Open-Meteo's IPv4 endpoint
net.setDefaultAutoSelectFamily(false)

const app = createServer()

const server = app.listen(config.PORT, () => {
  logger.info(
    {
      port: config.PORT,
      nodeEnv: config.NODE_ENV,
      logLevel: config.LOG_LEVEL,
      allowedOrigin: config.ALLOWED_ORIGIN,
    },
    'Server listening',
  )
})

// Bound total request lifetime. Two sequential 5s upstream calls + slow client
// could otherwise keep a connection open indefinitely. 15s is the ceiling.
server.requestTimeout = 15_000

const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`)
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', () => {
  shutdown('SIGTERM')
})
process.on('SIGINT', () => {
  shutdown('SIGINT')
})
