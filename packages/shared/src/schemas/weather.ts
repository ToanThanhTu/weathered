import * as z from 'zod'

// Request

export const WeatherQuerySchema = z.object({
  city: z.string().trim().min(1, 'City is required').max(100, 'City name is too long')
})

export type WeatherQuery = z.infer<typeof WeatherQuerySchema>

// Response

// Success

export const LocationSchema = z.object({
  name: z.string(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number()
})

export const CurrentWeatherSchema = z.object({
  temperature: z.number(),
  apparentTemperature: z.number(),
  humidity: z.number(),
  windSpeed: z.number(),
  windDirection: z.number(),
  weatherCode: z.number(),
  condition: z.string(),
  observedAt: z.string(),
})

export const WeatherResponseSchema = z.object({
  data: z.object({
    location: LocationSchema,
    current: CurrentWeatherSchema,
  })
})

export type Location = z.infer<typeof LocationSchema>
export type CurrentWeather = z.infer<typeof CurrentWeatherSchema>
export type WeatherResponse = z.infer<typeof WeatherResponseSchema>

// Error

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CITY_NOT_FOUND: 'CITY_NOT_FOUND',
  UPSTREAM_ERROR: 'UPSTREAM_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.enum([
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_CODES.CITY_NOT_FOUND,
      ERROR_CODES.UPSTREAM_ERROR,
      ERROR_CODES.INTERNAL_ERROR,
      ERROR_CODES.RATE_LIMITED,
    ]),
    message: z.string(),
    details: z.unknown().optional()
  })
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>