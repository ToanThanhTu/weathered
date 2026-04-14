import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'
import { Moon, Sun } from 'lucide-react'

/**
 * Light/dark theme toggle. Shows the icon for the *target* theme: sun when
 * dark (you're switching to light), moon when light (you're switching to
 * dark). Persistence and class sync are handled by `useTheme`.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Button
      type="button"
      variant="outline"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="h-9 w-9 border-2 p-0"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
