import { WeatherPanel } from '@/components/main/WeatherPanel'
import { renderWithQuery } from '@/test/render'
import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const weatherResponse = {
  data: {
    location: {
      name: 'Sydney',
      country: 'Australia',
      latitude: -33.87,
      longitude: 151.21,
    },
    current: {
      temperature: 22.5,
      apparentTemperature: 23.1,
      humidity: 65,
      windSpeed: 12.4,
      windDirection: 180,
      condition: 'Mainly clear',
      observedAt: '2026-04-13T10:00',
    },
  },
}

const cityNotFoundError = {
  error: {
    code: 'CITY_NOT_FOUND',
    message: 'City asdfnotrealcity not found.',
  },
}

describe('<WeatherPanel>', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders the empty state when city is null', () => {
    renderWithQuery(<WeatherPanel city={null} />)

    expect(
      screen.getByRole('heading', { name: /welcome to weathered/i }),
    ).toBeInTheDocument()
  })

  it('renders the loading skeleton while fetching', () => {
    const mockFetch = vi.mocked(fetch)

    // Pending promise, never resolves during test
    mockFetch.mockReturnValueOnce(new Promise(() => {}))

    const { container } = renderWithQuery(<WeatherPanel city="Melbourne" />)

    // Query by data-slot since skeleton has no accessible text
    expect(
      container.querySelector('[data-slot="skeleton"]'),
    ).toBeInTheDocument()
  })

  it('renders the weather card on successful fetch', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(weatherResponse), { status: 200 }),
    )

    renderWithQuery(<WeatherPanel city="Sydney" />)

    await waitFor(() => {
      expect(screen.getByText(/sydney weather/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/22\.5°C/)).toBeInTheDocument()
    expect(screen.getByText(/mainly clear/i)).toBeInTheDocument()
  })

  it('renders the city-not-found error state on 404', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(cityNotFoundError), { status: 404 }),
    )

    renderWithQuery(<WeatherPanel city="asdfnotrealcity" />)

    await waitFor(() => {
      expect(screen.getByText(/city not found/i)).toBeInTheDocument()
    })
  })
})
