import { config } from './config.js'
import { logger } from './logger.js'
import { createServer } from './server.js'

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
