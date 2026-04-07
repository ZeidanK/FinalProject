import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'
import { unwrapEnvelope } from './unwrapEnvelope'

export async function getBankAccountsByCompany(companyId, token) {
  const response = await apiRequest(URLS.bankAccounts.byCompany(companyId), { token })
  return unwrapEnvelope(response)
}

export async function getBankAccountById(accountId, token) {
  const response = await apiRequest(URLS.bankAccounts.byId(accountId), { token })
  return unwrapEnvelope(response)
}

export async function createBankAccount(payload, token) {
  const response = await apiRequest(URLS.bankAccounts.base, {
    method: 'POST',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

export async function updateBankAccount(accountId, payload, token) {
  const response = await apiRequest(URLS.bankAccounts.byId(accountId), {
    method: 'PUT',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

export async function deleteBankAccount(accountId, token) {
  const response = await apiRequest(URLS.bankAccounts.byId(accountId), {
    method: 'DELETE',
    token,
  })

  return unwrapEnvelope(response)
}
