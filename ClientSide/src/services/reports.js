import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'
import { unwrapEnvelope } from './unwrapEnvelope'

export async function getDashboardReport(companyId, token) {
  const response = await apiRequest(URLS.reports.dashboard(companyId), { token })
  return unwrapEnvelope(response)
}

export async function getVatReport(companyId, filters = {}, token) {
  const response = await apiRequest(URLS.reports.vat(companyId), {
    query: filters,
    token,
  })

  return unwrapEnvelope(response)
}

export async function getReconciliationReport(companyId, filters = {}, token) {
  const response = await apiRequest(URLS.reports.reconciliation(companyId), {
    query: filters,
    token,
  })

  return unwrapEnvelope(response)
}
