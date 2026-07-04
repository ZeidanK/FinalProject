import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../../components/ErrorBoundary'

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>child content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('child content')).toBeInTheDocument()
  })

  it('renders fallback UI when child throws', () => {
    const Throws = () => { throw new Error('test error') }
    render(
      <ErrorBoundary>
        <Throws />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Please refresh the page and try again.')).toBeInTheDocument()
  })
})
