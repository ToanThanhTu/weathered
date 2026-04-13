import { Router } from 'express'
import * as z from 'zod'

import { WeatherQuerySchema } from '@weathered/shared'

import { getCachedWeather } from '../cache/weather.cache.js'
import { ValidationError } from '../errors/app-error.js'

/** `GET /api/weather` — validates `?city=` and returns a normalized `WeatherResponse`. Typed errors bubble to the central handler. */
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
