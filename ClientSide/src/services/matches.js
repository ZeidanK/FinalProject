import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'
import { unwrapEnvelope } from './unwrapEnvelope'

/**
 * Fetch matches for a specific company.
 *
 * @param {string|number} companyId - Identifier for the company.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the company matches endpoint.
 */
export async function getMatchesByCompany(companyId, token) {
  const response = await apiRequest(URLS.matches.byCompany(companyId), { token })
  return unwrapEnvelope(response)
}

/**
 * Fetch details for a single match by ID.
 *
 * @param {string|number} matchId - Identifier for the match.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the match detail endpoint.
 */
export async function getMatchById(matchId, token) {
  const response = await apiRequest(URLS.matches.byId(matchId), { token })
  return unwrapEnvelope(response)
}

/**
 * Fetch match suggestions for a specific invoice.
 *
 * @param {string|number} invoiceId - Invoice identifier.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the suggestions endpoint.
 */
export async function getMatchSuggestions(invoiceId, token) {
  const response = await apiRequest(URLS.matches.suggestions(invoiceId), { token })
  return unwrapEnvelope(response)
}

/**
 * Create a new manual match.
 *
 * @param {object} payload - Match data payload.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the create match endpoint.
 */
export async function createMatch(payload, token) {
  const response = await apiRequest(URLS.matches.base, {
    method: 'POST',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Delete a match by ID.
 *
 * @param {string|number} matchId - Identifier for the match.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the delete match endpoint.
 */
export async function deleteMatch(matchId, token) {
  const response = await apiRequest(URLS.matches.byId(matchId), {
    method: 'DELETE',
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Attempt an automatic match for a specific invoice.
 *
 * @param {string|number} invoiceId - Invoice identifier.
 * @param {number} [minConfidence=70] - Minimum confidence threshold for auto-matching.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the auto-match endpoint.
 */
export async function autoMatchInvoice(invoiceId, minConfidence, token) {
  const nextMinConfidence = minConfidence ?? 70
  const response = await apiRequest(URLS.matches.autoMatch(invoiceId), {
    method: 'POST',
    query: { minConfidence: nextMinConfidence },
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Attempt automatic matching for all invoices in a company.
 *
 * @param {string|number} companyId - Company identifier.
 * @param {number} [minConfidence=70] - Minimum confidence threshold for auto-matching.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the batch auto-match endpoint.
 */
export async function autoMatchBatch(companyId, minConfidence, token) {
  const nextMinConfidence = minConfidence ?? 70
  const response = await apiRequest(URLS.matches.autoMatchBatch(companyId), {
    method: 'POST',
    query: { minConfidence: nextMinConfidence },
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Attempt auto-matching when the company view loads.
 *
 * @param {string|number} companyId - Company identifier.
 * @param {number} [minConfidence=70] - Minimum confidence threshold for auto-matching.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the on-load auto-match endpoint.
 */
export async function autoMatchOnLoad(companyId, minConfidence, token) {
  const nextMinConfidence = minConfidence ?? 70
  const response = await apiRequest(URLS.matches.autoMatchOnLoad(companyId), {
    method: 'POST',
    query: { minConfidence: nextMinConfidence },
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Fetch simple match suggestions for a company.
 *
 * @param {string|number} companyId - Company identifier.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the simple suggestions endpoint.
 */
export async function getSimpleSuggestions(companyId, token) {
  const response = await apiRequest(URLS.matches.simpleSuggestions(companyId), { token })
  return unwrapEnvelope(response)
}

/**
 * Fetch installment match suggestions for a company.
 *
 * @param {string|number} companyId - Company identifier.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the installment suggestions endpoint.
 */
export async function getInstallmentSuggestions(companyId, token) {
  const response = await apiRequest(URLS.matches.installmentSuggestions(companyId), { token })
  return unwrapEnvelope(response)
}
