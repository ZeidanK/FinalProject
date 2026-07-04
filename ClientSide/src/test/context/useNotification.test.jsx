import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useNotification } from '../../context/useNotification'
import { NotificationContext } from '../../context/NotificationContextProvider'

describe('useNotification', () => {
  it('returns the context value when used inside NotificationProvider', () => {
    const contextValue = {
      queue: [],
      notify: vi.fn(),
      dismiss: vi.fn(),
    }

    const { result } = renderHook(() => useNotification(), {
      wrapper: ({ children }) => (
        <NotificationContext.Provider value={contextValue}>
          {children}
        </NotificationContext.Provider>
      ),
    })

    expect(result.current).toBe(contextValue)
  })

  it('throws an error when used outside NotificationProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useNotification())
    }).toThrow('useNotification must be used inside NotificationProvider.')

    consoleSpy.mockRestore()
  })
})
