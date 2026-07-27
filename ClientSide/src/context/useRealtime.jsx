import { useContext } from 'react'
import { RealtimeContext } from './RealtimeContextProvider'

/**
 * Hook to consume realtime connection context.
 *
 * @returns {object} Realtime context value.
 * @throws {Error} When used outside RealtimeProvider.
 */
export function useRealtime() {
  const context = useContext(RealtimeContext)

  if (!context) {
    throw new Error('useRealtime must be used inside RealtimeProvider.')
  }

  return context
}