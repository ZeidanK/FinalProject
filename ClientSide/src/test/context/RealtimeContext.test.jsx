import { renderHook } from '@testing-library/react'
import { RealtimeContext } from '../../context/RealtimeContextProvider'
import { useRealtime } from '../../context/useRealtime'

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
