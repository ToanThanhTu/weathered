import net from 'node:net'

import { config } from './config.js'
import { logger } from './logger.js'
import { createServer } from './server.js'

// Disable Node's Happy Eyeballs timeout
// Default timeout 250ms is too short for Open-Meteo's IPv4 endpoint
net.setDefaultAutoSelectFamily(false)

const app = createServer()

const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT }, 'Server listening')
})

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
