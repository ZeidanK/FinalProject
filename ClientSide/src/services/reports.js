import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'

export function getDashboardReport(companyId, token) {
  return apiRequest(URLS.reports.dashboard(companyId), { token })
}

export function getVatReport(companyId, filters = {}, token) {
  return apiRequest(URLS.reports.vat(companyId), {
    query: filters,
    token,
  })
}

export function getReconciliationReport(companyId, filters = {}, token) {
  return apiRequest(URLS.reports.reconciliation(companyId), {
    query: filters,
    token,
  })
}
