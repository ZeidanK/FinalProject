import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'
import { unwrapEnvelope } from './unwrapEnvelope'

/**
 * Fetch all public accountants.
 * Passes the requesting company ID so the backend can embed the requestStatus
 * (null / "pending" / "active") relative to that company.
 *
 * @param {string|number|null} companyId - The company sending requests (optional).
 * @param {string} token - JWT bearer token.
 * @returns {Promise<Array>} List of public accountant objects.
 */
export async function getPublicAccountants(companyId, token) {
  const response = await apiRequest(URLS.accountants.base, {
    token,
    query: companyId ? { companyId } : {},
  })
  return unwrapEnvelope(response)
}

/**
 * Fetch paginated public accountants with search, sort, and enriched profiles.
 *
 * @param {object} params
 * @param {string|number|null} params.companyId
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @param {string} [params.search]
 * @param {string} [params.sortBy='name'] - name, email, experience, rating
 * @param {string} [params.sortDirection='ASC']
 * @param {string} token
 * @returns {Promise<{items: Array, totalCount: number, page: number, limit: number}>}
 */
export async function getPublicAccountantsPaginated(params = {}, token) {
  const {
    companyId,
    page = 1,
    limit = 20,
    search,
    sortBy = 'name',
    sortDirection = 'ASC',
  } = params
  const response = await apiRequest(URLS.accountants.paginated, {
    token,
    query: {
      companyId,
      page,
      limit,
      search: search || undefined,
      sortBy,
      sortDirection,
    },
  })
  return unwrapEnvelope(response)
}

/**
 * Send a work request from a company to an accountant.
 *
 * @param {string|number} accountantId - Target accountant user ID.
 * @param {string|number} companyId - Company sending the request.
 * @param {string} token - JWT bearer token.
 * @returns {Promise<any>} Response payload.
 */
export async function sendAccountantRequest(accountantId, companyId, token) {
  const response = await apiRequest(URLS.accountants.sendRequest(accountantId), {
    method: 'POST',
    body: { companyId },
    token,
  })
  return unwrapEnvelope(response)
}

/**
 * Fetch pending work requests for an accountant.
 *
 * @param {string|number} accountantId - Accountant user ID.
 * @param {string} token - JWT bearer token.
 * @returns {Promise<Array>} List of pending access request objects.
 */
export async function getAccountantRequests(accountantId, token) {
  const response = await apiRequest(URLS.accountants.requests(accountantId), { token })
  return unwrapEnvelope(response)
}

/**
 * Fetch companies an accountant is actively working with.
 *
 * @param {string|number} accountantId - Accountant user ID.
 * @param {string} token - JWT bearer token.
 * @returns {Promise<Array>} List of company objects.
 */
export async function getAccountantCompanies(accountantId, token) {
  const response = await apiRequest(URLS.accountants.companies(accountantId), { token })
  return unwrapEnvelope(response)
}

/**
 * Accept or decline a pending work request.
 *
 * @param {string|number} requestId - Access record ID.
 * @param {boolean} accept - True to accept, false to decline.
 * @param {string} token - JWT bearer token.
 * @returns {Promise<any>} Response payload.
 */
export async function respondToRequest(requestId, accept, token) {
  const response = await apiRequest(URLS.accountants.respondToRequest(requestId), {
    method: 'PATCH',
    body: { accept },
    token,
  })
  return unwrapEnvelope(response)
}

export async function disconnectAccountant(accountantId, companyId, token) {
  const url = `${URLS.accountants.base}/${accountantId}/connection?companyId=${companyId}`
  const response = await apiRequest(url, {
    method: 'DELETE',
    token,
  })
  return unwrapEnvelope(response)
}
