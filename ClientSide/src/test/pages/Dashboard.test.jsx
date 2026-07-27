import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardPage from '../../pages/Dashboard'

vi.mock('../../context/useNotification', () => ({
  useNotification: () => ({ notify: vi.fn() }),
}))

vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({ user: { name: 'Alice' }, token: 'test-token' }),
}))

vi.mock('../../context/useCompany', () => ({
  useCompany: () => ({ activeCompanyId: 1 }),
}))

vi.mock('../../hooks/useAnimatedCounter', () => ({
  default: ({ end }) => Math.round(end),
}))

const mockStats = {
  unmatchedTransactions: 5,
  unmatchedInvoices: 3,
  openAnomalies: 2,
  criticalAnomalies: 1,
  totalMatches: 10,
  processingInvoices: 1,
}

const mockActivity = [
  { date: '2025-01-15T10:00:00Z', text: 'Invoice INV-001 from Vendor A — uploaded' },
]

const mockGetDashboardStats = vi.fn()
const mockGetRecentActivity = vi.fn()

vi.mock('../../services/dashboard', () => ({
  getDashboardStats: (...args) => mockGetDashboardStats(...args),
  getRecentActivity: (...args) => mockGetRecentActivity(...args),
  mapDashboardStatsToKpis: (stats) => {
    if (!stats) return []
    return [
      { title: 'Pending Matches', value: String(stats.unmatchedTransactions), subtitle: 'Transactions awaiting review' },
      { title: 'Pending Invoice Matches', value: String(stats.unmatchedInvoices), subtitle: 'Invoices awaiting review' },
      { title: 'Exceptions', value: String(stats.openAnomalies), subtitle: 'Items with anomalies detected' },
      { title: 'Total Matches', value: String(stats.totalMatches), subtitle: 'Approved invoice to transaction links' },
    ]
  },
}))

describe('DashboardPage', () => {
  const renderPage = () => render(<MemoryRouter><DashboardPage /></MemoryRouter>)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders KPI cards when data loads', async () => {
    mockGetDashboardStats.mockResolvedValue(mockStats)
    mockGetRecentActivity.mockResolvedValue(mockActivity)
    renderPage()
    expect(await screen.findByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('shows error alert on failure', async () => {
    mockGetDashboardStats.mockRejectedValue(new Error('Server error'))
    mockGetRecentActivity.mockResolvedValue(mockActivity)
    renderPage()
    expect(await screen.findByText(/Server error/)).toBeInTheDocument()
  })

  it('shows EmptyState when no stats and no error', async () => {
    mockGetDashboardStats.mockResolvedValue(null)
    mockGetRecentActivity.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('Dashboard data is not ready')).toBeInTheDocument()
  })

  it('renders quick action cards', async () => {
    mockGetDashboardStats.mockResolvedValue(mockStats)
    mockGetRecentActivity.mockResolvedValue(mockActivity)
    renderPage()
    expect(await screen.findByText('Upload Invoices')).toBeInTheDocument()
    expect(screen.getByText('Import Bank Statement')).toBeInTheDocument()
    expect(screen.getByText('Start Matching')).toBeInTheDocument()
  })

  it('renders RecentActivityTimeline when activity loads', async () => {
    mockGetDashboardStats.mockResolvedValue(mockStats)
    mockGetRecentActivity.mockResolvedValue(mockActivity)
    renderPage()
    expect(await screen.findByText('Recent activity')).toBeInTheDocument()
  })

  it('shows continue-where-you-left-off section with pending items', async () => {
    mockGetDashboardStats.mockResolvedValue(mockStats)
    mockGetRecentActivity.mockResolvedValue(mockActivity)
    renderPage()
    expect(await screen.findByText(/Continue where you left off/)).toBeInTheDocument()
    expect(screen.getByText(/1 invoice currently processing/)).toBeInTheDocument()
    expect(screen.getByText(/5 transactions? awaiting match review/)).toBeInTheDocument()
    expect(screen.getByText(/2 open anomali/)).toBeInTheDocument()
  })

  it('shows all-caught-up when no pending items', async () => {
    const emptyStats = { ...mockStats, processingInvoices: 0, unmatchedTransactions: 0, openAnomalies: 0 }
    mockGetDashboardStats.mockResolvedValue(emptyStats)
    mockGetRecentActivity.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText(/All caught up/)).toBeInTheDocument()
  })

})
