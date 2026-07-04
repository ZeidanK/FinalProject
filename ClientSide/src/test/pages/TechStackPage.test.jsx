import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TechStackPage from '../../pages/TechStackPage'

describe('TechStackPage', () => {
  const renderPage = () => render(<MemoryRouter><TechStackPage /></MemoryRouter>)

  it('renders page title', () => {
    renderPage()
    expect(screen.getByText('Project Technology Reference')).toBeInTheDocument()
  })

  it('renders section titles', () => {
    renderPage()
    expect(screen.getByText('Frontend')).toBeInTheDocument()
    expect(screen.getByText('Backend')).toBeInTheDocument()
    expect(screen.getByText('Tooling')).toBeInTheDocument()
  })

  it('renders requirement coverage section', () => {
    renderPage()
    expect(screen.getByText('Project Requirements Coverage')).toBeInTheDocument()
  })

  it('renders stack rationale section', () => {
    renderPage()
    expect(screen.getByText('Why This Stack Was Chosen')).toBeInTheDocument()
  })

  it('renders an entry card for MUI', () => {
    renderPage()
    expect(screen.getByText('@mui/material')).toBeInTheDocument()
  })

  it('renders an entry card for react-router-dom', () => {
    renderPage()
    expect(screen.getByText('react-router-dom')).toBeInTheDocument()
  })
})
