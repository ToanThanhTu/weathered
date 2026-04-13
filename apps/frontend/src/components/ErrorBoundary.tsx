import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/** App-root error boundary. Catches synchronous render errors; async/query errors are handled by TanStack Query. */
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
    // console (not a logger), frontend has no pino, this is React's standard error-boundary reporting
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
