import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import MatchesPage from '../../pages/Matches'

vi.mock('../../context/useNotification', () => ({
  useNotification: () => ({ notify: vi.fn() }),
}))

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
const mockGetTransactionById = vi.fn()

vi.mock('../../services/invoices', () => ({
  getInvoiceById: (...args) => mockGetInvoiceById(...args),
  updateInvoice: (...args) => mockUpdateInvoice(...args),
}))

vi.mock('../../services/transactions', () => ({
  getTransactionById: (...args) => mockGetTransactionById(...args),
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
  {
    id: 1,
    invoice_id: 10,
    invoice_number: 'INV-001',
    vendor_name: 'Invoice Vendor A',
    invoice_amount: 1500.50,
    invoice_date: '2025-07-01T10:00:00Z',
    transaction_id: 20,
    transaction_vendor_name: 'Vendor A',
    transaction_description: 'Card payment to Vendor A',
    transaction_date: '2025-07-03T10:00:00Z',
    transaction_amount: 1500.50,
    transaction_type: 'debit',
    matched_amount: 1500.50,
    match_type: 'full',
    match_method: 'manual',
    match_confidence: 1,
    match_reason: 'Confirmed by user',
    matched_by_name: 'Alice',
    created_at: '2025-07-04T10:00:00Z',
  },
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
    mockGetInvoiceById.mockResolvedValue({})
    mockGetTransactionById.mockResolvedValue({})
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
    await userEvent.click(screen.getByRole('button', { name: /expand matched items/i }))
    expect(await screen.findByText(/INV-001/)).toBeInTheDocument()
    expect(screen.getByText(/INV-002/)).toBeInTheDocument()
  })

  it('opens match details from matched items view button', async () => {
    mockMatchesQuery = {
      ...mockMatchesQuery,
      data: [
        {
          ...sampleMatches[0],
          vendor_name: null,
          invoice_date: null,
          transaction_description: null,
          transaction_type: null,
        },
      ],
    }
    mockGetInvoiceById.mockResolvedValue({
      id: 10,
      invoiceNumber: 'INV-001-FULL',
      vendorName: 'Fetched Invoice Vendor',
      invoiceDate: '2025-07-05T10:00:00Z',
      dueDate: '2025-08-05T10:00:00Z',
      totalAmount: 1500.50,
      status: 'verified',
      currency: 'ILS',
      lastFourDigitsCard: '1234',
    })
    mockGetTransactionById.mockResolvedValue({
      id: 20,
      vendorName: 'Fetched Transaction Vendor',
      description: 'Fetched transaction description',
      transactionDate: '2025-07-06T10:00:00Z',
      postedDate: '2025-07-07T10:00:00Z',
      amount: 1500.50,
      transactionType: 'debit',
      chargeAmount: 1500.50,
      referenceNumber: 'REF-20',
      category: 'Travel',
      cardLast4: '9876',
    })

    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /expand matched items/i }))
    await screen.findByText(/INV-001/)

    await userEvent.click(screen.getAllByRole('button', { name: /view match details/i })[0])

    expect(await screen.findByRole('heading', { name: 'Match Details' })).toBeInTheDocument()
    await waitFor(() => expect(mockGetInvoiceById).toHaveBeenCalledWith(10, 'test-token'))
    await waitFor(() => expect(mockGetTransactionById).toHaveBeenCalledWith(20, 'test-token'))
    expect(screen.getByText('Match')).toBeInTheDocument()
    expect(screen.getByText('Invoice')).toBeInTheDocument()
    expect(screen.getByText('Transaction')).toBeInTheDocument()
    expect(await screen.findByText('INV-001-FULL')).toBeInTheDocument()
    expect(screen.getByText('Fetched Invoice Vendor')).toBeInTheDocument()
    expect(screen.getByText('Fetched Transaction Vendor')).toBeInTheDocument()
    expect(screen.getByText('Fetched transaction description')).toBeInTheDocument()
    expect(screen.getByText('REF-20')).toBeInTheDocument()
    expect(screen.getByText('Confirmed by user')).toBeInTheDocument()
  })

  it('shows empty state when no matches exist', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /expand matched items/i }))
    expect(screen.getByText(/No matches yet/)).toBeInTheDocument()
  })

  it('renders matched items collapsed at the bottom of the page', async () => {
    mockMatchesQuery = { ...mockMatchesQuery, data: sampleMatches }
    mockInstallmentSuggestionsQuery = { ...mockInstallmentSuggestionsQuery, data: sampleInstallmentSuggestions }
    renderPage()

    const installmentHeading = await screen.findByText('Installment Plan Suggestions')
    const matchedHeading = screen.getByText(/Matched Items \(2\)/)

    expect(screen.queryByText(/Vendor A/)).not.toBeInTheDocument()
    expect(installmentHeading.compareDocumentPosition(matchedHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
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
    mockTransactionsQuery = { ...mockTransactionsQuery, data: { items: sampleUnmatchedTransactions } }
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

  it('confirms installment suggestions with the normalized suggestion amount', async () => {
    mockInstallmentSuggestionsQuery = {
      ...mockInstallmentSuggestionsQuery,
      data: [
        {
          invoiceId: 110,
          invoiceNumber: 'INV-TGT-2025-0825',
          vendorName: 'TravelGo Tickets',
          totalAmount: 2100,
          alreadyMatchedAmount: 0,
          alreadyMatchedCount: 0,
          expectedInstallments: 4,
          existingMatches: [],
          suggestedTransactions: [
            {
              transactionId: 1184,
              transactionDate: '2025-08-25T00:00:00Z',
              postedDate: '2025-09-02T00:00:00Z',
              description: 'Payment 1 of 4 | PLAN-TGT-2025-0825',
              vendorName: 'TRAVELGO TICKETS',
              amount: 525,
              chargeAmount: -525,
            },
          ],
        },
      ],
    }

    renderPage()
    expect(await screen.findByText('TRAVELGO TICKETS')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /^confirm$/i }))

    await waitFor(() => {
      expect(mockCreateMatchMutation.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
        invoiceId: 110,
        transactionId: 1184,
        matchedAmount: 525,
        matchMethod: 'installment_simple',
        matchType: 'partial',
        installmentNumber: 1,
      }))
    })
  })

  it('renders stats cards with counts', async () => {
    mockMatchesQuery = { ...mockMatchesQuery, data: sampleMatches }
    mockInvoicesQuery = { ...mockInvoicesQuery, data: sampleUnmatchedInvoices }
    mockTransactionsQuery = { ...mockTransactionsQuery, data: { items: sampleUnmatchedTransactions } }
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

  it('renders invoice edit button for unmatched invoices', async () => {
    mockInvoicesQuery = { ...mockInvoicesQuery, data: sampleUnmatchedInvoices }
    renderPage()
    await screen.findByText('INV-010')
    const editBtns = screen.getAllByRole('button', { name: /edit/i })
    expect(editBtns.length).toBeGreaterThanOrEqual(1)
  })

  it('renders confidence chips for matches when available', async () => {
    mockMatchesQuery = { ...mockMatchesQuery, data: sampleMatches }
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /expand matched items/i }))
    expect(await screen.findByText('100%')).toBeInTheDocument()
  })

  it('shows pagination when many invoices', async () => {
    const manyInvoices = Array.from({ length: 25 }, (_, i) => ({
      id: 100 + i,
      invoice_number: `INV-MANY-${i}`,
      vendor_name: `Vendor ${i}`,
      invoice_date: '2025-07-01T10:00:00Z',
      total_amount: 100 + i,
    }))
    mockInvoicesQuery = { ...mockInvoicesQuery, data: manyInvoices }
    renderPage()
    expect(await screen.findByLabelText(/unmatched invoices list/i)).toBeInTheDocument()
    const pagination = document.querySelector('.MuiPagination-root')
    expect(pagination).toBeInTheDocument()
  })

  it('supports keyboard navigation on invoice items', async () => {
    mockInvoicesQuery = { ...mockInvoicesQuery, data: sampleUnmatchedInvoices }
    renderPage()
    await screen.findByText('INV-010')
    const items = screen.getAllByRole('button', { name: /INV-010|INV-011/ })
    expect(items.length).toBeGreaterThanOrEqual(1)
  })

  it('shows undo button when quick match suggestions are denied', async () => {
    mockSimpleSuggestionsQuery = { ...mockSimpleSuggestionsQuery, data: sampleSimpleSuggestions }
    renderPage()
    expect(await screen.findByText('Quick Match Suggestions')).toBeInTheDocument()
    const denyBtns = screen.getAllByRole('button', { name: /deny/i })
    await userEvent.click(denyBtns[0])
    const undoBtn = await screen.findByRole('button', { name: /undo 1 skipped/i }, { timeout: 2000 })
    expect(undoBtn).toBeInTheDocument()
  })

  it('shows match action bar when invoice and transaction selected', async () => {
    mockInvoicesQuery = { ...mockInvoicesQuery, data: sampleUnmatchedInvoices }
    mockTransactionsQuery = { ...mockTransactionsQuery, data: { items: sampleUnmatchedTransactions } }
    renderPage()
    await screen.findByText('INV-010')
    const invoiceItem = screen.getByRole('button', { name: /INV-010/ })
    await userEvent.click(invoiceItem)
    const transactionItem = screen.getByRole('button', { name: /Vendor Z/ })
    await userEvent.click(transactionItem)
    expect(screen.getByRole('button', { name: /create match/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
  })

  it('clears selection when clear button clicked', async () => {
    mockInvoicesQuery = { ...mockInvoicesQuery, data: sampleUnmatchedInvoices }
    mockTransactionsQuery = { ...mockTransactionsQuery, data: { items: sampleUnmatchedTransactions } }
    renderPage()
    await screen.findByText('INV-010')
    const invoiceItem = screen.getByRole('button', { name: /INV-010/ })
    await userEvent.click(invoiceItem)
    const transactionItem = screen.getByRole('button', { name: /Vendor Z/ })
    await userEvent.click(transactionItem)
    await userEvent.click(screen.getByRole('button', { name: /clear/i }))
    expect(screen.queryByRole('button', { name: /create match/i })).not.toBeInTheDocument()
  })

  it('shows no-invoice-expected section when transactions have requiresInvoice=false', async () => {
    const noInvoiceTxns = [
      { id: 30, vendor_name: 'Internal Transfer', transaction_date: '2025-07-01T10:00:00Z', amount: 1000, requiresInvoice: false },
    ]
    mockTransactionsQuery = { ...mockTransactionsQuery, data: { items: noInvoiceTxns } }
    renderPage()
    expect(await screen.findByText(/No Invoice Expected/i)).toBeInTheDocument()
  })
})
