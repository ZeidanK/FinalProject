import { useContext } from 'react'
import { CompanyContext } from './CompanyContextProvider'

/**
 * Hook to consume the company context.
 *
 * Ensures the hook is used within a CompanyProvider and returns the
 * shared company state and actions.
 *
 * @returns {object} The current company context value.
 * @throws {Error} When used outside of CompanyProvider.
 */
export function useCompany() {
  const context = useContext(CompanyContext)

  if (!context) {
    throw new Error('useCompany must be used inside CompanyProvider.')
  }

  return context
}
