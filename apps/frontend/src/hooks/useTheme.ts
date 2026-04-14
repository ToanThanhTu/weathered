import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'weathered-theme'

/** Reads the initial theme: localStorage first, then `prefers-color-scheme`, defaulting to light. */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // private mode / disabled storage: fall through to system pref
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * Theme state with localStorage persistence. Syncs the `dark` class on
 * `<html>` and writes to localStorage on every change. The initial class is
 * set by an inline script in `index.html` before paint to avoid a flash.
 */
export function useTheme(): {
  theme: Theme
  toggleTheme: () => void
} {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // private mode / disabled storage: toggle still works for the session
    }
  }, [theme])

  const toggleTheme = (): void => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggleTheme }
}
