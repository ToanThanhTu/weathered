import { pino } from 'pino'
import { config } from './config.js'

/** Shared pino logger. Uses `pino-pretty` transport in development and raw JSON in production. */
export const logger = pino({
  level: config.LOG_LEVEL,
  ...(config.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss' },
    },
  }),
})
