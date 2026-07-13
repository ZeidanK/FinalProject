import { act, render, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RealtimeContext } from '../../context/RealtimeContextProvider'
import { RealtimeProvider } from '../../context/RealtimeContext'
import { AuthContext } from '../../context/AuthContextProvider'
import { CompanyContext } from '../../context/CompanyContextProvider'
import { NotificationContext } from '../../context/NotificationContextProvider'
import { useRealtime } from '../../context/useRealtime'
import { createRealtimeClient } from '../../services/realtime'

vi.mock('../../services/realtime', () => ({
  createRealtimeClient: vi.fn(),
}))

function createMockRealtimeClient() {
  let stateListener = () => {}
  const handlers = new Map()

  return {
    handlers,
    on: vi.fn((eventName, handler) => handlers.set(eventName, handler)),
    off: vi.fn((eventName) => handlers.delete(eventName)),
    onStateChange: vi.fn((listener) => {
      stateListener = typeof listener === 'function' ? listener : () => {}
    }),
    start: vi.fn(async () => stateListener('connected')),
    stop: vi.fn(async () => {}),
    joinCompany: vi.fn(async () => {}),
    leaveCompany: vi.fn(async () => {}),
  }
}

function renderRealtimeProvider({
  client = createMockRealtimeClient(),
  logout = vi.fn(),
  notify = vi.fn(),
} = {}) {
  createRealtimeClient.mockReturnValue(client)
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={{
          token: 'token',
          isAuthenticated: true,
          user: { id: 10 },
          logout,
        }}
      >
        <CompanyContext.Provider value={{ activeCompanyId: null }}>
          <NotificationContext.Provider value={{ notify }}>
            <RealtimeProvider>
              <div>child</div>
            </RealtimeProvider>
          </NotificationContext.Provider>
        </CompanyContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )

  return { client, logout, notify }
}

describe('useRealtime', () => {
  it('returns the context value when used inside RealtimeProvider', () => {
    const contextValue = {
      isConnected: true,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    }

    const { result } = renderHook(() => useRealtime(), {
      wrapper: ({ children }) => (
        <RealtimeContext.Provider value={contextValue}>
          {children}
        </RealtimeContext.Provider>
      ),
    })

    expect(result.current).toBe(contextValue)
  })

  it('throws an error when used outside RealtimeProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useRealtime())
    }).toThrow('useRealtime must be used inside RealtimeProvider.')

    consoleSpy.mockRestore()
  })
})

describe('RealtimeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs out when the account banned notification is received', async () => {
    const { client, logout, notify } = renderRealtimeProvider()

    await waitFor(() => {
      expect(client.on).toHaveBeenCalledWith('notificationCreated', expect.any(Function))
    })

    act(() => {
      client.handlers.get('notificationCreated')({
        eventId: 'ban-1',
        eventType: 'admin.user.banned',
        userId: 10,
        title: 'Account banned',
        severity: 'error',
      })
    })

    expect(notify).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Account banned',
      severity: 'error',
    }))
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('logs out when realtime access is explicitly revoked', async () => {
    const { client, logout, notify } = renderRealtimeProvider()

    await waitFor(() => {
      expect(client.on).toHaveBeenCalledWith('accessRevoked', expect.any(Function))
    })

    act(() => {
      client.handlers.get('accessRevoked')({
        eventType: 'admin.user.banned',
        userId: 10,
        message: 'Your account has been banned by an administrator. You have been signed out.',
      })
    })

    expect(notify).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Your account has been banned by an administrator. You have been signed out.',
      severity: 'error',
    }))
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('does not log out admins who receive a ban event for another user', async () => {
    const { client, logout, notify } = renderRealtimeProvider()

    await waitFor(() => {
      expect(client.on).toHaveBeenCalledWith('notificationEvent', expect.any(Function))
    })

    act(() => {
      client.handlers.get('notificationEvent')({
        eventType: 'admin.user.banned',
        payload: {
          targetUserId: 20,
          isBanned: true,
        },
      })
    })

    expect(notify).not.toHaveBeenCalled()
    expect(logout).not.toHaveBeenCalled()
  })
})
