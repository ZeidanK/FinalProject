import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { getCompaniesByUser } from '../services/companies'
import { useAuth } from './useAuth'
import { CompanyContext } from './CompanyContextProvider'

const ACTIVE_COMPANY_STORAGE_KEY = 'activeCompanyId'

const parseCompanyId = (value) => {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : null
}

const readStoredCompanyId = () => {
  if (globalThis.window === undefined) return null
  return parseCompanyId(globalThis.localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY))
}

const persistCompanyId = (companyId) => {
  if (globalThis.window === undefined) return
  if (!companyId) {
    globalThis.localStorage.removeItem(ACTIVE_COMPANY_STORAGE_KEY)
    return
  }
  globalThis.localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, String(companyId))
}

export function CompanyProvider({ children }) {
  const { isAuthenticated, user, token, updateUser } = useAuth()
  const [companies, setCompanies] = useState([])
  const [activeCompanyId, setActiveCompanyId] = useState(() => readStoredCompanyId())
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [hasResolvedCompanies, setHasResolvedCompanies] = useState(false)
  const inFlightRequestKeyRef = useRef(null)
  const inFlightPromiseRef = useRef(null)

  const resolveInitialCompanyId = useCallback((availableCompanies, currentUserCompanyId) => {
    const ids = availableCompanies
      .map((company) => parseCompanyId(company.id ?? company.companyId))
      .filter(Boolean)

    const storedId = readStoredCompanyId()
    const userCompanyId = parseCompanyId(currentUserCompanyId)

    if (storedId && ids.includes(storedId)) return storedId
    if (userCompanyId && ids.includes(userCompanyId)) return userCompanyId
    if (ids.length > 0) return ids[0]

    return null
  }, [])

  const changeActiveCompanyId = useCallback((companyId) => {
    const parsedId = parseCompanyId(companyId)
    if (!parsedId) return

    const availableIds = companies
      .map((company) => parseCompanyId(company.id ?? company.companyId))
      .filter(Boolean)

    if (!availableIds.includes(parsedId)) {
      return
    }

    setActiveCompanyId(parsedId)
    persistCompanyId(parsedId)
    updateUser({ companyId: parsedId })
  }, [companies, updateUser])

  const refreshCompanies = useCallback(async () => {
    if (!isAuthenticated || !user?.id || !token) {
      inFlightRequestKeyRef.current = null
      inFlightPromiseRef.current = null
      setCompanies([])
      setActiveCompanyId(null)
      persistCompanyId(null)
      setLoadingCompanies(false)
      setHasResolvedCompanies(false)
      return
    }

    const requestKey = `${user.id}:${token}`
    if (
      inFlightPromiseRef.current
      && inFlightRequestKeyRef.current === requestKey
    ) {
      await inFlightPromiseRef.current
      return
    }

    const requestPromise = (async () => {
      setLoadingCompanies(true)
      setHasResolvedCompanies(false)
      try {
        const response = await getCompaniesByUser(user.id, token)
        const nextCompanies = Array.isArray(response) ? response : []
        setCompanies(nextCompanies)

        const nextActiveCompanyId = resolveInitialCompanyId(nextCompanies, user?.companyId)
        setActiveCompanyId(nextActiveCompanyId)
        persistCompanyId(nextActiveCompanyId)

        const currentUserCompanyId = parseCompanyId(user?.companyId)
        if (currentUserCompanyId !== nextActiveCompanyId) {
          updateUser({ companyId: nextActiveCompanyId })
        }
        setHasResolvedCompanies(true)
      } catch {
        setCompanies([])
        setActiveCompanyId(null)
        persistCompanyId(null)

        const currentUserCompanyId = parseCompanyId(user?.companyId)
        if (currentUserCompanyId !== null) {
          updateUser({ companyId: null })
        }
        setHasResolvedCompanies(true)
      } finally {
        setLoadingCompanies(false)
      }
    })()

    inFlightRequestKeyRef.current = requestKey
    inFlightPromiseRef.current = requestPromise

    try {
      await requestPromise
    } finally {
      if (inFlightRequestKeyRef.current === requestKey) {
        inFlightPromiseRef.current = null
      }
    }
  }, [isAuthenticated, resolveInitialCompanyId, token, updateUser, user?.companyId, user?.id])

  useEffect(() => {
    refreshCompanies()
  }, [refreshCompanies])

  const value = useMemo(() => ({
    companies,
    activeCompanyId,
    loadingCompanies,
    hasResolvedCompanies,
    refreshCompanies,
    setActiveCompanyId: changeActiveCompanyId,
  }), [companies, activeCompanyId, loadingCompanies, hasResolvedCompanies, refreshCompanies, changeActiveCompanyId])

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
}

CompanyProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
