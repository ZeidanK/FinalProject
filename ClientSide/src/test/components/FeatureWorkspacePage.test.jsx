import { render, screen } from '@testing-library/react'
import FeatureWorkspacePage from '../../components/FeatureWorkspacePage'

vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'John Doe', role: 'business_owner' },
  }),
}))

const defaultProps = {
  title: 'Dashboard',
  description: 'Welcome to your workspace',
  statusLabel: 'Active',
  highlights: [
    { title: 'Invoices', text: '5 pending', icon: <span>📄</span> },
    { title: 'Matches', text: '3 new', icon: <span>🔗</span> },
  ],
  emptyTitle: 'No data yet',
  emptyDescription: 'Start by adding your first invoice',
  emptyActionLabel: 'Add Invoice',
}

describe('FeatureWorkspacePage', () => {
  it('renders title and description', () => {
    render(<FeatureWorkspacePage {...defaultProps} />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Welcome to your workspace')).toBeInTheDocument()
  })

  it('renders status label', () => {
    render(<FeatureWorkspacePage {...defaultProps} />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders user greeting', () => {
    render(<FeatureWorkspacePage {...defaultProps} />)
    expect(screen.getByText(/Signed in as John Doe/)).toBeInTheDocument()
    expect(screen.getByText(/Business Owner/)).toBeInTheDocument()
  })

  it('renders highlight cards', () => {
    render(<FeatureWorkspacePage {...defaultProps} />)
    expect(screen.getByText('Invoices')).toBeInTheDocument()
    expect(screen.getByText('Matches')).toBeInTheDocument()
    expect(screen.getByText('5 pending')).toBeInTheDocument()
    expect(screen.getByText('3 new')).toBeInTheDocument()
  })

  it('renders empty state section', () => {
    render(<FeatureWorkspacePage {...defaultProps} />)
    expect(screen.getByText('No data yet')).toBeInTheDocument()
    expect(screen.getByText('Start by adding your first invoice')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Invoice' })).toBeInTheDocument()
  })
})
