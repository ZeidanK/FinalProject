import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { getCompaniesByUser } from '../services/companies'
import { useAuth } from './useAuth'
import { CompanyContext } from './CompanyContextProvider'

/**
 * Storage key for the currently selected company ID.
 * @type {string}
 */
const ACTIVE_COMPANY_STORAGE_KEY = 'activeCompanyId'
const ACTIVE_COMPANY_NAME_STORAGE_KEY = 'activeCompanyName'

/**
 * Parse an incoming value into a valid positive company ID.
 *
 * @param {string|number|null|undefined} value - Potential company ID input.
 * @returns {number|null} A normalized company ID or null if invalid.
 */
const parseCompanyId = (value) => {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : null
}

/**
 * Read the persisted active company ID from localStorage.
 *
 * @returns {number|null} The persisted company ID, or null when unavailable.
 */
const readStoredCompanyId = () => {
  if (globalThis.window === undefined) return null
  return parseCompanyId(globalThis.localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY))
}

/**
 * Persist or remove the active company ID in localStorage.
 *
 * @param {number|null} companyId - The company ID to persist, or null to clear.
 */
const persistCompanyId = (companyId) => {
  if (globalThis.window === undefined) return
  if (!companyId) {
    globalThis.localStorage.removeItem(ACTIVE_COMPANY_STORAGE_KEY)
    return
  }
  globalThis.localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, String(companyId))
}

/**
 * Read the persisted active company name from localStorage.
 *
 * @returns {string|null} The persisted company name, or null when unavailable.
 */
const readStoredCompanyName = () => {
  if (globalThis.window === undefined) return null
  const name = globalThis.localStorage.getItem(ACTIVE_COMPANY_NAME_STORAGE_KEY)
  return typeof name === 'string' && name.trim() !== '' ? name : null
}

/**
 * Persist or remove the active company name in localStorage.
 *
 * @param {string|null} companyName - The company name to persist, or null to clear.
 */
const persistCompanyName = (companyName) => {
  if (globalThis.window === undefined) return
  if (!companyName) {
    globalThis.localStorage.removeItem(ACTIVE_COMPANY_NAME_STORAGE_KEY)
    return
  }
  globalThis.localStorage.setItem(ACTIVE_COMPANY_NAME_STORAGE_KEY, companyName)
}


/**
 * Provides company selection and company list state for the authenticated user.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components that consume company context.
 * @returns {JSX.Element} The company context provider.
 */
export function CompanyProvider({ children }) {
  const { isAuthenticated, user, token, updateUser } = useAuth()
  const [companies, setCompanies] = useState([])
  const [activeCompanyId, setActiveCompanyId] = useState(() => readStoredCompanyId())
  const [activeCompanyName, setActiveCompanyName] = useState(() => readStoredCompanyName())
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [hasResolvedCompanies, setHasResolvedCompanies] = useState(false)
  const inFlightRequestKeyRef = useRef(null)
  const inFlightPromiseRef = useRef(null)

  /**
   * Determine the initial active company by prioritizing stored, user, and available IDs.
   *
   * @param {Array<object>} availableCompanies - Companies returned for the current user.
   * @param {string|number|null|undefined} currentUserCompanyId - The user's current company ID.
   * @returns {number|null} Resolved active company ID.
   */
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

  /**
   * Update the active company selection and persist it to localStorage.
   *
   * @param {string|number|null|undefined} companyId - Candidate company ID to activate.
   * @param {string|null|undefined} companyName - Company name supplied by a company picker.
   */
  const changeActiveCompanyId = useCallback((companyId, companyName) => {
    const parsedId = parseCompanyId(companyId)
    if (!parsedId) return

    const availableIds = companies
      .map((company) => parseCompanyId(company.id ?? company.companyId))
      .filter(Boolean)

    const isAccountantRole = user?.role === 'accountant' || user?.role === 'accountant_business_owner'

    if (!availableIds.includes(parsedId) && !isAccountantRole) {
      return
    }

    const selectedCompany = companies.find(
      (company) => parseCompanyId(company.id ?? company.companyId) === parsedId,
    )
    const resolvedCompanyName = companyName
      || selectedCompany?.name
      || selectedCompany?.companyName
      || null

    setActiveCompanyId(parsedId)
    setActiveCompanyName(resolvedCompanyName)
    persistCompanyId(parsedId)
    persistCompanyName(resolvedCompanyName)
  }, [companies, user?.role])

  /**
   * Load the current user's accessible companies and resolve the active selection.
   * This request is deduplicated to avoid repeated in-flight fetches for the same user/token.
   */
  const refreshCompanies = useCallback(async () => {
    if (!isAuthenticated || !user?.id || !token) {
      inFlightRequestKeyRef.current = null
      inFlightPromiseRef.current = null
      setCompanies([])
      setActiveCompanyId(null)
      setActiveCompanyName(null)
      persistCompanyId(null)
      persistCompanyName(null)
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
        const nextActiveCompany = nextCompanies.find(
          (company) => parseCompanyId(company.id ?? company.companyId) === nextActiveCompanyId,
        )
        const nextActiveCompanyName = nextActiveCompany?.name ?? nextActiveCompany?.companyName ?? null
        setActiveCompanyId(nextActiveCompanyId)
        setActiveCompanyName(nextActiveCompanyName)
        persistCompanyId(nextActiveCompanyId)
        persistCompanyName(nextActiveCompanyName)

        const currentUserCompanyId = parseCompanyId(user?.companyId)
        if (currentUserCompanyId !== nextActiveCompanyId) {
          updateUser({ companyId: nextActiveCompanyId })
        }
        setHasResolvedCompanies(true)
      } catch {
        setCompanies([])
        setActiveCompanyId(null)
        setActiveCompanyName(null)
        persistCompanyId(null)
        persistCompanyName(null)

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
    activeCompanyName,
    loadingCompanies,
    hasResolvedCompanies,
    refreshCompanies,
    setActiveCompanyId: changeActiveCompanyId,
  }), [companies, activeCompanyId, activeCompanyName, loadingCompanies, hasResolvedCompanies, refreshCompanies, changeActiveCompanyId])

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
}

CompanyProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
