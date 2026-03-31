import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'

export function getAnomaliesByCompany(companyId, filters = {}, token) {
  return apiRequest(URLS.anomalies.byCompany(companyId), {
    query: filters,
    token,
  })
}

export function getAnomalyById(anomalyId, token) {
  return apiRequest(URLS.anomalies.byId(anomalyId), { token })
}

export function getAnomalyStats(companyId, token) {
  return apiRequest(URLS.anomalies.stats(companyId), { token })
}

export function createAnomaly(payload, token) {
  return apiRequest(URLS.anomalies.base, {
    method: 'POST',
    body: payload,
    token,
  })
}

export function resolveAnomaly(anomalyId, payload, token) {
  return apiRequest(URLS.anomalies.resolve(anomalyId), {
    method: 'PATCH',
    body: payload,
    token,
  })
}
