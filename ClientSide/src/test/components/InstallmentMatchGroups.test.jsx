import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('orders groups with pending installments before no-pending groups', () => {
    const groups = [
      {
        invoiceId: 1,
        invoiceNumber: 'NO-PENDING',
        totalAmount: 500,
        alreadyMatchedAmount: 250,
        alreadyMatchedCount: 1,
        expectedInstallments: 3,
        existingMatches: [{ id: 1, transactionDescription: 'Payment 1', matchedAmount: 250 }],
        suggestedTransactions: [],
      },
      {
        invoiceId: 2,
        invoiceNumber: 'PENDING-FIRST',
        totalAmount: 500,
        alreadyMatchedAmount: 250,
        alreadyMatchedCount: 1,
        expectedInstallments: 2,
        existingMatches: [],
        suggestedTransactions: [{ transactionId: 20, description: 'Payment 2', amount: 250 }],
      },
    ]

    render(<InstallmentMatchGroups {...baseProps} query={{ isLoading: false, data: groups }} />)

    const pendingGroup = screen.getByText('PENDING-FIRST')
    const noPendingGroup = screen.getByText('NO-PENDING')
    expect(pendingGroup.compareDocumentPosition(noPendingGroup) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('keeps fully matched installment invoices in a collapsed subsection', async () => {
    const groups = [
      {
        invoiceId: 1,
        invoiceNumber: 'FULLY-MATCHED',
        totalAmount: 500,
        remainingAmount: 0,
        alreadyMatchedAmount: 500,
        alreadyMatchedCount: 2,
        expectedInstallments: 2,
        existingMatches: [{ id: 1, transactionDescription: 'Payment 1', matchedAmount: 250 }],
        suggestedTransactions: [],
      },
      {
        invoiceId: 2,
        invoiceNumber: 'PENDING-ACTIVE',
        totalAmount: 500,
        alreadyMatchedAmount: 250,
        alreadyMatchedCount: 1,
        expectedInstallments: 2,
        existingMatches: [],
        suggestedTransactions: [{ transactionId: 20, description: 'Payment 2', amount: 250 }],
      },
    ]

    render(<InstallmentMatchGroups {...baseProps} query={{ isLoading: false, data: groups }} />)

    expect(screen.getByText('PENDING-ACTIVE')).toBeInTheDocument()
    expect(screen.getByText('Fully matched installment invoices')).toBeInTheDocument()
    expect(screen.queryByText('FULLY-MATCHED')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /expand fully matched installment invoices/i }))

    expect(await screen.findByText('FULLY-MATCHED')).toBeInTheDocument()
    expect(screen.getByText('Installment invoice fully matched.')).toBeInTheDocument()
  })

  it('renders snake_case invoice data inside fully matched installment groups', async () => {
    const groups = [
      {
        invoice_id: 7,
        invoice_number: 'SNAKE-FULL',
        vendor_name: 'Fetched Vendor',
        invoice_date: '2025-07-01T10:00:00Z',
        total_amount: 100,
        remaining_amount: 0,
        already_matched_amount: 100,
        already_matched_count: 1,
        expected_installments: 1,
        existing_matches: [{ id: 70, transaction_description: 'Installment payment', matched_amount: 100 }],
        suggested_transactions: [],
      },
    ]

    render(<InstallmentMatchGroups {...baseProps} query={{ isLoading: false, data: groups }} />)

    await userEvent.click(screen.getByRole('button', { name: /expand fully matched installment invoices/i }))

    expect(await screen.findByText(/SNAKE-FULL/)).toBeInTheDocument()
    expect(screen.getByText(/Fetched Vendor/)).toBeInTheDocument()
  })

  it('collapses and expands installment plan suggestions', async () => {
    const groups = [{
      invoiceId: 1,
      invoiceNumber: 'INV-001',
      totalAmount: 500,
      alreadyMatchedAmount: 0,
      alreadyMatchedCount: 0,
      expectedInstallments: 2,
      existingMatches: [],
      suggestedTransactions: [{ transactionId: 20, description: 'Payment 1', amount: 250 }],
    }]

    render(<InstallmentMatchGroups {...baseProps} query={{ isLoading: false, data: groups }} />)
    expect(screen.getByText('INV-001')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /collapse installment plan suggestions/i }))

    await waitFor(() => {
      expect(screen.queryByText('INV-001')).not.toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /expand installment plan suggestions/i }))

    expect(await screen.findByText('INV-001')).toBeInTheDocument()
  })
})
