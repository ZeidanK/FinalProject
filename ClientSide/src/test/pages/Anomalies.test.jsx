import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AnomaliesPage from '../../pages/Anomalies'

vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({ user: { name: 'Alice' }, token: 'test-token' }),
}))

vi.mock('../../context/useCompany', () => ({
  useCompany: () => ({ activeCompanyId: 1 }),
}))

vi.mock('../../components/ConfirmContext', () => ({
  useConfirm: () => ({ confirm: vi.fn() }),
}))

let mockAnomaliesQuery = { data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
let mockDetailsQuery = { data: null, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
let mockStatsQuery = { data: null, isLoading: false, isFetching: false, error: null }
let mockResolveMutation = { mutateAsync: vi.fn(), isPending: false, reset: vi.fn() }

vi.mock('../../hooks/queries/useAnomaliesQueries', () => ({
  useAnomaliesListQuery: () => mockAnomaliesQuery,
  useAnomalyStatsQuery: () => mockStatsQuery,
  useAnomalyDetailsQuery: () => mockDetailsQuery,
  useResolveAnomalyMutation: () => mockResolveMutation,
}))

const mockKeepDuplicateInvoice = vi.fn()
vi.mock('../../services/anomalies', () => ({
  keepDuplicateInvoice: (...args) => mockKeepDuplicateInvoice(...args),
}))

const mockGetInvoiceById = vi.fn()
vi.mock('../../services/invoices', () => ({
  getInvoiceById: (...args) => mockGetInvoiceById(...args),
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

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

const sampleAnomalies = [
  {
    id: 1,
    anomalyType: 'amount_mismatch',
    title: 'Amount mismatch on INV-001',
    relatedItemsCount: 2,
    status: 'open',
    createdAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 2,
    anomalyType: 'duplicate',
    title: 'Duplicate invoice INV-002',
    relatedItemsCount: 3,
    status: 'resolved',
    createdAt: '2025-06-02T10:00:00Z',
  },
  {
    id: 3,
    anomalyType: 'missing_link',
    title: 'Missing link for TXN-003',
    relatedItemsCount: 1,
    status: 'dismissed',
    createdAt: '2025-06-03T10:00:00Z',
  },
]

const sampleStats = {
  byStatus: {
    open: 5,
    resolved: 10,
    dismissed: 2,
  },
}

const sampleOpenAnomaly = {
  id: 1,
  anomalyType: 'amount_mismatch',
  title: 'Amount mismatch on INV-001',
  description: 'The invoice amount does not match the transaction.',
  relatedItemsCount: 2,
  relatedItems: [
    { itemType: 'invoice', entityId: 101, label: 'INV-001', amount: 1000 },
    { itemType: 'transaction', entityId: 201, label: 'TXN-001', amount: 950 },
  ],
  status: 'open',
  detectionMethod: 'rule_based',
  detectionConfidence: 0.95,
  suggestedAction: 'Review the amounts',
  createdAt: '2025-06-01T10:00:00Z',
}

const sampleResolvedAnomaly = {
  id: 2,
  anomalyType: 'duplicate',
  title: 'Duplicate invoice INV-002',
  description: 'This invoice appears to be a duplicate.',
  relatedItemsCount: 3,
  relatedItems: [],
  status: 'resolved',
  detectionMethod: 'rule_based',
  detectionConfidence: 0.98,
  suggestedAction: 'Remove duplicate',
  resolvedAt: '2025-06-05T10:00:00Z',
  resolutionNotes: 'Confirmed duplicate, kept original.',
  createdAt: '2025-06-02T10:00:00Z',
}

describe('AnomaliesPage', () => {
  const renderPage = () => render(<MemoryRouter><AnomaliesPage /></MemoryRouter>)

  beforeEach(() => {
    vi.clearAllMocks()
    mockAnomaliesQuery = { data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
    mockDetailsQuery = { data: null, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
    mockStatsQuery = { data: null, isLoading: false, isFetching: false, error: null }
    mockResolveMutation = { mutateAsync: vi.fn(), isPending: false, reset: vi.fn() }
  })

  it('renders PageHeaderCard with "Anomalies" title', () => {
    renderPage()
    expect(screen.getByText('Anomalies')).toBeInTheDocument()
  })

  it('shows stats skeleton while loading', () => {
    mockStatsQuery = { ...mockStatsQuery, isLoading: true }
    renderPage()
    expect(screen.queryByText('17')).not.toBeInTheDocument()
    expect(screen.queryByText('All detected anomalies')).not.toBeInTheDocument()
  })

  it('renders stats cards when data loads', () => {
    mockStatsQuery = { ...mockStatsQuery, data: sampleStats }
    renderPage()
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('17')).toBeInTheDocument()
    expect(screen.getAllByText('Unresolved').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getAllByText('Resolved').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('Dismissed')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders filter controls (Status dropdown, Type dropdown, Search input)', () => {
    renderPage()
    expect(screen.getByPlaceholderText('Search title or description')).toBeInTheDocument()
    expect(screen.getByLabelText('Status')).toBeInTheDocument()
    expect(screen.getByLabelText('Type')).toBeInTheDocument()
  })

  it('shows loading skeletons in list', () => {
    mockAnomaliesQuery = { ...mockAnomaliesQuery, isLoading: true }
    renderPage()
    expect(screen.queryByText('No anomalies found')).not.toBeInTheDocument()
    expect(screen.queryByText('Amount mismatch on INV-001')).not.toBeInTheDocument()
  })

  it('shows empty state when no anomalies', () => {
    mockAnomaliesQuery = { ...mockAnomaliesQuery, data: [] }
    renderPage()
    expect(screen.getByText('No anomalies found')).toBeInTheDocument()
  })

  it('renders anomaly rows in table', () => {
    mockAnomaliesQuery = { ...mockAnomaliesQuery, data: sampleAnomalies }
    mockStatsQuery = { ...mockStatsQuery, data: sampleStats }
    renderPage()
    expect(screen.getByText('Amount mismatch on INV-001')).toBeInTheDocument()
    expect(screen.getByText('Duplicate invoice INV-002')).toBeInTheDocument()
    expect(screen.getByText('Missing link for TXN-003')).toBeInTheDocument()
  })

  it('shows details button for each row', () => {
    mockAnomaliesQuery = { ...mockAnomaliesQuery, data: sampleAnomalies }
    mockStatsQuery = { ...mockStatsQuery, data: sampleStats }
    renderPage()
    const detailsButtons = screen.getAllByRole('button', { name: /details/i })
    expect(detailsButtons.length).toBe(3)
  })

  it('opens details dialog on button click', async () => {
    mockAnomaliesQuery = { ...mockAnomaliesQuery, data: sampleAnomalies }
    mockStatsQuery = { ...mockStatsQuery, data: sampleStats }
    mockDetailsQuery = { ...mockDetailsQuery, data: sampleOpenAnomaly }
    renderPage()
    const detailsButtons = screen.getAllByRole('button', { name: /details/i })
    await userEvent.click(detailsButtons[0])
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Anomaly Details')).toBeInTheDocument()
  })

  it('shows resolution form for open anomalies', async () => {
    mockAnomaliesQuery = { ...mockAnomaliesQuery, data: sampleAnomalies }
    mockStatsQuery = { ...mockStatsQuery, data: sampleStats }
    mockDetailsQuery = { ...mockDetailsQuery, data: sampleOpenAnomaly }
    renderPage()
    const detailsButtons = screen.getAllByRole('button', { name: /details/i })
    await userEvent.click(detailsButtons[0])
    expect(screen.getByLabelText('Resolution Notes')).toBeInTheDocument()
  })

  it('shows Dismiss and Resolve buttons for open anomalies', async () => {
    mockAnomaliesQuery = { ...mockAnomaliesQuery, data: sampleAnomalies }
    mockStatsQuery = { ...mockStatsQuery, data: sampleStats }
    mockDetailsQuery = { ...mockDetailsQuery, data: sampleOpenAnomaly }
    renderPage()
    const detailsButtons = screen.getAllByRole('button', { name: /details/i })
    await userEvent.click(detailsButtons[0])
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /resolve/i })).toBeInTheDocument()
  })

  it('calls resolve mutation on Resolve click', async () => {
    mockAnomaliesQuery = { ...mockAnomaliesQuery, data: sampleAnomalies }
    mockStatsQuery = { ...mockStatsQuery, data: sampleStats }
    mockDetailsQuery = { ...mockDetailsQuery, data: sampleOpenAnomaly }
    mockResolveMutation = { ...mockResolveMutation, mutateAsync: vi.fn().mockResolvedValue({}) }
    renderPage()
    const detailsButtons = screen.getAllByRole('button', { name: /details/i })
    await userEvent.click(detailsButtons[0])
    const resolveBtn = screen.getByRole('button', { name: /resolve/i })
    await userEvent.click(resolveBtn)
    expect(mockResolveMutation.mutateAsync).toHaveBeenCalled()
  })

  it('shows success snackbar after resolve', async () => {
    mockAnomaliesQuery = { ...mockAnomaliesQuery, data: sampleAnomalies }
    mockStatsQuery = { ...mockStatsQuery, data: sampleStats }
    mockDetailsQuery = { ...mockDetailsQuery, data: sampleOpenAnomaly }
    mockResolveMutation = { ...mockResolveMutation, mutateAsync: vi.fn().mockResolvedValue({}) }
    renderPage()
    const detailsButtons = screen.getAllByRole('button', { name: /details/i })
    await userEvent.click(detailsButtons[0])
    const resolveBtn = screen.getByRole('button', { name: /resolve/i })
    await userEvent.click(resolveBtn)
    expect(await screen.findByText(/anomaly resolved successfully/i)).toBeInTheDocument()
  })

  it('shows error snackbar on resolve failure', async () => {
    mockAnomaliesQuery = { ...mockAnomaliesQuery, data: sampleAnomalies }
    mockStatsQuery = { ...mockStatsQuery, data: sampleStats }
    mockDetailsQuery = { ...mockDetailsQuery, data: sampleOpenAnomaly }
    mockResolveMutation = { ...mockResolveMutation, mutateAsync: vi.fn().mockRejectedValue(new Error('API error')) }
    renderPage()
    const detailsButtons = screen.getAllByRole('button', { name: /details/i })
    await userEvent.click(detailsButtons[0])
    const resolveBtn = screen.getByRole('button', { name: /resolve/i })
    await userEvent.click(resolveBtn)
    expect(await screen.findByText(/API error/)).toBeInTheDocument()
  })

  it('shows resolved/dismissed details for non-open anomalies', async () => {
    mockAnomaliesQuery = { ...mockAnomaliesQuery, data: sampleAnomalies }
    mockStatsQuery = { ...mockStatsQuery, data: sampleStats }
    mockDetailsQuery = { ...mockDetailsQuery, data: sampleResolvedAnomaly }
    renderPage()
    const detailsButtons = screen.getAllByRole('button', { name: /details/i })
    await userEvent.click(detailsButtons[1])
    await screen.findByRole('dialog')
    expect(screen.getByText(/Confirmed duplicate/)).toBeInTheDocument()
    const resolvedEls = screen.getAllByText('Resolved')
    expect(resolvedEls.length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /resolve/i })).not.toBeInTheDocument()
  })

  it('renders severity/status chips correctly', () => {
    mockAnomaliesQuery = { ...mockAnomaliesQuery, data: sampleAnomalies }
    mockStatsQuery = { ...mockStatsQuery, data: sampleStats }
    renderPage()
    expect(screen.getAllByText('Unresolved').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Resolved').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Dismissed').length).toBeGreaterThanOrEqual(1)
  })
})
