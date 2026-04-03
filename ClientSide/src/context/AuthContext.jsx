import { useCallback, useMemo, useState } from 'react'
import {
  clearAuthSession,
  getStoredAuthSession,
  loginUser,
  saveAuthSession,
} from '../services/auth'
import { getCompaniesByUser } from '../services/companies'
import { AuthContext } from './AuthContextProvider'

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(() => getStoredAuthSession())

  const logout = useCallback(() => {
    clearAuthSession()
    setSessionState(null)
  }, [])

  const setSession = useCallback(
    (token, user) => {
      if (!token || !user) {
        logout()
        return
      }

      saveAuthSession(token, user)
      setSessionState({ token, user })
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

      setSession(token, user)
      return data
    },
    [setSession],
  )

  const updateUser = useCallback(
    (updatedFields) => {
      if (!session?.token || !session?.user) return
      const newUser = { ...session.user, ...updatedFields }
      saveAuthSession(session.token, newUser)
      setSessionState({ token: session.token, user: newUser })
    },
    [session],
  )

  const value = useMemo(
    () => ({
      session,
      token: session?.token || null,
      user: session?.user || null,
      isAuthenticated: Boolean(session?.token),
      login,
      logout,
      setSession,
      updateUser,
    }),
    [login, logout, session, setSession, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
