import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'
import { unwrapEnvelope } from './unwrapEnvelope'

export async function getCompanyById(companyId, token) {
  const response = await apiRequest(URLS.companies.byId(companyId), { token })
  return unwrapEnvelope(response)
}

export async function getCompaniesByUser(userId, token) {
  const response = await apiRequest(URLS.companies.byUser(userId), { token })
  return unwrapEnvelope(response)
}

export async function getAllCompanies(token) {
  const response = await apiRequest(URLS.companies.base, { token })
  return unwrapEnvelope(response)
}

export async function createCompany(payload, token) {
  const response = await apiRequest(URLS.companies.base, {
    method: 'POST',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

export async function updateCompany(companyId, payload, token) {
  const response = await apiRequest(URLS.companies.byId(companyId), {
    method: 'PUT',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

export async function deleteCompany(companyId, token) {
  const response = await apiRequest(URLS.companies.byId(companyId), {
    method: 'DELETE',
    token,
  })

  return unwrapEnvelope(response)
}
