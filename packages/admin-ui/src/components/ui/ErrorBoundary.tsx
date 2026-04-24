import { Component, type ReactNode } from "react"

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

/**
 * Catches render errors in the main content region so navigation chrome remains usable.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  override render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <div
          className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-8"
          role="alert"
        >
          <p className="text-center text-base font-medium text-content-danger">
            Something went wrong in this view.
          </p>
          <p className="text-center text-sm text-content-secondary">
            {this.state.error.message}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-md border border-border-default bg-surface-raised px-4 py-2 text-sm font-medium text-content-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
