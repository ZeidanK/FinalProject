import { createContext } from 'react'

/**
 * Company context shared across the client app.
 *
 * This context provides information about the active company selection,
 * available companies for the current user, and company-related actions.
 */
export const CompanyContext = createContext(undefined)
