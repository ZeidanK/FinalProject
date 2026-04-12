import { createContext } from 'react'

/**
 * Authentication context used by the app to share auth session state.
 *
 * The provider is initialized in `AuthProvider` and consumed by
 * components that need access to the current user, token, and auth helpers.
 */
export const AuthContext = createContext(undefined)
