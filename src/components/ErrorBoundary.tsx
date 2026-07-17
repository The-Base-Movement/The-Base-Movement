import { Component, type ErrorInfo, type ReactNode } from 'react'
import { captureException } from '@/lib/sentry'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
    captureException(error, {
      contexts: { react: { componentStack: info.componentStack ?? '' } },
    })
  }

  reset = () => this.setState({ hasError: false, error: null })

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Public Sans', sans-serif",
            padding: '24px',
            background: 'hsl(var(--background))',
          }}
        >
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 56, color: 'hsl(var(--destructive))', marginBottom: 16 }}
            >
              error
            </span>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: '0 0 8px',
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: 14,
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 24px',
                lineHeight: 1.6,
              }}
            >
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre
                style={{
                  textAlign: 'left',
                  fontSize: 12,
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  padding: '12px 16px',
                  overflowX: 'auto',
                  marginBottom: 24,
                  color: 'hsl(var(--destructive))',
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                Refresh page
              </button>
              <button className="btn btn-outline" onClick={this.reset}>
                Try again
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
