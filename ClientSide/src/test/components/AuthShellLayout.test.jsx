import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AuthShellLayout from '../../components/AuthShellLayout'

describe('AuthShellLayout', () => {
  const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

  it('renders chipLabel and children', () => {
    renderWithRouter(
      <AuthShellLayout chipLabel="Sign In">
        <div>form content</div>
      </AuthShellLayout>
    )
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('form content')).toBeInTheDocument()
  })

  it('renders ReconFlow branding', () => {
    renderWithRouter(
      <AuthShellLayout chipLabel="Login">
        <div>content</div>
      </AuthShellLayout>
    )
    expect(screen.getByText('ReconFlow')).toBeInTheDocument()
    expect(screen.getByText('Back to Home')).toBeInTheDocument()
  })
})
