import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ReportsPage from '../../pages/Reports'

vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({ token: 'test-token' }),
}))

vi.mock('../../context/useCompany', () => ({
  useCompany: () => ({ companies: [{ id: 1, name: 'Acme Corp' }], activeCompanyId: 1 }),
}))

const mockReconciliationData = {
  rows: [
    {
      matchId: 1,
      reconciliationStatus: 'fully_matched',
      invoiceId: 101,
      invoiceNumber: 'INV-001',
      vendorName: 'Vendor A',
      invoiceDate: '2025-01-15',
      invoiceAmount: 1000,
      invoiceCurrency: 'USD',
      transactionId: 201,
      transactionDescription: 'Bank transfer',
      transactionDate: '2025-01-14',
      transactionAmount: 1000,
      matchMethod: 'exact',
      matchConfidence: 1,
    },
  ],
  summary: {
    ledgerEntryCount: 1,
    fullyMatchedLedgerCount: 1,
    partiallyMatchedLedgerCount: 0,
    unmatchedLedgerCount: 0,
    unmatchedBankTransactionCount: 0,
  },
  companyCurrency: 'USD',
}

const mockAgingData = {
  rows: [
    {
      invoiceId: 201,
      invoiceNumber: 'AGING-001',
      vendorName: 'Vendor B',
      invoiceDate: '2025-01-01',
      dueDate: '2025-01-31',
      effectiveDueDate: '2025-01-31',
      daysPastDue: 5,
      bucketLabel: '1-30 days',
      originalAmount: 2000,
      matchedAmount: 500,
      outstandingAmount: 1500,
      currency: 'USD',
      paymentStatus: 'partially_paid',
    },
  ],
  buckets: [{ key: 'current', label: 'Current', invoiceCount: 1, amountsByCurrency: [{ currency: 'USD', amount: 1500 }] }],
  totalInvoiceCount: 1,
  totalsByCurrency: [{ currency: 'USD', amount: 1500 }],
}

const multiRowReconciliationData = {
  ...mockReconciliationData,
  rows: [
    ...mockReconciliationData.rows,
    {
      matchId: 2,
      reconciliationStatus: 'ledger_only',
      invoiceId: 102,
      invoiceNumber: 'INV-OMEGA',
      vendorName: 'Omega Supplies',
      invoiceDate: '2025-02-03',
      invoiceAmount: 750,
      invoiceCurrency: 'USD',
      invoiceStatus: 'unmatched',
      transactionId: null,
      transactionDescription: null,
      transactionDate: null,
      transactionAmount: null,
      matchMethod: null,
      matchConfidence: null,
    },
  ],
  summary: {
    ledgerEntryCount: 2,
    fullyMatchedLedgerCount: 1,
    partiallyMatchedLedgerCount: 0,
    unmatchedLedgerCount: 1,
    unmatchedBankTransactionCount: 0,
  },
}

const multiRowAgingData = {
  ...mockAgingData,
  rows: [
    ...mockAgingData.rows,
    {
      invoiceId: 202,
      invoiceNumber: 'AGING-OMEGA',
      vendorName: 'Omega Services',
      invoiceDate: '2025-02-01',
      dueDate: '2025-03-01',
      effectiveDueDate: '2025-03-01',
      daysPastDue: 45,
      bucketLabel: '31-60 days',
      originalAmount: 3000,
      matchedAmount: 0,
      outstandingAmount: 3000,
      currency: 'USD',
      paymentStatus: 'unpaid',
    },
  ],
  buckets: [
    ...mockAgingData.buckets,
    { key: '31-60', label: '31-60 days', invoiceCount: 1, amountsByCurrency: [{ currency: 'USD', amount: 3000 }] },
  ],
  totalInvoiceCount: 2,
  totalsByCurrency: [{ currency: 'USD', amount: 4500 }],
}

const mockGetReconciliationReport = vi.fn()
const mockGetPayablesAgingReport = vi.fn()

vi.mock('../../services/reports', () => ({
  getReconciliationReport: (...args) => mockGetReconciliationReport(...args),
  getPayablesAgingReport: (...args) => mockGetPayablesAgingReport(...args),
}))

describe('ReportsPage', () => {
  const renderPage = () => render(<MemoryRouter><ReportsPage /></MemoryRouter>)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders ReportCatalog with Reconciliation Report header', async () => {
    mockGetReconciliationReport.mockResolvedValue(mockReconciliationData)
    mockGetPayablesAgingReport.mockResolvedValue(mockAgingData)
    renderPage()
    const headings = await screen.findAllByText('Reconciliation Report')
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it('selects reconciliation by default', async () => {
    mockGetReconciliationReport.mockResolvedValue(mockReconciliationData)
    mockGetPayablesAgingReport.mockResolvedValue(mockAgingData)
    renderPage()
    expect(await screen.findByLabelText('Start date')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Reconciliation Report/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByLabelText('As of date')).not.toBeInTheDocument()
  })

  it('renders reconciliation Start date input', async () => {
    mockGetReconciliationReport.mockResolvedValue(mockReconciliationData)
    mockGetPayablesAgingReport.mockResolvedValue(mockAgingData)
    renderPage()
    expect(await screen.findByLabelText('Start date')).toBeInTheDocument()
  })

  it('renders aging As of date input after clicking the aging tab', async () => {
    mockGetReconciliationReport.mockResolvedValue(mockReconciliationData)
    mockGetPayablesAgingReport.mockResolvedValue(mockAgingData)
    renderPage()
    fireEvent.click(await screen.findByRole('tab', { name: /Payables Aging/i }))
    expect(await screen.findByLabelText('As of date')).toBeInTheDocument()
  })

  it('shows reconciliation vendor name when data loads', async () => {
    mockGetReconciliationReport.mockResolvedValue(mockReconciliationData)
    mockGetPayablesAgingReport.mockResolvedValue(mockAgingData)
    renderPage()
    expect(await screen.findByText('Vendor A')).toBeInTheDocument()
    expect(screen.queryByText('AGING-001')).not.toBeInTheDocument()
  })

  it('shows aging invoice number when the aging tab is selected', async () => {
    mockGetReconciliationReport.mockResolvedValue(mockReconciliationData)
    mockGetPayablesAgingReport.mockResolvedValue(mockAgingData)
    renderPage()
    fireEvent.click(await screen.findByRole('tab', { name: /Payables Aging/i }))
    expect(await screen.findByText('AGING-001')).toBeInTheDocument()
  })

  it('shows Partially paid chip in aging table when the aging tab is selected', async () => {
    mockGetReconciliationReport.mockResolvedValue(mockReconciliationData)
    mockGetPayablesAgingReport.mockResolvedValue(mockAgingData)
    renderPage()
    fireEvent.click(await screen.findByRole('tab', { name: /Payables Aging/i }))
    expect(await screen.findByText('Partially paid')).toBeInTheDocument()
  })

  it('filters reconciliation rows by search text', async () => {
    mockGetReconciliationReport.mockResolvedValue(multiRowReconciliationData)
    mockGetPayablesAgingReport.mockResolvedValue(mockAgingData)
    renderPage()
    expect(await screen.findByText('Vendor A')).toBeInTheDocument()
    expect(screen.getByText('Omega Supplies')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Search reconciliation'), { target: { value: 'omega' } })

    expect(screen.getByText('Omega Supplies')).toBeInTheDocument()
    expect(screen.queryByText('Vendor A')).not.toBeInTheDocument()
    expect(screen.getByText('1 of 2 rows shown')).toBeInTheDocument()
  })

  it('filters aging rows by search text', async () => {
    mockGetReconciliationReport.mockResolvedValue(mockReconciliationData)
    mockGetPayablesAgingReport.mockResolvedValue(multiRowAgingData)
    renderPage()
    fireEvent.click(await screen.findByRole('tab', { name: /Payables Aging/i }))
    expect(await screen.findByText('AGING-001')).toBeInTheDocument()
    expect(screen.getByText('AGING-OMEGA')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Search payables aging'), { target: { value: 'omega' } })

    expect(screen.getByText('AGING-OMEGA')).toBeInTheDocument()
    expect(screen.queryByText('AGING-001')).not.toBeInTheDocument()
    expect(screen.getByText('1 of 2 rows shown')).toBeInTheDocument()
  })

  it('shows a search-specific empty state when reconciliation search has no matches', async () => {
    mockGetReconciliationReport.mockResolvedValue(mockReconciliationData)
    mockGetPayablesAgingReport.mockResolvedValue(mockAgingData)
    renderPage()
    expect(await screen.findByText('Vendor A')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Search reconciliation'), { target: { value: 'not-found' } })

    expect(screen.getByText('No reconciliation rows match your search')).toBeInTheDocument()
    expect(screen.getByText('0 of 1 rows shown')).toBeInTheDocument()
    expect(screen.queryByText('Vendor A')).not.toBeInTheDocument()
  })

  it('exports only visible reconciliation rows when search is active', async () => {
    const originalCreateObjectURL = globalThis.URL.createObjectURL
    const originalRevokeObjectURL = globalThis.URL.revokeObjectURL
    const createObjectURL = vi.fn(() => 'blob:report')
    const revokeObjectURL = vi.fn()
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    globalThis.URL.createObjectURL = createObjectURL
    globalThis.URL.revokeObjectURL = revokeObjectURL

    try {
      mockGetReconciliationReport.mockResolvedValue(multiRowReconciliationData)
      mockGetPayablesAgingReport.mockResolvedValue(mockAgingData)
      renderPage()
      expect(await screen.findByText('Omega Supplies')).toBeInTheDocument()

      fireEvent.change(screen.getByLabelText('Search reconciliation'), { target: { value: 'omega' } })
      expect(screen.queryByText('Vendor A')).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: /Export CSV/i }))

      expect(createObjectURL).toHaveBeenCalledTimes(1)
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:report')
      expect(clickSpy).toHaveBeenCalledTimes(1)

      const exportedText = await createObjectURL.mock.calls[0][0].text()
      expect(exportedText).toContain('Omega Supplies')
      expect(exportedText).toContain('INV-OMEGA')
      expect(exportedText).not.toContain('Vendor A')
      expect(exportedText).not.toContain('INV-001')
    } finally {
      if (originalCreateObjectURL) {
        globalThis.URL.createObjectURL = originalCreateObjectURL
      } else {
        delete globalThis.URL.createObjectURL
      }

      if (originalRevokeObjectURL) {
        globalThis.URL.revokeObjectURL = originalRevokeObjectURL
      } else {
        delete globalThis.URL.revokeObjectURL
      }

      clickSpy.mockRestore()
    }
  })

  it('shows error alert on reconciliation failure', async () => {
    mockGetReconciliationReport.mockRejectedValue(new Error('Reconciliation API error'))
    mockGetPayablesAgingReport.mockResolvedValue(mockAgingData)
    renderPage()
    expect(await screen.findByText(/Reconciliation API error/)).toBeInTheDocument()
  })

  it('shows error alert on aging failure', async () => {
    mockGetReconciliationReport.mockResolvedValue(mockReconciliationData)
    mockGetPayablesAgingReport.mockRejectedValue(new Error('Aging API error'))
    renderPage()
    fireEvent.click(await screen.findByRole('tab', { name: /Payables Aging/i }))
    expect(await screen.findByText(/Aging API error/)).toBeInTheDocument()
  })

  it('shows empty state when reconciliation has no rows', async () => {
    const emptyRecon = { ...mockReconciliationData, rows: [] }
    mockGetReconciliationReport.mockResolvedValue(emptyRecon)
    mockGetPayablesAgingReport.mockResolvedValue(mockAgingData)
    renderPage()
    expect(await screen.findByText('No reconciliation activity')).toBeInTheDocument()
  })

  it('renders View reconciliation and View aging buttons', async () => {
    mockGetReconciliationReport.mockResolvedValue(mockReconciliationData)
    mockGetPayablesAgingReport.mockResolvedValue(mockAgingData)
    renderPage()
    expect(await screen.findByText('View reconciliation')).toBeInTheDocument()
    expect(screen.getByText('View aging')).toBeInTheDocument()
  })

  it('switches tabs from the overview buttons', async () => {
    mockGetReconciliationReport.mockResolvedValue(mockReconciliationData)
    mockGetPayablesAgingReport.mockResolvedValue(mockAgingData)
    renderPage()
    fireEvent.click(await screen.findByText('View aging'))
    expect(await screen.findByLabelText('As of date')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Payables Aging/i })).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByText('View reconciliation'))
    expect(await screen.findByLabelText('Start date')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Reconciliation Report/i })).toHaveAttribute('aria-selected', 'true')
  })

  it('renders 1 fully matched chip', async () => {
    mockGetReconciliationReport.mockResolvedValue(mockReconciliationData)
    mockGetPayablesAgingReport.mockResolvedValue(mockAgingData)
    renderPage()
    expect(await screen.findByText('1 fully matched')).toBeInTheDocument()
  })
})
