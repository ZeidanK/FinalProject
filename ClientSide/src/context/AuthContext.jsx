import { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
  clearAuthSession,
  getStoredAuthSession,
  loginUser,
  saveAuthSession,
} from '../services/auth'
import { getCompaniesByUser } from '../services/companies'
import { AuthContext } from './AuthContextProvider'
import { queryClient } from '../queries/queryClient'
import { notificationKeys } from '../queries/queryKeys'

/**
 * Provides authentication state and helpers to the app.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The rendered descendant components.
 * @returns {JSX.Element} The authentication context provider.
 */
export function AuthProvider({ children }) {
  const [authSession, setAuthSession] = useState(() => getStoredAuthSession())

  /**
   * Clear stored session state and reset the auth session.
   */
  const logout = useCallback(() => {
    clearAuthSession()
    queryClient.removeQueries({ queryKey: notificationKeys.all })
    setAuthSession(null)
  }, [])

  /**
   * Persist and apply a new authentication session.
   *
   * @param {string|null} token - Authentication token returned by the login flow.
   * @param {object|null} user - Authenticated user payload.
   */
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

  /**
   * Authenticate the given credentials and hydrate user session data.
   *
   * @param {object} credentials - Login credentials to send to the auth service.
   * @returns {Promise<object>} The auth response payload.
   */
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

  /**
   * Update the cached user profile and persist the modified session.
   *
   * @param {object} updatedFields - Partial user object fields to merge.
   */
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
