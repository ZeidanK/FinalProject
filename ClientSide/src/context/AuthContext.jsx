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
      if (!authSession?.token || !authSession?.user) return
      const newUser = { ...authSession.user, ...updatedFields }
      saveAuthSession(authSession.token, newUser)
      setAuthSession({ token: authSession.token, user: newUser })
    },
    [authSession],
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
