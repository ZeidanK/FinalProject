import { render, screen } from '@testing-library/react'
import TransactionDetailsModal from '../../components/TransactionDetailsModal'

describe('TransactionDetailsModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<TransactionDetailsModal open={false} onClose={vi.fn()} />)
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  })

  it('renders title when open', () => {
    render(<TransactionDetailsModal open={true} onClose={vi.fn()} />)
    expect(screen.getByText('Saved Transaction')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<TransactionDetailsModal open={true} loading={true} onClose={vi.fn()} />)
    expect(screen.getByText('Loading transaction details…')).toBeInTheDocument()
  })

  it('shows error state', () => {
    render(<TransactionDetailsModal open={true} error="Failed to load" onClose={vi.fn()} />)
    expect(screen.getByText('Failed to load')).toBeInTheDocument()
  })

  it('renders transaction data when provided', () => {
    const tx = { description: 'Office supplies', amount: 150.50, transactionType: 'debit', status: 'confirmed' }
    render(<TransactionDetailsModal open={true} transaction={tx} onClose={vi.fn()} />)
    expect(screen.getByText('Office supplies')).toBeInTheDocument()
    expect(screen.getByText('150.50')).toBeInTheDocument()
    expect(screen.getByText('debit')).toBeInTheDocument()
    expect(screen.getByText('confirmed')).toBeInTheDocument()
  })

  it('normalizes snake_case transaction fields', () => {
    const tx = { transaction_type: 'credit', amount: 200, description: 'Refund' }
    render(<TransactionDetailsModal open={true} transaction={tx} onClose={vi.fn()} />)
    expect(screen.getByText('Refund')).toBeInTheDocument()
    expect(screen.getByText('credit')).toBeInTheDocument()
  })
})
