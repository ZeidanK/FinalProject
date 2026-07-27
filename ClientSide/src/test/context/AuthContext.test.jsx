import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider } from '../../context/AuthContext'
import { useAuth } from '../../context/useAuth'
import { AuthContext } from '../../context/AuthContextProvider'
import * as authService from '../../services/auth'
import * as companiesService from '../../services/companies'

vi.mock('../../services/auth', () => ({
  loginUser: vi.fn(),
  saveAuthSession: vi.fn(),
  clearAuthSession: vi.fn(),
  getStoredAuthSession: vi.fn(),
}))

vi.mock('../../services/companies', () => ({
  getCompaniesByUser: vi.fn(),
}))

vi.mock('../../queries/queryClient', () => ({
  queryClient: { removeQueries: vi.fn() },
}))

vi.mock('../../queries/queryKeys', () => ({
  notificationKeys: { all: ['notifications'] },
}))

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authService.getStoredAuthSession.mockReturnValue(null)
  })

  it('provides isAuthenticated as false when no session', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.token).toBeNull()
    expect(result.current.user).toBeNull()
  })

  it('restores session from stored auth on mount', () => {
    const mockSession = { token: 'token123', user: { id: 1, name: 'John' } }
    authService.getStoredAuthSession.mockReturnValue(mockSession)

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.token).toBe('token123')
    expect(result.current.user).toEqual({ id: 1, name: 'John' })
  })

  it('login sets session and fetches companies', async () => {
    authService.loginUser.mockResolvedValue({
      token: 'jwt',
      user: { id: 1, name: 'John', email: 'john@test.com', role: 'business_owner' },
    })
    companiesService.getCompaniesByUser.mockResolvedValue([{ id: 5, name: 'Acme' }])

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    await act(async () => {
      await result.current.login({ email: 'john@test.com', password: 'secret' })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.token).toBe('jwt')
    expect(result.current.user.companyId).toBe(5)
    expect(authService.saveAuthSession).toHaveBeenCalledWith('jwt', expect.objectContaining({ id: 1 }))
  })

  it('login handles missing companies gracefully', async () => {
    authService.loginUser.mockResolvedValue({
      token: 'jwt',
      user: { id: 1, name: 'John', email: 'john@test.com', role: 'business_owner' },
    })
    companiesService.getCompaniesByUser.mockRejectedValue(new Error('fail'))

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    await act(async () => {
      await result.current.login({ email: 'john@test.com', password: 'secret' })
    })

    expect(result.current.isAuthenticated).toBe(true)
  })

  it('logout clears session', async () => {
    authService.getStoredAuthSession.mockReturnValue({ token: 't', user: { id: 1 } })
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    act(() => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(authService.clearAuthSession).toHaveBeenCalled()
  })

  it('logout clears session when the session revoked event is received', async () => {
    authService.getStoredAuthSession.mockReturnValue({ token: 't', user: { id: 1 } })
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    act(() => {
      globalThis.dispatchEvent(new CustomEvent('auth:session-revoked'))
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(authService.clearAuthSession).toHaveBeenCalled()
  })

  it('updateUser merges fields', () => {
    authService.getStoredAuthSession.mockReturnValue({ token: 't', user: { id: 1, name: 'John' } })
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    act(() => {
      result.current.updateUser({ name: 'Jane' })
    })

    expect(result.current.user.name).toBe('Jane')
  })

  it('setSession updates session', () => {
    authService.getStoredAuthSession.mockReturnValue(null)
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    act(() => {
      result.current.setSession('newtoken', { id: 2, name: 'Alice' })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.token).toBe('newtoken')
    expect(result.current.user.name).toBe('Alice')
  })

  it('setSession with null calls logout', () => {
    authService.getStoredAuthSession.mockReturnValue({ token: 't', user: { id: 1 } })
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    act(() => {
      result.current.setSession(null, null)
    })

    expect(result.current.isAuthenticated).toBe(false)
  })

  it('useAuth throws outside provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used inside AuthProvider')
  })
})
