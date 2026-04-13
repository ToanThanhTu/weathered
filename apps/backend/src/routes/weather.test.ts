import type { ErrorResponse, WeatherResponse } from '@weathered/shared'
import { WeatherResponseSchema } from '@weathered/shared'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createServer } from '../server.js'

const geocodeSydneyResponse = {
  results: [
    {
      name: 'Sydney',
      country: 'Australia',
      latitude: -33.87,
      longitude: 151.21,
    }
  ]
}

const geocodeEmptyResponse = {
  // No `results` field, this is how Open-Meteo signals "not found"
}

const forecastSydneyResponse = {
  current: {
    time: '2026-04-13T10:00',
    temperature_2m: 22.5,
    relative_humidity_2m: 65,
    apparent_temperature: 23.1,
    weather_code: 1,
    wind_speed_10m: 12.4,
    wind_direction_10m: 180,
  }
}

describe('GET /api/weather', () => {
  beforeEach(() => {
    // Mock a global-like fetch
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    // Reset fetch, so tests don't leak into each other
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns 200 with a normalised WeatherResponse for a valid city', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(geocodeSydneyResponse), { status: 200 })
    )
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(forecastSydneyResponse), { status: 200 })
    )

    const app = createServer()
    const res = await request(app).get('/api/weather').query({ city: 'Sydney' })

    expect(res.status).toBe(200)
    expect(() => WeatherResponseSchema.parse(res.body)).not.toThrow()

    const body: WeatherResponse = WeatherResponseSchema.parse(res.body)
    expect(body.data.location.name).toBe('Sydney')
    expect(body.data.current.condition).toBe('Mainly clear')
  })

  it('returns 404 CITY_NOT_FOUND when the geocoder has no results', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(geocodeEmptyResponse), { status: 200 })
    )

    const app = createServer()
    const res = await request(app)
      .get('/api/weather')
      .query({ city: 'asdfnotrealcity' })

    expect(res.status).toBe(404)
    const body = res.body as ErrorResponse
    expect(body.error.code).toBe('CITY_NOT_FOUND')
  })

  it('returns 400 VALIDATION_ERROR when city is missing', async () => {
    const app = createServer()
    const res = await request(app).get('/api/weather')

    expect(res.status).toBe(400)
    const body = res.body as ErrorResponse
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.details).toBeDefined()
  })

  it('returns 502 UPSTREAM_ERROR when Open-Meteo fails', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce(
      new Response('upstream down', { status: 502 })
    )

    const app = createServer()
    const res = await request(app)
      .get('/api/weather')
      .query({ city: 'Melbourne' })

    expect(res.status).toBe(502)
    const body = res.body as ErrorResponse
    expect(body.error.code).toBe('UPSTREAM_ERROR')
  })
})