import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import TransactionsPage from '../../pages/Transactions'

let mockTransactionsQuery = { data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }

vi.mock('../../hooks/queries/useTransactionsQueries', () => ({
  useTransactionsByCompanyQuery: () => mockTransactionsQuery,
}))

vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({ token: 'test-token' }),
}))

vi.mock('../../context/useCompany', () => ({
  useCompany: () => ({ activeCompanyId: 1 }),
}))

const mockConfirm = vi.fn().mockResolvedValue(true)

vi.mock('../../components/ConfirmContext', () => ({
  useConfirm: () => ({ confirm: mockConfirm }),
}))

vi.mock('../../components/TransactionDetailsModal', () => ({
  default: ({ open, loading, error, transaction, onClose }) =>
    open ? <div data-testid="details-modal">Transaction Details</div> : null,
}))

const mockGetTransactionById = vi.fn()
const mockCreateTransactionsBulk = vi.fn()
const mockDeleteTransaction = vi.fn()
const mockBulkDeleteTransactions = vi.fn()
const mockImportExcelTransactions = vi.fn()
const mockPreviewExcel = vi.fn()
const mockGetUploadJobStatus = vi.fn()

vi.mock('../../services/transactions', () => ({
  getTransactionById: (...args) => mockGetTransactionById(...args),
  createTransactionsBulk: (...args) => mockCreateTransactionsBulk(...args),
  deleteTransaction: (...args) => mockDeleteTransaction(...args),
  bulkDeleteTransactions: (...args) => mockBulkDeleteTransactions(...args),
  importExcelTransactions: (...args) => mockImportExcelTransactions(...args),
  previewExcel: (...args) => mockPreviewExcel(...args),
}))

vi.mock('../../services/uploadJobs', () => ({
  getUploadJobStatus: (...args) => mockGetUploadJobStatus(...args),
}))

const mockTransactionRows = [
  { id: 1, transactionDate: '2025-06-01', description: 'Office supplies', vendorName: 'OfficeMax', chargeAmount: 150.50, transactionType: 'debit', category: 'Supplies', isMatched: false },
  { id: 2, transactionDate: '2025-06-02', description: 'Consulting fees', vendorName: 'ConsultCo', chargeAmount: 5000.00, transactionType: 'credit', category: 'Services', isMatched: true },
]

describe('TransactionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTransactionsQuery = { data: mockTransactionRows, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
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
    <MemoryRouter>
      <TransactionsPage />
    </MemoryRouter>,
  )

  it('renders page heading', () => {
    renderPage()
    expect(screen.getByText('Transactions')).toBeInTheDocument()
  })

  it('shows loading skeleton while fetching', () => {
    mockTransactionsQuery = { data: [], isLoading: true, isFetching: true, error: null, refetch: vi.fn() }
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
    mockTransactionsQuery = { data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
    renderPage()
    expect(screen.getByText('No transactions yet. Import a CSV above to get started.')).toBeInTheDocument()
  })

  it('shows search input', () => {
    renderPage()
    expect(screen.getByPlaceholderText('Search vendor, description, amount, date...')).toBeInTheDocument()
  })

  it('shows type filter select', () => {
    renderPage()
    const typeElements = screen.getAllByText('Type')
    expect(typeElements.length).toBeGreaterThanOrEqual(1)
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
    mockTransactionsQuery = { data: Array.from({ length: 25 }, (_, i) => ({ id: i + 1, transactionDate: '2025-06-01', description: `Tx ${i + 1}`, vendorName: 'Vendor', chargeAmount: 100, transactionType: 'debit' })), isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
    renderPage()
    expect(document.querySelector('.MuiTablePagination-root')).toBeInTheDocument()
  })

  it('shows delete button for transactions', () => {
    renderPage()
    const dataRows = screen.getAllByRole('row').slice(1)
    expect(dataRows.length).toBe(2)
    const firstRowButtons = dataRows[0].querySelectorAll('button')
    expect(firstRowButtons.length).toBeGreaterThanOrEqual(2)
  })
})
