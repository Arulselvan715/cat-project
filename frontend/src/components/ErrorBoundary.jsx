/**
 * ErrorBoundary.jsx
 *
 * React class-based error boundary for the Formative Feedback Assistant.
 *
 * What it catches:
 *   - Unhandled JavaScript exceptions thrown during rendering of child components
 *   - Exceptions thrown in componentDidMount / componentDidUpdate of children
 *   - Exceptions thrown in the render method of children
 *
 * What it does NOT catch (React limitation):
 *   - Async errors inside event handlers (e.g. onClick callbacks)
 *   - Errors in the ErrorBoundary component itself
 *   - Server-side rendering errors
 *   - Errors in async effects (useEffect with async callbacks that reject)
 *     Those are handled at the page level via .catch() in each page component.
 *
 * Normal application behavior is NOT changed:
 *   - When no error occurs the children render exactly as before.
 *   - When an error IS caught the user sees a recovery UI instead of a blank
 *     white screen, with a "Try again" button that resets the boundary.
 *
 * API / network errors are NOT caught here — they are handled by each page
 * component via try/catch around fetch calls and displayed as inline error
 * messages within the page's own error state.
 */

import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
    this.handleReset = this.handleReset.bind(this)
  }

  static getDerivedStateFromError(error) {
    // Update state so the fallback UI renders on the next render pass.
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log to console for developer visibility.
    // In a production deployment this would send to a monitoring service
    // (e.g. Sentry). No real monitoring integration is present in this prototype.
    console.error('[ErrorBoundary] Caught render error:', error)
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)
    this.setState({ errorInfo })
  }

  handleReset() {
    // Reset the error boundary so the user can retry the failing route.
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (!this.state.hasError) {
      // Normal path — render children unchanged
      return this.props.children
    }

    // Fallback UI — shown when a child component throws during render
    return (
      <div
        role="alert"
        aria-live="assertive"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40vh',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-primary, #1a202c)',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Something went wrong rendering this page
        </h2>
        <p style={{
          fontSize: '0.9rem',
          color: 'var(--text-muted, #718096)',
          marginBottom: '1.5rem',
          maxWidth: '480px',
        }}>
          An unexpected error occurred. Your data has not been lost. You can try
          the page again or navigate to another section using the sidebar.
        </p>
        {/* Show error message in development — keep it brief for users */}
        {this.state.error && (
          <pre style={{
            fontSize: '0.75rem',
            background: 'var(--bg-subtle, #f8f9fa)',
            border: '1px solid var(--border-light, #e2e8f0)',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            maxWidth: '560px',
            overflow: 'auto',
            textAlign: 'left',
            color: 'var(--text-secondary, #4a5568)',
          }}>
            {this.state.error.message}
          </pre>
        )}
        <button
          onClick={this.handleReset}
          style={{
            padding: '0.6rem 1.5rem',
            borderRadius: '6px',
            border: 'none',
            background: 'var(--primary, #4f46e5)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    )
  }
}
