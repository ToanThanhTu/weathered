import './app.css'

import { useEffect, useState } from 'react'

import { SearchBar } from '@/components/main/SearchBar'
import { WeatherPanel } from '@/components/main/WeatherPanel'

export default function App() {
  const [city, setCity] = useState<string | null>(() => {
    // Lazy initialiser: get city query param once on mount
    const params = new URLSearchParams(window.location.search)
    return params.get('city')
  })

  const handleSearch = (newCity: string) => {
    setCity(newCity)

    // Update url when user searches
    const url = new URL(window.location.href)
    url.searchParams.set('city', newCity)
    window.history.pushState({}, '', url) // use pushState to add a history entry, so back button works
  }

  // Handle browser back/forward
  useEffect(() => {
    const handlePop = () => {
      const params = new URLSearchParams(window.location.search)
      setCity(params.get('city'))
    }

    window.addEventListener('popstate', handlePop)
    return () => {
      window.removeEventListener('popstate', handlePop)
    }
  }, [])

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Weathered</h1>
      <SearchBar onSearch={handleSearch} />
      <WeatherPanel city={city} />
    </main>
  )
}
