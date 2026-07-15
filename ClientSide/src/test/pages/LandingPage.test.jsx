import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LandingPage from '../../pages/LandingPage'

describe('LandingPage', () => {
  const renderPage = () => render(<MemoryRouter><LandingPage /></MemoryRouter>)

  it('renders ReconFlow branding', () => {
    renderPage()
    expect(screen.getAllByText('ReconFlow').length).toBeGreaterThanOrEqual(1)
  })

  it('renders hero heading', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Match invoices to transactions/i)
  })

  it('renders feature steps', () => {
    renderPage()
    expect(screen.getByText('Upload')).toBeInTheDocument()
    expect(screen.getByText('Match')).toBeInTheDocument()
    expect(screen.getByText('Review')).toBeInTheDocument()
    expect(screen.getByText('Report')).toBeInTheDocument()
  })

  it('renders Log In button linking to /login', () => {
    renderPage()
    const link = screen.getByText('Log In').closest('a')
    expect(link).toHaveAttribute('href', '/login')
  })

  it('renders Register button linking to /register', () => {
    renderPage()
    const buttons = screen.getAllByText('Register')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('renders pricing packages that match system capabilities', () => {
    renderPage()
    expect(screen.getByText('Invoice Essentials')).toBeInTheDocument()
    expect(screen.getByText('Reconciliation Pro')).toBeInTheDocument()
    expect(screen.getByText('Firm Operations')).toBeInTheDocument()
    expect(screen.getByText('Hybrid Gemini/local-model extraction')).toBeInTheDocument()
    expect(screen.getByText('Installment payment matching')).toBeInTheDocument()
  })
})
