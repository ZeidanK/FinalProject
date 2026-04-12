import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'
import { unwrapEnvelope } from './unwrapEnvelope'

/**
 * Fetch a company by its identifier.
 *
 * @param {string|number} companyId - Identifier for the company.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the company detail endpoint.
 */
export async function getCompanyById(companyId, token) {
  const response = await apiRequest(URLS.companies.byId(companyId), { token })
  return unwrapEnvelope(response)
}

/**
 * Fetch companies associated with a specific user.
 *
 * @param {string|number} userId - Identifier for the user.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the user companies endpoint.
 */
export async function getCompaniesByUser(userId, token) {
  const response = await apiRequest(URLS.companies.byUser(userId), { token })
  return unwrapEnvelope(response)
}

/**
 * Fetch all companies.
 *
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the companies endpoint.
 */
export async function getAllCompanies(token) {
  const response = await apiRequest(URLS.companies.base, { token })
  return unwrapEnvelope(response)
}

/**
 * Grant access to a company for the current user.
 *
 * @param {string|number} companyId - Identifier for the company.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the grant access endpoint.
 */
export async function grantCompanyAccess(companyId, token) {
  const response = await apiRequest(URLS.companies.grantAccess(companyId), {
    method: 'POST',
    token,
  })
  return unwrapEnvelope(response)
}

/**
 * Create a new company.
 *
 * @param {object} payload - Company data to create.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the create company endpoint.
 */
export async function createCompany(payload, token) {
  const response = await apiRequest(URLS.companies.base, {
    method: 'POST',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Update an existing company.
 *
 * @param {string|number} companyId - Identifier for the company.
 * @param {object} payload - Updated company data.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the update company endpoint.
 */
export async function updateCompany(companyId, payload, token) {
  const response = await apiRequest(URLS.companies.byId(companyId), {
    method: 'PUT',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Delete a company by ID.
 *
 * @param {string|number} companyId - Identifier for the company.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the delete company endpoint.
 */
export async function deleteCompany(companyId, token) {
  const response = await apiRequest(URLS.companies.byId(companyId), {
    method: 'DELETE',
    token,
  })

  return unwrapEnvelope(response)
}
