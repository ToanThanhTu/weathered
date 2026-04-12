import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formats a naive ISO date string to a human-readable en-AU locale string. */
export function formatDate(date: string) {
  const dateObj = new Date(date)

  const formatter = new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'full',
    timeStyle: 'short',
  })

  return formatter.format(dateObj)
}
