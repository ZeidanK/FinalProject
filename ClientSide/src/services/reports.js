import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'
import { unwrapEnvelope } from './unwrapEnvelope'

/**
 * Fetch dashboard report data for the given company.
 *
 * @param {string|number} companyId - Identifier for the company.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the dashboard report endpoint.
 */
export async function getDashboardReport(companyId, token) {
  const response = await apiRequest(URLS.reports.dashboard(companyId), { token })
  return unwrapEnvelope(response)
}

/**
 * Fetch reconciliation report data for the given company.
 *
 * @param {string|number} companyId - Identifier for the company.
 * @param {object} [filters={}] - Optional query filters.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the reconciliation report endpoint.
 */
export async function getReconciliationReport(companyId, filters = {}, token) {
  const response = await apiRequest(URLS.reports.reconciliation(companyId), {
    query: filters,
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Fetch accounts-payable aging data for the given company.
 *
 * @param {string|number} companyId - Identifier for the company.
 * @param {object} [filters={}] - Optional as-of date filter.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the aging endpoint.
 */
export async function getPayablesAgingReport(companyId, filters = {}, token) {
  const response = await apiRequest(URLS.reports.aging(companyId), {
    query: filters,
    token,
  })

  return unwrapEnvelope(response)
}
