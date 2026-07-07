import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminPortalPage from '../../pages/AdminPortal'

let mockStatsQuery = { data: null, isLoading: false, error: null }
let mockUsersQuery = { data: null, isLoading: false, error: null }
let mockLogsQuery = { data: null, isLoading: false, error: null }
let mockAuditQuery = { data: null, isLoading: false, error: null }
let mockToggleBan = { mutateAsync: vi.fn(), isPending: false }
let mockClearLogs = { mutateAsync: vi.fn(), isPending: false }
let mockClearAuditLogs = { mutateAsync: vi.fn(), isPending: false }
let mockDeleteLog = { mutateAsync: vi.fn(), isPending: false }
let mockDeleteAuditLog = { mutateAsync: vi.fn(), isPending: false }

vi.mock('../../hooks/queries/useAdminQueries', () => ({
  useAdminStatsQuery: () => mockStatsQuery,
  useAdminUsersQuery: () => mockUsersQuery,
  useAdminLogsQuery: () => mockLogsQuery,
  useAdminAuditQuery: () => mockAuditQuery,
  useToggleAdminUserBanMutation: () => mockToggleBan,
  useClearAdminLogsMutation: () => mockClearLogs,
  useClearAdminAuditLogsMutation: () => mockClearAuditLogs,
  useDeleteAdminLogMutation: () => mockDeleteLog,
  useDeleteAdminAuditLogMutation: () => mockDeleteAuditLog,
}))

vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Admin' }, token: 'test-token' }),
}))

vi.mock('../../context/useNotification', () => ({
  useNotification: () => ({ notify: vi.fn() }),
}))

vi.mock('../../components/SnackbarAlert', () => ({
  default: ({ open, message }) => (open ? <div data-testid="snackbar">{message}</div> : null),
}))

vi.mock('../../components/EmptyState', () => ({
  default: ({ title, description }) => (
    <div data-testid="empty-state">
      <div data-testid="empty-title">{title}</div>
      <div data-testid="empty-description">{description}</div>
    </div>
  ),
}))

const mockStatsData = {
  totalUsers: 100,
  activeUsers: 75,
  totalCompanies: 20,
  activeCompanies: 15,
  totalInvoices: 500,
  totalTransactions: 1200,
  totalMatches: 300,
  openAnomalies: 5,
}

const mockUsersData = {
  totalCount: 2,
  items: [
    { id: 2, name: 'Alice', email: 'alice@test.com', role: 'admin', isActive: true, isBanned: false, phone: '123', emailVerified: true, lastLoginAt: '2025-06-01T10:00:00Z', createdAt: '2025-01-01T10:00:00Z' },
    { id: 3, name: 'Bob', email: 'bob@test.com', role: 'accountant', isActive: false, isBanned: false, phone: '456', emailVerified: false, lastLoginAt: null, createdAt: '2025-02-01T10:00:00Z' },
  ],
}

const mockLogsData = {
  totalCount: 2,
  items: [
    { id: 1, level: 'ERROR', category: 'api', message: 'HTTP 500', details: '{"statusCode":500,"path":"/api/test"}', userId: 1, ipAddress: '192.168.1.1', createdAt: '2025-06-01T10:00:00Z' },
    { id: 2, level: 'WARN', category: 'security', message: 'Login attempt failed', details: '{"statusCode":401,"path":"/api/auth/login"}', userId: 2, ipAddress: '192.168.1.2', createdAt: '2025-06-01T11:00:00Z' },
  ],
}

const mockAuditData = {
  totalCount: 2,
  items: [
    { id: 1, action: 'auth.login', entityType: 'User', userName: 'Alice', userId: 1, companyId: 1, ipAddress: '192.168.1.1', createdAt: '2025-06-01T10:00:00Z' },
    { id: 2, action: 'POST /api/invoices', entityType: 'Invoice', userName: 'Bob', userId: 2, companyId: 2, ipAddress: '192.168.1.2', createdAt: '2025-06-01T11:00:00Z' },
  ],
}

describe('AdminPortalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStatsQuery = { data: mockStatsData, isLoading: false, error: null }
    mockUsersQuery = { data: mockUsersData, isLoading: false, error: null }
    mockLogsQuery = { data: mockLogsData, isLoading: false, error: null }
    mockAuditQuery = { data: mockAuditData, isLoading: false, error: null }
    mockToggleBan = { mutateAsync: vi.fn().mockResolvedValue({ message: 'User ban status updated successfully.' }), isPending: false }
    mockClearLogs = { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }
    mockClearAuditLogs = { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }
    mockDeleteLog = { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }
    mockDeleteAuditLog = { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }
  })

  const renderPage = () => render(<AdminPortalPage />)

  it('renders PageHeaderCard with "Admin Portal" title', () => {
    renderPage()
    expect(screen.getByText('Admin Portal')).toBeInTheDocument()
  })

  it('renders 4 tabs (Stats, Users, System Logs, Audit Logs)', () => {
    renderPage()
    expect(screen.getByText('Stats')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('System Logs')).toBeInTheDocument()
    expect(screen.getByText('Audit Logs')).toBeInTheDocument()
  })

  it('Stats tab shows stat cards when data loads', () => {
    renderPage()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('75')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('Stats tab shows skeleton while loading', () => {
    mockStatsQuery = { data: null, isLoading: true, error: null }
    renderPage()
    const skeletons = document.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('Users tab renders user table with rows', async () => {
    renderPage()
    await userEvent.click(screen.getByText('Users'))
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('alice@test.com')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('Users tab shows role filter dropdown', async () => {
    renderPage()
    await userEvent.click(screen.getByText('Users'))
    expect(screen.getByLabelText('Role')).toBeInTheDocument()
  })

  it('Users tab shows search input', async () => {
    renderPage()
    await userEvent.click(screen.getByText('Users'))
    expect(screen.getByLabelText('Search')).toBeInTheDocument()
  })

  it('Users tab pagination controls', async () => {
    mockUsersQuery = { data: { totalCount: 50, items: mockUsersData.items }, isLoading: false, error: null }
    renderPage()
    await userEvent.click(screen.getByText('Users'))
    expect(document.querySelector('.MuiTablePagination-root')).toBeInTheDocument()
  })

  it('System Logs tab renders log entries', async () => {
    renderPage()
    await userEvent.click(screen.getByText('System Logs'))
    expect(screen.getByText('Server error occurred')).toBeInTheDocument()
    expect(screen.getByText('Login attempt failed')).toBeInTheDocument()
  })

  it('Audit Logs tab renders audit entries', async () => {
    renderPage()
    await userEvent.click(screen.getByText('Audit Logs'))
    expect(screen.getByText('User signed in')).toBeInTheDocument()
    expect(screen.getByText('Created invoice')).toBeInTheDocument()
  })

  it('Toggle user ban button triggers mutation', async () => {
    renderPage()
    await userEvent.click(screen.getByText('Users'))
    const bobRow = screen.getByText('Bob').closest('tr')
    const banButton = within(bobRow).getByRole('button', { name: /^Ban$/i })
    await userEvent.click(banButton)
    const confirmButton = within(screen.getByRole('dialog')).getByRole('button', { name: /^Ban$/i })
    await userEvent.click(confirmButton)
    expect(mockToggleBan.mutateAsync).toHaveBeenCalledWith({ userId: 3 })
  })

  it('Tab switching works correctly', async () => {
    renderPage()
    expect(screen.getByText('100')).toBeInTheDocument()
    await userEvent.click(screen.getByText('Users'))
    expect(screen.getByText('alice@test.com')).toBeInTheDocument()
    expect(screen.queryByText('100')).not.toBeInTheDocument()
    await userEvent.click(screen.getByText('System Logs'))
    expect(screen.getByText('Server error occurred')).toBeInTheDocument()
    await userEvent.click(screen.getByText('Audit Logs'))
    expect(screen.getByText('User signed in')).toBeInTheDocument()
  })
})
