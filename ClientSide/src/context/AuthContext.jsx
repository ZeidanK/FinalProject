import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
  clearAuthSession,
  getStoredAuthSession,
  loginUser,
  saveAuthSession,
} from '../services/auth'
import { getCompaniesByUser } from '../services/companies'

/**
 * Authentication context (created here, exported for direct use if needed).
 */
export const AuthContext = createContext(undefined)

/**
 * Hook to consume the authentication context.
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

/**
 * Provides authentication state and helpers to the app.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export function AuthProvider({ children }) {
  const [authSession, setAuthSession] = useState(() => getStoredAuthSession())

  const logout = useCallback(() => {
    clearAuthSession()
    setAuthSession(null)
  }, [])

  const applySession = useCallback(
    (token, user) => {
      if (!token || !user) {
        logout()
        return
      }
      saveAuthSession(token, user)
      setAuthSession({ token, user })
    },
    [logout],
  )

  const login = useCallback(
    async (credentials) => {
      const data = await loginUser(credentials)
      const token = data?.token
      const user = data?.user

      if (token && user) {
        try {
          const companies = await getCompaniesByUser(user.id, token)
          if (companies && companies.length > 0) {
            user.companyId = companies[0].id
            user.companies = companies
          }
        } catch (err) {
          console.error('Failed to fetch user companies:', err)
        }
      }

      applySession(token, user)
      return data
    },
    [applySession],
  )

  const updateUser = useCallback(
    (updatedFields) => {
      setAuthSession((prevSession) => {
        if (!prevSession?.token || !prevSession?.user) return prevSession
        const newUser = { ...prevSession.user, ...updatedFields }
        const changed = Object.keys(updatedFields || {}).some(
          (key) => prevSession.user?.[key] !== newUser?.[key],
        )
        if (!changed) return prevSession
        saveAuthSession(prevSession.token, newUser)
        return { token: prevSession.token, user: newUser }
      })
    },
    [],
  )

  const value = useMemo(
    () => ({
      session: authSession,
      token: authSession?.token || null,
      user: authSession?.user || null,
      isAuthenticated: Boolean(authSession?.token),
      login,
      logout,
      setSession: applySession,
      updateUser,
    }),
    [authSession, login, logout, applySession, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}