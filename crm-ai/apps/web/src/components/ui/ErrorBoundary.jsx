import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-secondary)] p-6">
          <div className="w-full max-w-md text-center">
            <AlertTriangle size={48} className="mx-auto text-[var(--danger)]" />
            <h2 className="mt-4 text-lg font-semibold text-[var(--text)]">Something went wrong</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <Button
              className="mt-6"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
