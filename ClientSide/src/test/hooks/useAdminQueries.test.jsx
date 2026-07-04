import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockGetAdminStats = vi.fn()
const mockGetAdminUsers = vi.fn()
const mockGetAdminLogs = vi.fn()
const mockGetAdminAuditLogs = vi.fn()
const mockToggleAdminUserActive = vi.fn()
const mockClearAdminLogs = vi.fn()
const mockClearAdminAuditLogs = vi.fn()
const mockDeleteAdminLog = vi.fn()
const mockDeleteAdminAuditLog = vi.fn()

vi.mock('../../services/admin', () => ({
  getAdminStats: (...args) => mockGetAdminStats(...args),
  getAdminUsers: (...args) => mockGetAdminUsers(...args),
  getAdminLogs: (...args) => mockGetAdminLogs(...args),
  getAdminAuditLogs: (...args) => mockGetAdminAuditLogs(...args),
  toggleAdminUserActive: (...args) => mockToggleAdminUserActive(...args),
  clearAdminLogs: (...args) => mockClearAdminLogs(...args),
  clearAdminAuditLogs: (...args) => mockClearAdminAuditLogs(...args),
  deleteAdminLog: (...args) => mockDeleteAdminLog(...args),
  deleteAdminAuditLog: (...args) => mockDeleteAdminAuditLog(...args),
}))

import {
  useAdminStatsQuery,
  useAdminUsersQuery,
  useAdminLogsQuery,
  useAdminAuditQuery,
  useToggleAdminUserActiveMutation,
  useClearAdminLogsMutation,
  useClearAdminAuditLogsMutation,
  useDeleteAdminLogMutation,
  useDeleteAdminAuditLogMutation,
} from '../../hooks/queries/useAdminQueries'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useAdminStatsQuery', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns data on success', async () => {
    mockGetAdminStats.mockResolvedValue({ users: 10, logs: 100 })

    const { result } = renderHook(
      () => useAdminStatsQuery({ token: 'tok', enabled: true }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ users: 10, logs: 100 })
    expect(mockGetAdminStats).toHaveBeenCalledWith('tok')
  })

  it('is not enabled when token is missing', () => {
    const { result } = renderHook(
      () => useAdminStatsQuery({ token: '', enabled: true }),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetAdminStats).not.toHaveBeenCalled()
  })
})

describe('useAdminUsersQuery', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls getAdminUsers with query and token', async () => {
    mockGetAdminUsers.mockResolvedValue([{ id: 1, email: 'a@b.com' }])

    const { result } = renderHook(
      () => useAdminUsersQuery({ token: 'tok', query: 'admin', enabled: true }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: 1, email: 'a@b.com' }])
    expect(mockGetAdminUsers).toHaveBeenCalledWith('admin', 'tok')
  })

  it('works without a query parameter', async () => {
    mockGetAdminUsers.mockResolvedValue([])

    const { result } = renderHook(
      () => useAdminUsersQuery({ token: 'tok', enabled: true }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetAdminUsers).toHaveBeenCalledWith(undefined, 'tok')
  })
})

describe('useAdminLogsQuery', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls getAdminLogs with query and token', async () => {
    mockGetAdminLogs.mockResolvedValue([{ id: 1, action: 'login' }])

    const { result } = renderHook(
      () => useAdminLogsQuery({ token: 'tok', query: 'error', enabled: true }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: 1, action: 'login' }])
    expect(mockGetAdminLogs).toHaveBeenCalledWith('error', 'tok')
  })
})

describe('useAdminAuditQuery', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls getAdminAuditLogs with query and token', async () => {
    mockGetAdminAuditLogs.mockResolvedValue([{ id: 1, event: 'update' }])

    const { result } = renderHook(
      () => useAdminAuditQuery({ token: 'tok', query: 'user', enabled: true }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: 1, event: 'update' }])
    expect(mockGetAdminAuditLogs).toHaveBeenCalledWith('user', 'tok')
  })
})

describe('useToggleAdminUserActiveMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls toggleAdminUserActive with userId and token', async () => {
    mockToggleAdminUserActive.mockResolvedValue({ id: 1, isActive: false })

    const { result } = renderHook(
      () => useToggleAdminUserActiveMutation({ token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync({ userId: 42 })

    expect(mockToggleAdminUserActive).toHaveBeenCalledWith(42, 'tok')
    expect(data).toEqual({ id: 1, isActive: false })
  })
})

describe('useClearAdminLogsMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls clearAdminLogs with token', async () => {
    mockClearAdminLogs.mockResolvedValue({ deletedCount: 10 })

    const { result } = renderHook(
      () => useClearAdminLogsMutation({ token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync()

    expect(mockClearAdminLogs).toHaveBeenCalledWith('tok')
    expect(data).toEqual({ deletedCount: 10 })
  })
})

describe('useClearAdminAuditLogsMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls clearAdminAuditLogs with token', async () => {
    mockClearAdminAuditLogs.mockResolvedValue({ deletedCount: 5 })

    const { result } = renderHook(
      () => useClearAdminAuditLogsMutation({ token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync()

    expect(mockClearAdminAuditLogs).toHaveBeenCalledWith('tok')
    expect(data).toEqual({ deletedCount: 5 })
  })
})

describe('useDeleteAdminLogMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls deleteAdminLog with id and token', async () => {
    mockDeleteAdminLog.mockResolvedValue({ id: 7 })

    const { result } = renderHook(
      () => useDeleteAdminLogMutation({ token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync({ id: 7 })

    expect(mockDeleteAdminLog).toHaveBeenCalledWith(7, 'tok')
    expect(data).toEqual({ id: 7 })
  })
})

describe('useDeleteAdminAuditLogMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls deleteAdminAuditLog with id and token', async () => {
    mockDeleteAdminAuditLog.mockResolvedValue({ id: 3 })

    const { result } = renderHook(
      () => useDeleteAdminAuditLogMutation({ token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync({ id: 3 })

    expect(mockDeleteAdminAuditLog).toHaveBeenCalledWith(3, 'tok')
    expect(data).toEqual({ id: 3 })
  })
})
