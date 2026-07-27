import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCompany } from '../../context/useCompany'
import { CompanyContext } from '../../context/CompanyContextProvider'

describe('useCompany', () => {
  it('returns the context value when used inside CompanyProvider', () => {
    const contextValue = {
      companies: [{ id: 1, name: 'Acme' }],
      activeCompanyId: 1,
      setActiveCompanyId: vi.fn(),
    }

    const { result } = renderHook(() => useCompany(), {
      wrapper: ({ children }) => (
        <CompanyContext.Provider value={contextValue}>
          {children}
        </CompanyContext.Provider>
      ),
    })

    expect(result.current).toBe(contextValue)
  })

  it('throws an error when used outside CompanyProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useCompany())
    }).toThrow('useCompany must be used inside CompanyProvider.')

    consoleSpy.mockRestore()
  })
})
