import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuickMatchSuggestions from '../../components/QuickMatchSuggestions'

const baseQuery = { isLoading: false, data: [] }
const baseProps = {
  deniedPairs: new Set(),
  onDeny: vi.fn(),
  onConfirm: vi.fn(),
  matchBusy: false,
  invoices: [],
  transactions: [],
  onUndoAll: vi.fn(),
}

describe('QuickMatchSuggestions', () => {
  it('shows loading skeletons', () => {
    render(<QuickMatchSuggestions {...baseProps} query={{ isLoading: true, data: [] }} />)
    expect(screen.getByText('Quick Match Suggestions')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<QuickMatchSuggestions {...baseProps} query={baseQuery} />)
    expect(screen.getByText('No current suggestions.')).toBeInTheDocument()
  })

  it('shows undo button when pairs are denied', () => {
    render(
      <QuickMatchSuggestions
        {...baseProps}
        deniedPairs={new Set(['1-2', '3-4'])}
        query={baseQuery}
      />,
    )
    expect(screen.getByText(/undo 2 skipped/i)).toBeInTheDocument()
  })

  it('calls onUndoAll when undo clicked', async () => {
    const onUndoAll = vi.fn()
    render(
      <QuickMatchSuggestions
        {...baseProps}
        deniedPairs={new Set(['1-2'])}
        query={baseQuery}
        onUndoAll={onUndoAll}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /undo/i }))
    expect(onUndoAll).toHaveBeenCalledTimes(1)
  })

  it('renders suggestions with confirm and deny buttons', () => {
    const suggestions = [
      {
        invoiceId: 1,
        transactionId: 2,
        invoiceNumber: 'INV-001',
        vendorName: 'Vendor X',
        invoiceAmount: 500,
        invoiceDate: '2025-07-01T10:00:00Z',
        transactionDescription: 'Payment',
        transactionAmount: 500,
        transactionDate: '2025-07-01T10:00:00Z',
      },
    ]
    render(
      <QuickMatchSuggestions
        {...baseProps}
        query={{ isLoading: false, data: suggestions }}
        invoices={[{ id: 1, currency: 'USD' }]}
        transactions={[{ id: 2 }]}
      />,
    )
    expect(screen.getByText('Confirm')).toBeInTheDocument()
    expect(screen.getByText('Deny')).toBeInTheDocument()
    expect(screen.getByText('INV-001')).toBeInTheDocument()
    expect(screen.getByText('Vendor X')).toBeInTheDocument()
  })

  it('calls onConfirm when confirm clicked', async () => {
    const onConfirm = vi.fn()
    const suggestion = {
      invoiceId: 1,
      transactionId: 2,
      invoiceNumber: 'INV-001',
      vendorName: 'Vendor X',
      invoiceAmount: 500,
      invoiceDate: '2025-07-01T10:00:00Z',
      transactionDescription: 'Payment',
      transactionAmount: 500,
      transactionDate: '2025-07-01T10:00:00Z',
    }
    render(
      <QuickMatchSuggestions
        {...baseProps}
        onConfirm={onConfirm}
        query={{ isLoading: false, data: [suggestion] }}
        invoices={[{ id: 1, currency: 'USD' }]}
        transactions={[{ id: 2 }]}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(onConfirm).toHaveBeenCalledWith(suggestion)
  })

  it('calls onDeny when deny clicked', async () => {
    const onDeny = vi.fn()
    render(
      <QuickMatchSuggestions
        {...baseProps}
        onDeny={onDeny}
        query={{ isLoading: false, data: [{
          invoiceId: 1,
          transactionId: 2,
          invoiceNumber: 'INV-001',
          vendorName: 'Vendor X',
          invoiceAmount: 500,
          invoiceDate: '2025-07-01T10:00:00Z',
          transactionDescription: 'Payment',
          transactionAmount: 500,
          transactionDate: '2025-07-01T10:00:00Z',
        }] }}
        invoices={[{ id: 1, currency: 'USD' }]}
        transactions={[{ id: 2 }]}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /deny/i }))
    expect(onDeny).toHaveBeenCalledWith(1, 2)
  })
})
