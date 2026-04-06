import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'
import { unwrapEnvelope } from './unwrapEnvelope'

export async function getAnomaliesByCompany(companyId, filters = {}, token) {
  const response = await apiRequest(URLS.anomalies.byCompany(companyId), {
    query: filters,
    token,
  })

  return unwrapEnvelope(response)
}

export async function getAnomalyById(anomalyId, token) {
  const response = await apiRequest(URLS.anomalies.byId(anomalyId), { token })
  return unwrapEnvelope(response)
}

export async function getAnomalyStats(companyId, token) {
  const response = await apiRequest(URLS.anomalies.stats(companyId), { token })
  return unwrapEnvelope(response)
}

export async function createAnomaly(payload, token) {
  const response = await apiRequest(URLS.anomalies.base, {
    method: 'POST',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

export async function resolveAnomaly(anomalyId, payload, token) {
  const response = await apiRequest(URLS.anomalies.resolve(anomalyId), {
    method: 'PATCH',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}
