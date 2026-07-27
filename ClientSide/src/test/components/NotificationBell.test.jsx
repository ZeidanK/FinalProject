import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import NotificationBell from '../../components/NotificationBell'

const mockNotify = vi.fn()
const mockMutate = vi.fn()
const mockRefetch = vi.fn()
const mockFetchNextPage = vi.fn()

let mockNotifications = []
let mockIsLoading = false
let mockIsError = false
let mockHasNextPage = false
let mockIsFetchingNextPage = false
let mockCounts = {}
let mockUnreadCount = 0

vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({ token: 't1', user: { id: 1, role: 'business_owner' } }),
}))

vi.mock('../../context/useCompany', () => ({
  useCompany: () => ({ companies: [], activeCompanyId: null, setActiveCompanyId: vi.fn() }),
}))

vi.mock('../../context/useNotification', () => ({
  useNotification: () => ({ notify: mockNotify }),
}))

vi.mock('../../context/useRealtime', () => ({
  useRealtime: () => ({ connectionState: 'connected', isConnected: true }),
}))

vi.mock('../../hooks/queries/useNotificationsQueries', () => ({
  useNotificationsInboxQuery: () => ({
    data: { pages: [{ items: mockNotifications, counts: mockCounts }] },
    isLoading: mockIsLoading,
    isError: mockIsError,
    refetch: mockRefetch,
    fetchNextPage: mockFetchNextPage,
    hasNextPage: mockHasNextPage,
    isFetchingNextPage: mockIsFetchingNextPage,
  }),
  useMarkNotificationReadMutation: () => ({ mutate: mockMutate, isPending: false }),
  useMarkAllNotificationsReadMutation: () => ({ mutate: mockMutate, isPending: false }),
}))

describe('NotificationBell', () => {
  beforeEach(() => {
    mockNotifications = []
    mockIsLoading = false
    mockIsError = false
    mockHasNextPage = false
    mockIsFetchingNextPage = false
    mockCounts = {}
  })

  const renderBell = () => render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>
  )

  it('renders bell icon button', () => {
    renderBell()
    expect(screen.getByRole('button', { name: 'open notifications' })).toBeInTheDocument()
  })

  it('shows popover on click', async () => {
    renderBell()
    await userEvent.click(screen.getByRole('button', { name: 'open notifications' }))
    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })

  it('shows no notifications message when empty', async () => {
    renderBell()
    await userEvent.click(screen.getByRole('button', { name: 'open notifications' }))
    expect(screen.getByText('No notifications here')).toBeInTheDocument()
  })

  it('renders notification items', async () => {
    mockNotifications = [
      { id: 1, title: 'Invoice processed', body: 'INV-123', severity: 'success', createdAt: new Date().toISOString(), isRead: false },
    ]
    renderBell()
    await userEvent.click(screen.getByRole('button', { name: 'open notifications' }))
    expect(screen.getByText('Invoice processed')).toBeInTheDocument()
  })

  it('shows loading spinner', async () => {
    mockIsLoading = true
    renderBell()
    await userEvent.click(screen.getByRole('button', { name: 'open notifications' }))
    expect(document.querySelector('.MuiCircularProgress-root')).toBeInTheDocument()
  })

  it('shows error alert', async () => {
    mockIsError = true
    renderBell()
    await userEvent.click(screen.getByRole('button', { name: 'open notifications' }))
    expect(screen.getByText('Notifications could not be loaded.')).toBeInTheDocument()
  })

  it('shows load older button when hasNextPage', async () => {
    mockHasNextPage = true
    renderBell()
    await userEvent.click(screen.getByRole('button', { name: 'open notifications' }))
    expect(screen.getByText('Load older notifications')).toBeInTheDocument()
  })
})
