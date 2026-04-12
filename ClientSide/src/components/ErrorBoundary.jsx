import { Component } from 'react'

/**
 * Error boundary component that catches rendering errors in nested child components.
 *
 * When an error occurs, it renders a simple fallback UI and logs the error details.
 */
class ErrorBoundary extends Component {
  /**
   * @param {object} props - Component props.
   */
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  /**
   * Update error boundary state in response to an error.
   *
   * @returns {{hasError: boolean}}
   */
  static getDerivedStateFromError() {
    return { hasError: true }
  }

  /**
   * Log caught errors for diagnostics.
   *
   * @param {Error} error - The thrown error.
   * @param {object} errorInfo - React error info with component stack trace.
   */
  componentDidCatch(error, errorInfo) {
    console.error('ClientSide UI crashed:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>Please refresh the page and try again.</p>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary