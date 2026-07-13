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

/**
 * Fetch all specialties for an accountant.
 *
 * @param {string|number} accountantId
 * @param {string} token
 * @returns {Promise<string[]>}
 */
export async function getAccountantSpecialties(accountantId, token) {
  const response = await apiRequest(URLS.accountants.specialties(accountantId), { token })
  return unwrapEnvelope(response)
}

/**
 * Add a specialty to an accountant's profile.
 *
 * @param {string|number} accountantId
 * @param {string} specialty
 * @param {string} token
 * @returns {Promise<any>}
 */
export async function addAccountantSpecialty(accountantId, specialty, token) {
  const response = await apiRequest(URLS.accountants.specialties(accountantId), {
    method: 'POST',
    body: { specialty },
    token,
  })
  return unwrapEnvelope(response)
}

/**
 * Remove a specialty from an accountant's profile.
 *
 * @param {string|number} accountantId
 * @param {string} specialty
 * @param {string} token
 * @returns {Promise<any>}
 */
export async function removeAccountantSpecialty(accountantId, specialty, token) {
  const url = `${URLS.accountants.specialties(accountantId)}?specialty=${encodeURIComponent(specialty)}`
  const response = await apiRequest(url, {
    method: 'DELETE',
    token,
  })
  return unwrapEnvelope(response)
}

/**
 * Fetch all certifications for an accountant.
 *
 * @param {string|number} accountantId
 * @param {string} token
 * @returns {Promise<string[]>}
 */
export async function getAccountantCertifications(accountantId, token) {
  const response = await apiRequest(URLS.accountants.certifications(accountantId), { token })
  return unwrapEnvelope(response)
}

/**
 * Add a certification to an accountant's profile.
 *
 * @param {string|number} accountantId
 * @param {string} certification
 * @param {string} token
 * @returns {Promise<any>}
 */
export async function addAccountantCertification(accountantId, certification, token) {
  const response = await apiRequest(URLS.accountants.certifications(accountantId), {
    method: 'POST',
    body: { certification },
    token,
  })
  return unwrapEnvelope(response)
}

/**
 * Remove a certification from an accountant's profile.
 *
 * @param {string|number} accountantId
 * @param {string} certification
 * @param {string} token
 * @returns {Promise<any>}
 */
export async function removeAccountantCertification(accountantId, certification, token) {
  const url = `${URLS.accountants.certifications(accountantId)}?certification=${encodeURIComponent(certification)}`
  const response = await apiRequest(url, {
    method: 'DELETE',
    token,
  })
  return unwrapEnvelope(response)
}

/**
 * Fetch all written reviews for an accountant.
 *
 * @param {string|number} accountantId
 * @param {string} token
 * @returns {Promise<Array>}
 */
export async function getAccountantReviews(accountantId, token) {
  const response = await apiRequest(URLS.accountants.reviews(accountantId), { token })
  return unwrapEnvelope(response)
}

/**
 * Submit or update a review for an accountant.
 *
 * @param {string|number} accountantId
 * @param {string|number} companyId
 * @param {number} rating - 1-5
 * @param {string|null} review
 * @param {string} token
 * @returns {Promise<any>}
 */
export async function submitAccountantReview(accountantId, companyId, rating, review, token) {
  const response = await apiRequest(URLS.accountants.reviews(accountantId), {
    method: 'POST',
    body: { companyId, rating, review },
    token,
  })
  return unwrapEnvelope(response)
}

export async function cancelAccountantRequest(accountantId, companyId, token) {
  const url = `${URLS.accountants.base}/${accountantId}/request?companyId=${companyId}`
  const response = await apiRequest(url, {
    method: 'DELETE',
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
