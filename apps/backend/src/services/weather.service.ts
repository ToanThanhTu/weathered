import type { WeatherResponse } from '@weathered/shared'
import { fetchForecast, geocode } from './open-meteo.js'
import { CityNotFoundError } from '../errors/app-error.js'

/**
 * Orchestrates the geocode → forecast → normalize pipeline for a city name.
 * Throws `CityNotFoundError` when the geocoder returns no matches; upstream
 * failures surface as `UpstreamError` from the Open-Meteo client.
 */
export async function getWeather(city: string): Promise<WeatherResponse> {
  const geocodeResult = await geocode(city)

  if (!geocodeResult) {
    throw new CityNotFoundError(`City ${city} not found.`)
  }

  const weatherResult = await fetchForecast(
    geocodeResult.latitude,
    geocodeResult.longitude,
  )

  const weatherResponse: WeatherResponse = {
    data: {
      location: {
        name: geocodeResult.name,
        country: geocodeResult.country,
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
      },
      current: {
        temperature: weatherResult.temperature_2m,
        apparentTemperature: weatherResult.apparent_temperature,
        humidity: weatherResult.relative_humidity_2m,
        windSpeed: weatherResult.wind_speed_10m,
        windDirection: weatherResult.wind_direction_10m,
        condition: weatherCodeToCondition(weatherResult.weather_code),
        observedAt: weatherResult.time,
      },
    },
  }

  return weatherResponse
}

const WEATHER_CODES = new Map<number, string>([
  [0, 'Clear sky'],
  [1, 'Mainly clear'],
  [2, 'Partly cloudy'],
  [3, 'Overcast'],
  [45, 'Fog'],
  [48, 'Depositing rime fog'],
  [51, 'Light drizzle'],
  [53, 'Moderate drizzle'],
  [55, 'Dense drizzle'],
  [56, 'Light freezing drizzle'],
  [57, 'Dense freezing drizzle'],
  [61, 'Slight rain'],
  [63, 'Moderate rain'],
  [65, 'Heavy rain'],
  [66, 'Light freezing rain'],
  [67, 'Heavy freezing rain'],
  [71, 'Slight snow fall'],
  [73, 'Moderate snow fall'],
  [75, 'Heavy snow fall'],
  [77, 'Snow grains'],
  [80, 'Slight rain showers'],
  [81, 'Moderate rain showers'],
  [82, 'Violent rain showers'],
  [85, 'Slight snow showers'],
  [86, 'Heavy snow showers'],
  [95, 'Thunderstorm'],
  [96, 'Thunderstorm with slight hail'],
  [99, 'Thunderstorm with heavy hail'],
])

function weatherCodeToCondition(code: number): string {
  return WEATHER_CODES.get(code) ?? 'Unknown'
}
