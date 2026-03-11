import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * ErrorBoundary — catches React render crashes and shows a friendly UI.
 * Wrap pages with this so one crash doesn't break the whole app.
 *
 * Usage: <ErrorBoundary><YourPage /></ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '2rem',
          textAlign: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <AlertTriangle size={32} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>
            Something went wrong
          </h2>
          <p style={{ color: '#6b7280', maxWidth: 400, lineHeight: 1.6 }}>
            Don't worry, your data is safe. Try refreshing or go back to the dashboard.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              onClick={this.handleReset}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.625rem 1.25rem', borderRadius: '0.5rem',
                background: '#6366f1', color: '#fff', border: 'none',
                cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem'
              }}
            >
              <RefreshCw size={16} /> Try Again
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              style={{
                padding: '0.625rem 1.25rem', borderRadius: '0.5rem',
                background: '#f3f4f6', color: '#374151', border: 'none',
                cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem'
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
