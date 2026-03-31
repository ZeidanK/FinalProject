import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'

export function getCompanyById(companyId, token) {
  return apiRequest(URLS.companies.byId(companyId), { token })
}

export function getCompaniesByUser(userId, token) {
  return apiRequest(URLS.companies.byUser(userId), { token })
}

export function createCompany(payload, token) {
  return apiRequest(URLS.companies.base, {
    method: 'POST',
    body: payload,
    token,
  })
}

export function updateCompany(companyId, payload, token) {
  return apiRequest(URLS.companies.byId(companyId), {
    method: 'PUT',
    body: payload,
    token,
  })
}
