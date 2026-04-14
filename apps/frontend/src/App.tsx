import './app.css'

import { useEffect, useState } from 'react'

import { Footer } from '@/components/Footer'
import { SearchBar } from '@/components/main/SearchBar'
import { WeatherPanel } from '@/components/main/WeatherPanel'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'

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
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <header className="mb-10">
        <div className="flex items-end justify-between gap-4 border-b-4 border-rfs-red pb-4">
          <h1
            className={cn(
              'font-heading font-black tracking-tight text-4xl',
              'sm:text-5xl',
            )}
          >
            Weathered
          </h1>
          <div className="flex items-center gap-3">
            <span className="hidden font-sans text-xs uppercase tracking-widest text-muted-foreground sm:block">
              NSW Rural Fire Service
            </span>
            <ThemeToggle />
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Current weather conditions for any city. Powered by Open-Meteo.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        <SearchBar onSearch={handleSearch} />
        <WeatherPanel city={city} />
      </div>

      <Footer />
    </main>
  )
}
