import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import InvoicesPage from '../../pages/Invoices'

vi.mock('../../context/useNotification', () => ({
  useNotification: () => ({ notify: vi.fn() }),
}))

vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({ user: { name: 'Alice' }, token: 'test-token' }),
}))

vi.mock('../../context/useCompany', () => ({
  useCompany: () => ({ activeCompanyId: 1 }),
}))

vi.mock('../../context/useRealtime', () => ({
  useRealtime: () => ({ isConnected: false, subscribe: vi.fn() }),
}))

vi.mock('../../components/ConfirmContext', () => ({
  useConfirm: () => ({ confirm: vi.fn() }),
}))

let mockInvoicesQuery = { data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
let mockUploadMutation = { mutateAsync: vi.fn(), isPending: false }
let mockCreateMutation = { mutateAsync: vi.fn(), isPending: false }
let mockUpdateMutation = { mutateAsync: vi.fn(), isPending: false }
let mockDeleteMutation = { mutateAsync: vi.fn(), isPending: false }
let mockBulkDeleteMutation = { mutateAsync: vi.fn(), isPending: false }

vi.mock('../../hooks/queries/useInvoicesQueries', () => ({
  useInvoicesByCompanyQuery: () => mockInvoicesQuery,
  useInvoiceByIdQuery: () => ({ data: null, isLoading: false }),
  useUploadInvoicePdfMutation: () => mockUploadMutation,
  useCreateInvoiceMutation: () => mockCreateMutation,
  useUpdateInvoiceMutation: () => mockUpdateMutation,
  useDeleteInvoiceMutation: () => mockDeleteMutation,
  useBulkDeleteInvoicesMutation: () => mockBulkDeleteMutation,
}))

const mockDownloadInvoicePdf = vi.fn()
const mockGetInvoiceById = vi.fn()

vi.mock('../../services/invoices', () => ({
  downloadInvoicePdf: (...args) => mockDownloadInvoicePdf(...args),
  getInvoiceById: (...args) => mockGetInvoiceById(...args),
}))

const mockDeleteUploadJob = vi.fn()
const mockDeleteUploadJobsByCompany = vi.fn()
const mockGetMyUploadJobs = vi.fn()
const mockGetUploadJobStatus = vi.fn()
const mockVerifyInvoiceUploadJob = vi.fn()
const mockVerifyInvoiceUploadJobs = vi.fn()

vi.mock('../../services/uploadJobs', () => ({
  deleteUploadJob: (...args) => mockDeleteUploadJob(...args),
  deleteUploadJobsByCompany: (...args) => mockDeleteUploadJobsByCompany(...args),
  getMyUploadJobs: (...args) => mockGetMyUploadJobs(...args),
  getUploadJobStatus: (...args) => mockGetUploadJobStatus(...args),
  verifyInvoiceUploadJob: (...args) => mockVerifyInvoiceUploadJob(...args),
  verifyInvoiceUploadJobs: (...args) => mockVerifyInvoiceUploadJobs(...args),
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

const sampleInvoices = [
  {
    id: 1,
    invoice_number: 'INV-001',
    vendor_name: 'Vendor A',
    invoice_date: '2025-06-01T10:00:00Z',
    total_amount: 1500.50,
    currency: 'USD',
    status: 'verified',
    ai_extraction_confidence: 0.95,
  },
  {
    id: 2,
    invoice_number: 'INV-002',
    vendor_name: 'Vendor B',
    invoice_date: '2025-06-15T10:00:00Z',
    total_amount: 2500.00,
    currency: 'EUR',
    status: 'uploaded',
    ai_extraction_confidence: null,
  },
  {
    id: 3,
    invoice_number: 'INV-003',
    vendor_name: 'Vendor C',
    invoice_date: '2025-06-10T10:00:00Z',
    total_amount: 3200.00,
    currency: 'USD',
    status: 'matched',
    ai_extraction_confidence: 0.88,
  },
]

describe('InvoicesPage', () => {
  const renderPage = () => render(<MemoryRouter><InvoicesPage /></MemoryRouter>)

  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoicesQuery = { data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
    mockUploadMutation = { mutateAsync: vi.fn(), isPending: false }
    mockCreateMutation = { mutateAsync: vi.fn(), isPending: false }
    mockUpdateMutation = { mutateAsync: vi.fn(), isPending: false }
    mockDeleteMutation = { mutateAsync: vi.fn(), isPending: false }
    mockBulkDeleteMutation = { mutateAsync: vi.fn(), isPending: false }
    mockGetMyUploadJobs.mockResolvedValue([])
  })

  it('renders PageHeaderCard with "Invoices" title', () => {
    renderPage()
    expect(screen.getByText('Invoices')).toBeInTheDocument()
  })

  it('shows loading skeleton while fetching invoices', () => {
    mockInvoicesQuery = { ...mockInvoicesQuery, isLoading: true, isFetching: true }
    renderPage()
    const skeletons = document.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty state when no invoices', () => {
    renderPage()
    expect(screen.getByText(/No invoices yet/)).toBeInTheDocument()
    expect(screen.getByText(/Upload a PDF above to get started/)).toBeInTheDocument()
  })

  it('renders invoice table when data loads', async () => {
    mockInvoicesQuery = { ...mockInvoicesQuery, data: sampleInvoices }
    renderPage()
    expect(await screen.findByText('INV-001')).toBeInTheDocument()
    expect(screen.getByText('INV-002')).toBeInTheDocument()
    expect(screen.getByText('INV-003')).toBeInTheDocument()
    expect(screen.getByText('Vendor A')).toBeInTheDocument()
    expect(screen.getByText('Vendor B')).toBeInTheDocument()
    expect(screen.getByText('Vendor C')).toBeInTheDocument()
  })

  it('renders status chips for invoices', async () => {
    mockInvoicesQuery = { ...mockInvoicesQuery, data: sampleInvoices }
    renderPage()
    expect(await screen.findByText('verified')).toBeInTheDocument()
    expect(screen.getByText('uploaded')).toBeInTheDocument()
    expect(screen.getByText('matched')).toBeInTheDocument()
  })

  it('renders action buttons (view/download, edit, delete) for each row', async () => {
    mockInvoicesQuery = { ...mockInvoicesQuery, data: sampleInvoices }
    renderPage()
    await screen.findByText('INV-001')
    const downloadBtns = screen.getAllByRole('button', { name: /download/i })
    const editBtns = screen.getAllByRole('button', { name: /edit/i })
    const deleteBtns = screen.getAllByRole('button', { name: /^delete invoice$/i })
    expect(downloadBtns.length).toBe(3)
    expect(editBtns.length).toBe(2)
    expect(deleteBtns.length).toBe(3)
  })

  it('shows error alert on query failure', async () => {
    mockInvoicesQuery = { ...mockInvoicesQuery, data: [], error: new Error('Failed to load invoices.') }
    renderPage()
    expect(await screen.findByText(/Failed to load invoices/)).toBeInTheDocument()
  })

  it('shows upload drop zone with file input', () => {
    renderPage()
    expect(screen.getByText(/Drop files here or click to browse/)).toBeInTheDocument()
    expect(screen.getByText(/application\/pdf files only/)).toBeInTheDocument()
  })

  it('shows auto-verify switch', () => {
    renderPage()
    expect(screen.getByText(/Auto-verify invoices with 90% confidence or higher/)).toBeInTheDocument()
  })

  it('shows local model warning when extraction toggle is enabled', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByText(/Use local model instead of Gemini/)).toBeInTheDocument()
    expect(screen.queryByText(/less accurate than Gemini/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('switch', { name: /Use local model instead of Gemini/i }))

    expect(screen.getByText(/Local model is less accurate than Gemini/)).toBeInTheDocument()
  })

  it('renders invoice record count in table header', async () => {
    mockInvoicesQuery = { ...mockInvoicesQuery, data: sampleInvoices }
    renderPage()
    expect(await screen.findByText(/Invoice Records/)).toBeInTheDocument()
    expect(screen.getByText(/\(3\)/)).toBeInTheDocument()
  })

  it('renders sortable table columns', async () => {
    mockInvoicesQuery = { ...mockInvoicesQuery, data: sampleInvoices }
    renderPage()
    await screen.findByText('INV-001')
    expect(screen.getByText('Invoice #')).toBeInTheDocument()
    expect(screen.getByText('Vendor')).toBeInTheDocument()
    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('Currency')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Confidence')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('renders confidence percentage when available', async () => {
    mockInvoicesQuery = { ...mockInvoicesQuery, data: sampleInvoices }
    renderPage()
    expect(await screen.findByText('95%')).toBeInTheDocument()
    expect(screen.getByText('88%')).toBeInTheDocument()
  })
})
