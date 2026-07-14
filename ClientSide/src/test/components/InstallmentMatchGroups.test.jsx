import { render, screen } from '@testing-library/react'
import InstallmentMatchGroups from '../../components/InstallmentMatchGroups'

const baseProps = {
  deniedTxnIds: new Set(),
  onDeny: vi.fn(),
  onConfirm: vi.fn(),
  onRemoveMatch: vi.fn(),
  matchBusy: false,
}

describe('InstallmentMatchGroups', () => {
  it('renders loading skeletons', () => {
    render(<InstallmentMatchGroups {...baseProps} query={{ isLoading: true, data: [] }} />)
    expect(screen.getByText('Installment Plan Suggestions')).toBeInTheDocument()
  })

  it('renders empty state when no groups', () => {
    render(<InstallmentMatchGroups {...baseProps} query={{ isLoading: false, data: [] }} />)
    expect(screen.getByText('No installment suggestions at this time.')).toBeInTheDocument()
  })

  it('renders groups count chip', () => {
    const groups = [{ invoiceId: 1, invoiceNumber: 'INV-001', totalAmount: 500, alreadyMatchedAmount: 200, alreadyMatchedCount: 1, expectedInstallments: 3, existingMatches: [], suggestedTransactions: [] }]
    render(<InstallmentMatchGroups {...baseProps} query={{ isLoading: false, data: groups }} />)
    expect(screen.getByText('INV-001')).toBeInTheDocument()
  })

  it('shows waiting message when no pending installments', () => {
    const groups = [{ invoiceId: 1, invoiceNumber: 'INV-001', totalAmount: 500, alreadyMatchedAmount: 200, alreadyMatchedCount: 1, expectedInstallments: 3, existingMatches: [{ id: 1, transactionDescription: 'Payment 1', matchedAmount: 200 }], suggestedTransactions: [] }]
    render(<InstallmentMatchGroups {...baseProps} query={{ isLoading: false, data: groups }} />)
    expect(screen.getByText(/Waiting for next installment/)).toBeInTheDocument()
  })

  it('displays the normalized suggested installment amount', () => {
    const groups = [{
      invoiceId: 110,
      invoiceNumber: 'INV-TGT-2025-0825',
      totalAmount: 2100,
      alreadyMatchedAmount: 0,
      alreadyMatchedCount: 0,
      expectedInstallments: 4,
      existingMatches: [],
      suggestedTransactions: [{
        transactionId: 1184,
        description: 'Payment 1 of 4',
        vendorName: 'TRAVELGO TICKETS',
        postedDate: '2025-09-02T00:00:00Z',
        amount: 525,
        chargeAmount: -525,
      }],
    }]

    render(<InstallmentMatchGroups {...baseProps} query={{ isLoading: false, data: groups }} />)

    expect(screen.getByText('525.00')).toBeInTheDocument()
  })
})
