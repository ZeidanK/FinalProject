import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import MatchesPage from '../../pages/Matches'

vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({ user: { name: 'Alice' }, token: 'test-token' }),
}))

vi.mock('../../context/useCompany', () => ({
  useCompany: () => ({ activeCompanyId: 1 }),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

let mockMatchesQuery = { data: [], isLoading: false, error: null, isFetching: false, refetch: vi.fn() }
let mockInvoicesQuery = { data: [], isLoading: false, error: null, isFetching: false, refetch: vi.fn() }
let mockTransactionsQuery = { data: [], isLoading: false, error: null, isFetching: false, refetch: vi.fn() }
let mockCreateMatchMutation = { mutateAsync: vi.fn(), isPending: false }
let mockDeleteMatchMutation = { mutateAsync: vi.fn(), isPending: false }
let mockAutoMatchMutation = { mutateAsync: vi.fn(), isPending: false }
let mockSuggestionsQuery = { data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
let mockSimpleSuggestionsQuery = { data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
let mockInstallmentSuggestionsQuery = { data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }

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

vi.mock('../../services/invoices', () => ({
  getInvoiceById: (...args) => mockGetInvoiceById(...args),
  updateInvoice: (...args) => mockUpdateInvoice(...args),
}))

vi.mock('react-pdf', () => ({
  Document: ({ children }) => <div data-testid="pdf-document">{children}</div>,
  Page: ({ pageNumber }) => <div data-testid="pdf-page">Page {pageNumber}</div>,
  pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
}))

vi.mock('pdfjs-dist', () => {
  const FakeCanvas = { fake: true }
  const FakeDisplay = { fake: true }
  FakeDisplay.CanvasGraphics = FakeCanvas
  const pdfjs = {
    getDocument: () => Promise.resolve({ numPages: 1, getPage: () => Promise.resolve({ getViewport: () => ({ width: 800, height: 600 }), render: () => ({ promise: Promise.resolve() }) }) }),
    GlobalWorkerOptions: { workerSrc: '' },
    version: '3.0.0',
  }
  return { ...pdfjs, default: pdfjs }
})

const sampleMatches = [
  { id: 1, invoice_id: 10, invoice_number: 'INV-001', transaction_id: 20, transaction_vendor_name: 'Vendor A', matched_amount: 1500.50, match_method: 'manual', match_confidence: 1 },
  { id: 2, invoice_id: 11, invoice_number: 'INV-002', transaction_id: 21, transaction_vendor_name: 'Vendor B', matched_amount: 2500.00, match_method: 'auto', match_confidence: 0.85 },
]

const sampleUnmatchedInvoices = [
  { id: 10, invoice_number: 'INV-010', vendor_name: 'Vendor X', invoice_date: '2025-07-01T10:00:00Z', total_amount: 500.00 },
  { id: 11, invoice_number: 'INV-011', vendor_name: 'Vendor Y', invoice_date: '2025-07-02T10:00:00Z', total_amount: 750.00 },
]

const sampleUnmatchedTransactions = [
  { id: 20, vendor_name: 'Vendor Z', transaction_date: '2025-07-01T10:00:00Z', amount: 500.00, type: 'debit' },
  { id: 21, vendor_name: 'Vendor W', transaction_date: '2025-07-03T10:00:00Z', amount: 300.00, type: 'credit' },
]

const sampleSimpleSuggestions = [
  {
    invoiceId: 10,
    transactionId: 20,
    invoiceNumber: 'INV-010',
    vendorName: 'Vendor X',
    invoiceAmount: 500.00,
    invoiceDate: '2025-07-01T10:00:00Z',
    transactionDescription: 'Vendor Z Payment',
    transactionAmount: 500.00,
    transactionDate: '2025-07-01T10:00:00Z',
    transactionType: 'debit',
  },
]

const sampleInstallmentSuggestions = [
  {
    invoiceId: 1,
    invoiceNumber: 'INV-001',
    totalAmount: 500,
    alreadyMatchedAmount: 200,
    alreadyMatchedCount: 1,
    expectedInstallments: 3,
    existingMatches: [],
    suggestedTransactions: [],
  },
]

describe('MatchesPage', () => {
  const renderPage = () => render(<MemoryRouter><MatchesPage /></MemoryRouter>)

  beforeEach(() => {
    vi.clearAllMocks()
    mockMatchesQuery = { data: [], isLoading: false, error: null, isFetching: false, refetch: vi.fn() }
    mockInvoicesQuery = { data: [], isLoading: false, error: null, isFetching: false, refetch: vi.fn() }
    mockTransactionsQuery = { data: [], isLoading: false, error: null, isFetching: false, refetch: vi.fn() }
    mockCreateMatchMutation = { mutateAsync: vi.fn(), isPending: false }
    mockDeleteMatchMutation = { mutateAsync: vi.fn(), isPending: false }
    mockAutoMatchMutation = { mutateAsync: vi.fn().mockResolvedValue({ successfulMatches: 0 }), isPending: false }
    mockSuggestionsQuery = { data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
    mockSimpleSuggestionsQuery = { data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
    mockInstallmentSuggestionsQuery = { data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
  })

  it('renders PageHeaderCard with "Matches" title', () => {
    renderPage()
    expect(screen.getByText('Matches')).toBeInTheDocument()
  })

  it('shows loading skeleton when queries are loading', () => {
    mockMatchesQuery = { ...mockMatchesQuery, isLoading: true }
    mockInvoicesQuery = { ...mockInvoicesQuery, isLoading: true }
    mockTransactionsQuery = { ...mockTransactionsQuery, isLoading: true }
    renderPage()
    const skeletons = document.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBeGreaterThanOrEqual(1)
  })

  it('renders existing matches when data loads', async () => {
    mockMatchesQuery = { ...mockMatchesQuery, data: sampleMatches }
    renderPage()
    expect(await screen.findByText(/INV-001/)).toBeInTheDocument()
    expect(screen.getByText(/INV-002/)).toBeInTheDocument()
  })

  it('shows empty state when no matches exist', () => {
    renderPage()
    expect(screen.getByText(/No matches yet/)).toBeInTheDocument()
  })

  it('renders unmatched invoices section', async () => {
    mockInvoicesQuery = { ...mockInvoicesQuery, data: sampleUnmatchedInvoices }
    renderPage()
    const invoiceLabels = await screen.findAllByText('Unmatched Invoices')
    expect(invoiceLabels.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('INV-010')).toBeInTheDocument()
    expect(screen.getByText('INV-011')).toBeInTheDocument()
  })

  it('renders unmatched transactions section', async () => {
    mockTransactionsQuery = { ...mockTransactionsQuery, data: sampleUnmatchedTransactions }
    renderPage()
    const txnLabels = await screen.findAllByText('Unmatched Transactions')
    expect(txnLabels.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Vendor Z')).toBeInTheDocument()
    expect(screen.getByText('Vendor W')).toBeInTheDocument()
  })

  it('renders match suggestions with Quick Match Suggestions component', async () => {
    mockSimpleSuggestionsQuery = { ...mockSimpleSuggestionsQuery, data: sampleSimpleSuggestions }
    renderPage()
    expect(await screen.findByText('Quick Match Suggestions')).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
    expect(screen.getByText('Deny')).toBeInTheDocument()
  })

  it('renders InstallmentMatchGroups component', async () => {
    mockInstallmentSuggestionsQuery = { ...mockInstallmentSuggestionsQuery, data: sampleInstallmentSuggestions }
    renderPage()
    expect(await screen.findByText('Installment Plan Suggestions')).toBeInTheDocument()
    expect(screen.getByText(/INV-001/)).toBeInTheDocument()
  })

  it('renders stats cards with counts', async () => {
    mockMatchesQuery = { ...mockMatchesQuery, data: sampleMatches }
    mockInvoicesQuery = { ...mockInvoicesQuery, data: sampleUnmatchedInvoices }
    mockTransactionsQuery = { ...mockTransactionsQuery, data: sampleUnmatchedTransactions }
    renderPage()
    const invoiceLabels = await screen.findAllByText('Unmatched Invoices')
    expect(invoiceLabels.length).toBeGreaterThanOrEqual(1)
    const twos = screen.getAllByText('2')
    expect(twos.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Total Matches')).toBeInTheDocument()
  })

  it('shows error state when query fails', () => {
    mockMatchesQuery = { ...mockMatchesQuery, error: new Error('Failed to load matches.') }
    renderPage()
    expect(screen.getByText(/Failed to load matches/)).toBeInTheDocument()
  })

  it('renders invoice reopen button for unmatched invoices', async () => {
    mockInvoicesQuery = { ...mockInvoicesQuery, data: sampleUnmatchedInvoices }
    renderPage()
    await screen.findByText('INV-010')
    const reopenBtns = screen.getAllByRole('button', { name: /reopen/i })
    expect(reopenBtns.length).toBeGreaterThanOrEqual(1)
  })

  it('renders confidence chips for matches when available', async () => {
    mockMatchesQuery = { ...mockMatchesQuery, data: sampleMatches }
    renderPage()
    expect(await screen.findByText('100%')).toBeInTheDocument()
  })
})
