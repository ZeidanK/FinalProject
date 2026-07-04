import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockGetNotificationInbox = vi.fn()
const mockMarkNotificationRead = vi.fn()
const mockMarkAllNotificationsRead = vi.fn()

vi.mock('../../services/notifications', () => ({
  getNotificationInbox: (...args) => mockGetNotificationInbox(...args),
  markNotificationRead: (...args) => mockMarkNotificationRead(...args),
  markAllNotificationsRead: (...args) => mockMarkAllNotificationsRead(...args),
}))

import {
  useNotificationsInboxQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '../../hooks/queries/useNotificationsQueries'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useNotificationsInboxQuery', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns paginated notification data from infinite query', async () => {
    const page = { items: [{ id: 1, isRead: false }], nextCursor: null }
    mockGetNotificationInbox.mockResolvedValue(page)

    const { result } = renderHook(
      () =>
        useNotificationsInboxQuery({
          token: 'tok',
          userId: 1,
          view: 'company',
          companyId: 5,
          take: 25,
          isRealtimeConnected: true,
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.pages[0]).toEqual(page)
    expect(mockGetNotificationInbox).toHaveBeenCalledWith('tok', {
      view: 'company',
      companyId: 5,
      cursor: null,
      take: 25,
    })
  })

  it('is not enabled when token is missing', () => {
    const { result } = renderHook(
      () =>
        useNotificationsInboxQuery({
          token: null,
          userId: 1,
          view: 'company',
          companyId: 5,
        }),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('is not enabled when userId is missing', () => {
    const { result } = renderHook(
      () =>
        useNotificationsInboxQuery({
          token: 'tok',
          userId: null,
          view: 'company',
          companyId: 5,
        }),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('is not enabled when view is company but companyId is missing', () => {
    const { result } = renderHook(
      () =>
        useNotificationsInboxQuery({
          token: 'tok',
          userId: 1,
          view: 'company',
          companyId: null,
        }),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('is enabled when view is user without companyId', () => {
    mockGetNotificationInbox.mockResolvedValue({ items: [], nextCursor: null })

    const { result } = renderHook(
      () =>
        useNotificationsInboxQuery({
          token: 'tok',
          userId: 1,
          view: 'user',
          companyId: null,
        }),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('fetching')
  })
})

describe('useMarkNotificationReadMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls markNotificationRead with id, token, and context', async () => {
    mockMarkNotificationRead.mockResolvedValue({ id: 5, isRead: true })

    const { result } = renderHook(
      () =>
        useMarkNotificationReadMutation({
          token: 'tok',
          userId: 1,
          view: 'company',
          companyId: 5,
        }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync(5)

    expect(mockMarkNotificationRead).toHaveBeenCalledWith(5, 'tok', {
      view: 'company',
      companyId: 5,
    })
    expect(data).toEqual({ id: 5, isRead: true })
  })
})

describe('useMarkAllNotificationsReadMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls markAllNotificationsRead with token and context', async () => {
    mockMarkAllNotificationsRead.mockResolvedValue({ success: true })

    const { result } = renderHook(
      () =>
        useMarkAllNotificationsReadMutation({
          token: 'tok',
          userId: 1,
          view: 'company',
          companyId: 5,
        }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync()

    expect(mockMarkAllNotificationsRead).toHaveBeenCalledWith('tok', {
      view: 'company',
      companyId: 5,
    })
    expect(data).toEqual({ success: true })
  })
})
