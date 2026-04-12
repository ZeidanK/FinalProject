import { useContext } from 'react'
import { AuthContext } from './AuthContextProvider'

/**
 * Hook to consume the authentication context.
 *
 * This hook ensures it is called inside an AuthProvider and returns
 * the shared auth session state and helper functions.
 *
 * @returns {object} The current auth context value.
 * @throws {Error} When used outside of AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }

  return context
}
