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

  it('renders system capabilities section', () => {
    renderPage()
    expect(screen.getByText('System Capabilities')).toBeInTheDocument()
    expect(screen.getByText('AI invoice extraction and verification')).toBeInTheDocument()
    expect(screen.getByText('Real-time notifications and background jobs')).toBeInTheDocument()
  })

  it('renders stack rationale section', () => {
    renderPage()
    expect(screen.getByText('Why This Stack Was Chosen')).toBeInTheDocument()
  })

  it('renders an entry card for MUI', () => {
    renderPage()
    expect(screen.getByText('@mui/material 7 + @mui/icons-material')).toBeInTheDocument()
  })

  it('renders an entry card for react-router-dom', () => {
    renderPage()
    expect(screen.getByText('react-router-dom')).toBeInTheDocument()
  })

  it('renders current realtime and background-processing stack entries', () => {
    renderPage()
    expect(screen.getByText('@microsoft/signalr')).toBeInTheDocument()
    expect(screen.getByText('Hangfire')).toBeInTheDocument()
  })

  it('renders the fine-tuned local model explanation', () => {
    renderPage()
    expect(screen.getByText('Fine-tuned XLM-RoBERTa local model')).toBeInTheDocument()
    expect(screen.getByText(/trains xlm-roberta-base from real PDF text/i)).toBeInTheDocument()
  })
})
