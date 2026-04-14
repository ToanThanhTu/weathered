import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'

/** Renders a component wrapped in a fresh `QueryClientProvider` with `retry: false`. Fresh client prevents cache leaks across tests; disabled retries make error-state tests resolve immediately. */
export function renderWithQuery(
  ui: ReactElement,
  options?: RenderOptions,
): ReturnType<typeof render> {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    options,
  )
}
