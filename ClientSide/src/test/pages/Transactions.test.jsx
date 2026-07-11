import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TransactionsPage from '../../pages/Transactions'

const queryClient = new QueryClient()

const mockTransactionRows = [
  { id: 1, transactionDate: '2025-06-01', description: 'Office supplies', vendorName: 'OfficeMax', chargeAmount: 150.50, transactionType: 'debit', category: 'Supplies', isMatched: false },
  { id: 2, transactionDate: '2025-06-02', description: 'Consulting fees', vendorName: 'ConsultCo', chargeAmount: 5000.00, transactionType: 'credit', category: 'Services', isMatched: true },
]

let mockTransactionsQuery = { data: { items: mockTransactionRows, totalCount: 2 }, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }

vi.mock('../../hooks/queries/useTransactionsQueries', () => ({
  useTransactionsByCompanyQuery: () => mockTransactionsQuery,
  useCreateTransactionsBulkMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('../../context/useNotification', () => ({
  useNotification: () => ({ notify: vi.fn() }),
}))

vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({ token: 'test-token' }),
}))

vi.mock('../../context/useCompany', () => ({
  useCompany: () => ({ activeCompanyId: 1 }),
}))

vi.mock('../../context/useRealtime', () => ({
  useRealtime: () => ({ isConnected: true, subscribe: vi.fn(), unsubscribe: vi.fn() }),
}))

const mockConfirm = vi.fn().mockResolvedValue(true)

vi.mock('../../components/ConfirmContext', () => ({
  useConfirm: () => ({ confirm: mockConfirm }),
}))

vi.mock('../../components/TransactionDetailsModal', () => ({
  default: ({ open, loading, error, transaction, onClose }) =>
    open ? <div data-testid="details-modal">Transaction Details</div> : null,
}))

vi.mock('../../hooks/useTransactionUpload', () => ({
  useTransactionUpload: () => ({
    uploadedFiles: [],
    parsedRows: [],
    parseError: '',
    previewing: false,
    handleFiles: vi.fn(),
    removeRow: vi.fn(),
    clearUpload: vi.fn(),
    clearParseError: vi.fn(),
    validCount: 0,
    invalidCount: 0,
  }),
}))

vi.mock('../../hooks/useTransactionImportJobs', () => ({
  useTransactionImportJobs: () => ({
    importingJobs: [],
    saveTxJobToSession: vi.fn(),
    startTxPolling: vi.fn(),
    upsertImportingJob: vi.fn(),
  }),
}))

const mockGetTransactionById = vi.fn()
const mockDeleteTransaction = vi.fn()
const mockBulkDeleteTransactions = vi.fn()

vi.mock('../../services/transactions', () => ({
  getTransactionById: (...args) => mockGetTransactionById(...args),
  createTransactionsBulk: vi.fn(),
  deleteTransaction: (...args) => mockDeleteTransaction(...args),
  bulkDeleteTransactions: (...args) => mockBulkDeleteTransactions(...args),
  importExcelTransactions: vi.fn(),
  previewExcel: vi.fn(),
  setRequiresInvoice: vi.fn(),
}))

vi.mock('../../services/uploadJobs', () => ({
  getUploadJobStatus: vi.fn(),
}))

describe('TransactionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTransactionsQuery = { data: { items: mockTransactionRows, totalCount: 2 }, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
    mockGetTransactionById.mockResolvedValue({
      id: 1,
      transactionDate: '2025-06-01',
      description: 'Office supplies',
      vendorName: 'OfficeMax',
      chargeAmount: 150.50,
      transactionType: 'debit',
    })
    mockDeleteTransaction.mockResolvedValue({})
    mockBulkDeleteTransactions.mockResolvedValue({ deletedIds: [], notFoundIds: [] })
  })

  const renderPage = () => render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TransactionsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )

  it('renders page heading', () => {
    renderPage()
    expect(screen.getByText('Transactions')).toBeInTheDocument()
  })

  it('shows loading skeleton while fetching', () => {
    mockTransactionsQuery = { data: { items: [], totalCount: 0 }, isLoading: true, isFetching: true, error: null, refetch: vi.fn() }
    renderPage()
    const skeletons = document.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders transaction rows in table when data loads', () => {
    renderPage()
    expect(screen.getByText('OfficeMax')).toBeInTheDocument()
    expect(screen.getByText('ConsultCo')).toBeInTheDocument()
    expect(screen.getByText('Office supplies')).toBeInTheDocument()
    expect(screen.getByText('Consulting fees')).toBeInTheDocument()
  })

  it('shows empty state when no transactions', () => {
    mockTransactionsQuery = { data: { items: [], totalCount: 0 }, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
    renderPage()
    expect(screen.getByText('No transactions yet. Import a CSV above to get started.')).toBeInTheDocument()
  })

  it('shows search input', () => {
    renderPage()
    expect(screen.getByPlaceholderText('Search vendor, description, amount, date...')).toBeInTheDocument()
  })

  it('shows upload file button', () => {
    renderPage()
    expect(screen.getByText('Drop one or more CSV or Excel files here or click to browse')).toBeInTheDocument()
  })

  it('opens TransactionDetailsModal on view click', async () => {
    renderPage()
    const viewIcons = screen.getAllByTestId('VisibilityRoundedIcon')
    const viewButton = viewIcons[0].closest('button')
    await userEvent.click(viewButton)
    expect(mockGetTransactionById).toHaveBeenCalledWith(expect.any(Number), 'test-token')
    expect(screen.getByTestId('details-modal')).toBeInTheDocument()
  })

  it('shows error alert on query failure', () => {
    mockTransactionsQuery = { data: null, isLoading: false, isFetching: false, error: new Error('Failed to load'), refetch: vi.fn() }
    renderPage()
    expect(screen.getByText('Failed to load')).toBeInTheDocument()
  })

  it('renders pagination', () => {
    const manyRows = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, transactionDate: '2025-06-01', description: `Tx ${i + 1}`, vendorName: 'Vendor', chargeAmount: 100, transactionType: 'debit' }))
    mockTransactionsQuery = { data: { items: manyRows, totalCount: 25 }, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
    renderPage()
    expect(document.querySelector('.MuiTablePagination-root')).toBeInTheDocument()
  })

  it('shows export button', () => {
    renderPage()
    expect(screen.getByText('Export CSV')).toBeInTheDocument()
  })
})
