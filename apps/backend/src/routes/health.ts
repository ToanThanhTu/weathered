import { Router } from 'express'

/** `GET /api/health` — liveness probe returning `{ status, uptime, timestamp }`. */
export const healthRouter: Router = Router()

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})
