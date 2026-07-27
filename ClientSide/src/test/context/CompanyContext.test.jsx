import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useContext } from 'react'
import { CompanyProvider } from '../../context/CompanyContext'
import { CompanyContext } from '../../context/CompanyContextProvider'
import { AuthContext } from '../../context/AuthContextProvider'
import * as companiesService from '../../services/companies'

vi.mock('../../services/companies', () => ({
  getCompaniesByUser: vi.fn(),
}))

function Wrapper({ authValue, children }) {
  return (
    <AuthContext.Provider value={authValue}>
      <CompanyProvider>{children}</CompanyProvider>
    </AuthContext.Provider>
  )
}

describe('CompanyContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('loads companies on mount when authenticated', async () => {
    companiesService.getCompaniesByUser.mockResolvedValue([{ id: 10, name: 'Acme' }])

    const { result } = renderHook(() => useContext(CompanyContext), {
      wrapper: ({ children }) => (
        <Wrapper authValue={{ isAuthenticated: true, user: { id: 1, role: 'business_owner' }, token: 'token123', updateUser: vi.fn() }}>
          {children}
        </Wrapper>
      ),
    })

    await waitFor(() => {
      expect(companiesService.getCompaniesByUser).toHaveBeenCalledWith(1, 'token123')
    })

    await waitFor(() => {
      expect(result.current.activeCompanyId).toBe(10)
    })
  })

  it('shows loading state initially', async () => {
    companiesService.getCompaniesByUser.mockResolvedValue([{ id: 10, name: 'Acme' }])

    const { result } = renderHook(() => useContext(CompanyContext), {
      wrapper: ({ children }) => (
        <Wrapper authValue={{ isAuthenticated: true, user: { id: 1, role: 'business_owner' }, token: 'token123', updateUser: vi.fn() }}>
          {children}
        </Wrapper>
      ),
    })

    expect(result.current.loadingCompanies).toBe(true)

    await waitFor(() => {
      expect(result.current.loadingCompanies).toBe(false)
    })
  })

  it('handles fetch failure gracefully', async () => {
    companiesService.getCompaniesByUser.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useContext(CompanyContext), {
      wrapper: ({ children }) => (
        <Wrapper authValue={{ isAuthenticated: true, user: { id: 1, role: 'business_owner' }, token: 'token123', updateUser: vi.fn() }}>
          {children}
        </Wrapper>
      ),
    })

    await waitFor(() => {
      expect(result.current.companies).toEqual([])
      expect(result.current.activeCompanyId).toBeNull()
    })
  })

  it('clears companies when not authenticated', () => {
    const { result } = renderHook(() => useContext(CompanyContext), {
      wrapper: ({ children }) => (
        <Wrapper authValue={{ isAuthenticated: false, user: null, token: null, updateUser: vi.fn() }}>
          {children}
        </Wrapper>
      ),
    })

    expect(result.current.companies).toEqual([])
    expect(result.current.activeCompanyId).toBeNull()
  })

  it('changeActiveCompanyId updates selection', async () => {
    companiesService.getCompaniesByUser.mockResolvedValue([
      { id: 10, name: 'Acme' },
      { id: 20, name: 'Beta' },
    ])

    const { result } = renderHook(() => useContext(CompanyContext), {
      wrapper: ({ children }) => (
        <Wrapper authValue={{ isAuthenticated: true, user: { id: 1, role: 'business_owner' }, token: 'token123', updateUser: vi.fn() }}>
          {children}
        </Wrapper>
      ),
    })

    await waitFor(() => {
      expect(result.current.companies).toHaveLength(2)
    })

    act(() => {
      result.current.setActiveCompanyId(20, 'Beta')
    })

    expect(result.current.activeCompanyId).toBe(20)
    expect(result.current.activeCompanyName).toBe('Beta')
  })
})
