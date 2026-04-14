import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Composes Tailwind classes. `clsx` handles conditionals; `tailwind-merge` resolves conflicts (`"p-4 p-8"` becomes `"p-8"`). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formats a UTC ISO date string in the given IANA timezone (en-AU locale). */
export function formatDate(date: string, timeZone: string) {
  const dateObj = new Date(date)

  const formatter = new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone,
  })

  return formatter.format(dateObj)
}
