import { Router } from 'express'
import * as z from 'zod'

import { WeatherQuerySchema } from '@weathered/shared'

import { getCachedWeather } from '../cache/weather.cache.js'
import { ValidationError } from '../errors/app-error.js'

/**
 * `GET /api/weather` — validates `?city=` with the shared Zod schema and
 * returns the normalized `WeatherResponse`. Throws `ValidationError` on bad
 * input; service-layer errors (`CityNotFoundError`, `UpstreamError`) bubble
 * up to the central error handler via Express 5's async error propagation.
 */
export const weatherRouter: Router = Router()

weatherRouter.get('/', async (req, res) => {
  const parsedQuery = WeatherQuerySchema.safeParse(req.query)

  if (!parsedQuery.success) {
    throw new ValidationError(
      'Invalid query',
      z.treeifyError(parsedQuery.error),
    )
  }

  const result = await getCachedWeather(parsedQuery.data.city)

  res.json(result)
})
