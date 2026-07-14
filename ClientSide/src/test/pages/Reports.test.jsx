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

  it('renders the main heading', async () => {
    mockGetReconciliationReport.mockResolvedValue(null)
    mockGetPayablesAgingReport.mockResolvedValue(null)
    renderPage()
    expect(await screen.findByText('Financial Integrity Reports')).toBeInTheDocument()
  })

  it('shows company name in subtitle', async () => {
    mockGetReconciliationReport.mockResolvedValue(null)
    mockGetPayablesAgingReport.mockResolvedValue(null)
    renderPage()
    expect(await screen.findByText(/Acme Corp/)).toBeInTheDocument()
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
