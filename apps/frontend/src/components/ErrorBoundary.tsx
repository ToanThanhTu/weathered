import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * App-root error boundary. Catches synchronous render errors in the component
 * tree and shows a recoverable fallback. Async / data-fetching errors are
 * handled separately by TanStack Query's `error` state — this only fires on
 * render failures, which is the one case hooks can't express (no hook
 * equivalent for `componentDidCatch` exists in React 19).
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo.componentStack)
  }

  handleReset = (): void => {
    this.setState({ hasError: false })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="mx-auto max-w-2xl px-4 py-8">
          <Alert variant="destructive">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="flex flex-col gap-3">
              <span>
                The app hit an unexpected error. Try reloading the page.
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.reload()
                  }}
                >
                  Reload
                </Button>
                <Button variant="ghost" onClick={this.handleReset}>
                  Dismiss
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </main>
      )
    }

    return this.props.children
  }
}
