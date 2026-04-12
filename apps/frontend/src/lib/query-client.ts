import { QueryClient } from '@tanstack/react-query'

/** Shared TanStack Query client. 5-min stale time matches backend LRU cache TTL. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // matches backend cache TTL
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
