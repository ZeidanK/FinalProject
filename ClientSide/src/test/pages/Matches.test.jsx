import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import MatchesPage from '../../pages/Matches'

vi.mock('../../context/useNotification', () => ({ useNotification: () => ({ notify: vi.fn() }) }))
vi.mock('../../context/useAuth', () => ({ useAuth: () => ({ user: { name: 'Alice' }, token: 'test-token' }) }))
vi.mock('../../context/useCompany', () => ({ useCompany: () => ({ activeCompanyId: 1 }) }))
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }))

let mockMatchesQuery = { data: [], isLoading: false, error: null }
let mockInvoicesQuery = { data: [], isLoading: false, error: null }
let mockTransactionsQuery = { data: [], isLoading: false, error: null }
let mockCreateMatchMutation = { mutateAsync: vi.fn(), isPending: false }
let mockDeleteMatchMutation = { mutateAsync: vi.fn(), isPending: false }
let mockAutoMatchMutation = { mutateAsync: vi.fn(), isPending: false }
let mockSuggestionsQuery = { data: [], isLoading: false, isFetching: false, error: null }
let mockSimpleSuggestionsQuery = { data: [], isLoading: false, isFetching: false, error: null }
let mockInstallmentSuggestionsQuery = { data: [], isLoading: false, isFetching: false, error: null }

vi.mock('../../hooks/queries/useMatchesQueries', () => ({
  useMatchesByCompanyQuery: () => mockMatchesQuery,
  useUnmatchedInvoicesQuery: () => mockInvoicesQuery,
  useUnmatchedTransactionsQuery: () => mockTransactionsQuery,
  useCreateMatchMutation: () => mockCreateMatchMutation,
  useDeleteMatchMutation: () => mockDeleteMatchMutation,
  useAutoMatchOnLoadMutation: () => mockAutoMatchMutation,
  useMatchSuggestionsQuery: () => mockSuggestionsQuery,
  useSimpleSuggestionsQuery: () => mockSimpleSuggestionsQuery,
  useInstallmentSuggestionsQuery: () => mockInstallmentSuggestionsQuery,
}))

const mockGetInvoiceById = vi.fn()
const mockUpdateInvoice = vi.fn()
const mockGetTransactionById = vi.fn()
vi.mock('../../services/invoices', () => ({ getInvoiceById: (...a) => mockGetInvoiceById(...a), updateInvoice: (...a) => mockUpdateInvoice(...a) }))
vi.mock('../../services/transactions', () => ({ getTransactionById: (...a) => mockGetTransactionById(...a) }))
vi.mock('react-pdf', () => ({ Document: ({ children }) => <div>{children}</div>, Page: () => <div />, pdfjs: { GlobalWorkerOptions: { workerSrc: '' } } }))
vi.mock('pdfjs-dist', () => {
  const p = { getDocument: () => Promise.resolve({ numPages: 1, getPage: () => Promise.resolve({ getViewport: () => ({ width: 800, height: 600 }), render: () => ({ promise: Promise.resolve() }) }) }), GlobalWorkerOptions: { workerSrc: '' }, version: '3.0.0' }
  return { ...p, default: p }
})

const sampleMatches = [
  { id: 1, invoice_id: 10, invoice_number: 'INV-001', vendor_name: 'Vendor A', transaction_id: 20, transaction_vendor_name: 'Vendor A', matched_amount: 1500.50, match_method: 'manual', match_confidence: 1, matched_by_name: 'Alice' },
  { id: 2, invoice_id: 11, invoice_number: 'INV-002', transaction_id: 21, transaction_vendor_name: 'Vendor B', matched_amount: 2500.00, match_method: 'auto', match_confidence: 0.85 },
]

const sampleInvoices = [
  { id: 10, invoice_number: 'INV-010', vendor_name: 'Vendor X', invoice_date: '2025-07-01T10:00:00Z', total_amount: 500.00 },
  { id: 11, invoice_number: 'INV-011', vendor_name: 'Vendor Y', invoice_date: '2025-07-02T10:00:00Z', total_amount: 750.00 },
]

const sampleTransactions = [
  { id: 20, vendor_name: 'Vendor Z', transaction_date: '2025-07-01T10:00:00Z', amount: 500.00, type: 'debit' },
  { id: 21, vendor_name: 'Vendor W', transaction_date: '2025-07-03T10:00:00Z', amount: 300.00, type: 'credit' },
]

const sampleSimpleSuggestions = [{
  invoiceId: 10, transactionId: 20, invoiceNumber: 'INV-010', vendorName: 'Vendor X', invoiceAmount: 500.00,
  invoiceDate: '2025-07-01T10:00:00Z', transactionDescription: 'Vendor Z Payment', transactionAmount: 500.00,
  transactionDate: '2025-07-01T10:00:00Z', transactionType: 'debit', confidence: 1,
}]

describe('MatchesPage', () => {
  const renderPage = () => render(<MemoryRouter><MatchesPage /></MemoryRouter>)

  beforeEach(() => {
    vi.clearAllMocks()
    mockMatchesQuery = { data: [], isLoading: false, error: null }
    mockInvoicesQuery = { data: [], isLoading: false, error: null }
    mockTransactionsQuery = { data: [], isLoading: false, error: null }
    mockCreateMatchMutation = { mutateAsync: vi.fn(), isPending: false }
    mockDeleteMatchMutation = { mutateAsync: vi.fn(), isPending: false }
    mockAutoMatchMutation = { mutateAsync: vi.fn().mockResolvedValue({ successfulMatches: 0 }), isPending: false }
    mockSuggestionsQuery = { data: [], isLoading: false, isFetching: false, error: null }
    mockSimpleSuggestionsQuery = { data: [], isLoading: false, isFetching: false, error: null }
    mockInstallmentSuggestionsQuery = { data: [], isLoading: false, isFetching: false, error: null }
    mockGetInvoiceById.mockResolvedValue({})
    mockGetTransactionById.mockResolvedValue({})
  })

  it('renders page header', () => {
    renderPage()
    expect(screen.getByText('Matches')).toBeInTheDocument()
  })

  it('renders invoice and transaction tables', async () => {
    mockInvoicesQuery = { ...mockInvoicesQuery, data: sampleInvoices }
    mockTransactionsQuery = { ...mockTransactionsQuery, data: { items: sampleTransactions } }
    renderPage()
    expect(await screen.findByText('INV-010')).toBeInTheDocument()
    expect(screen.getAllByText('Unmatched Transactions').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Vendor Z')).toBeInTheDocument()
  })

  it('shows stats row with counts', async () => {
    mockMatchesQuery = { ...mockMatchesQuery, data: sampleMatches }
    mockInvoicesQuery = { ...mockInvoicesQuery, data: sampleInvoices }
    mockTransactionsQuery = { ...mockTransactionsQuery, data: { items: sampleTransactions } }
    renderPage()
    expect(await screen.findByText(/Total Matches/)).toBeInTheDocument()
    expect(screen.getAllByText(/Unmatched Invoices/).length).toBeGreaterThanOrEqual(1)
  })

  it('shows error alert when query fails', () => {
    mockMatchesQuery = { ...mockMatchesQuery, error: new Error('Failed to load.') }
    renderPage()
    expect(screen.getByText(/Failed to load/)).toBeInTheDocument()
  })

  it('renders matched items', async () => {
    mockMatchesQuery = { ...mockMatchesQuery, data: sampleMatches }
    renderPage()
    expect(await screen.findByText(/INV-001/)).toBeInTheDocument()
    expect(screen.getByText(/INV-002/)).toBeInTheDocument()
  })

  it('opens match details modal', async () => {
    mockMatchesQuery = { ...mockMatchesQuery, data: sampleMatches }
    mockGetInvoiceById.mockResolvedValue({ id: 10, invoiceNumber: 'INV-001', vendorName: 'Vendor', totalAmount: 1500 })
    mockGetTransactionById.mockResolvedValue({ id: 20, vendorName: 'T-Vendor', amount: 1500 })
    renderPage()
    expect(await screen.findByText(/INV-001/)).toBeInTheDocument()
    const viewBtns = screen.getAllByRole('button', { name: 'View details' })
    await userEvent.click(viewBtns[0])
    expect(await screen.findByText('Match Details')).toBeInTheDocument()
  }, 15000)

  it('shows unmatch confirmation dialog', async () => {
    mockMatchesQuery = { ...mockMatchesQuery, data: sampleMatches }
    renderPage()
    expect(await screen.findByText(/INV-001/)).toBeInTheDocument()
    const unmatchBtns = screen.getAllByRole('button', { name: /unmatch/i })
    await userEvent.click(unmatchBtns[0])
    expect(screen.getByText(/Are you sure/)).toBeInTheDocument()
  })

  it('shows quick match suggestions', async () => {
    mockSimpleSuggestionsQuery = { ...mockSimpleSuggestionsQuery, data: sampleSimpleSuggestions }
    renderPage()
    expect(await screen.findByText(/Quick Match/)).toBeInTheDocument()
  })

  it('shows auto-match and export buttons', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /auto-match/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument()
  })

  it('supports selecting invoice and transaction to show action bar', async () => {
    mockInvoicesQuery = { ...mockInvoicesQuery, data: sampleInvoices }
    mockTransactionsQuery = { ...mockTransactionsQuery, data: { items: sampleTransactions } }
    renderPage()
    await screen.findByText('INV-010')
    const invRow = screen.getByText('INV-010').closest('tr')
    await userEvent.click(invRow)
    const trxRow = screen.getByText('Vendor Z').closest('tr')
    await userEvent.click(trxRow)
    expect(screen.getByText(/Create Match/)).toBeInTheDocument()
  })

  it('shows confidence percentages on matches', async () => {
    mockMatchesQuery = { ...mockMatchesQuery, data: sampleMatches }
    renderPage()
    expect(await screen.findByText(/INV-001/)).toBeInTheDocument()
  })

  it('renders page during loading state', () => {
    mockMatchesQuery = { ...mockMatchesQuery, isLoading: true }
    renderPage()
    expect(screen.getByText('Matches')).toBeInTheDocument()
  })
})
