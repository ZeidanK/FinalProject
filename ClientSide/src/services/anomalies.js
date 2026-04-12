import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'
import { unwrapEnvelope } from './unwrapEnvelope'

/**
 * Fetch anomalies for a specific company.
 *
 * @param {string|number} companyId - Company identifier.
 * @param {object} [filters={}] - Optional query filters.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the anomalies endpoint.
 */
export async function getAnomaliesByCompany(companyId, filters = {}, token) {
  const response = await apiRequest(URLS.anomalies.byCompany(companyId), {
    query: filters,
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Fetch a single anomaly by ID.
 *
 * @param {string|number} anomalyId - Anomaly identifier.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the anomaly detail endpoint.
 */
export async function getAnomalyById(anomalyId, token) {
  const response = await apiRequest(URLS.anomalies.byId(anomalyId), { token })
  return unwrapEnvelope(response)
}

/**
 * Fetch anomaly statistics for a company.
 *
 * @param {string|number} companyId - Company identifier.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the anomaly stats endpoint.
 */
export async function getAnomalyStats(companyId, token) {
  const response = await apiRequest(URLS.anomalies.stats(companyId), { token })
  return unwrapEnvelope(response)
}

/**
 * Create a new anomaly record.
 *
 * @param {object} payload - Anomaly data to create.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the create anomaly endpoint.
 */
export async function createAnomaly(payload, token) {
  const response = await apiRequest(URLS.anomalies.base, {
    method: 'POST',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Resolve an existing anomaly.
 *
 * @param {string|number} anomalyId - Anomaly identifier.
 * @param {object} payload - Resolution details payload.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the resolve anomaly endpoint.
 */
export async function resolveAnomaly(anomalyId, payload, token) {
  const response = await apiRequest(URLS.anomalies.resolve(anomalyId), {
    method: 'PATCH',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}
