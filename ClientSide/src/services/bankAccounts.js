import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'

export function getBankAccountsByCompany(companyId, token) {
  return apiRequest(URLS.bankAccounts.byCompany(companyId), { token })
}

export function getBankAccountById(accountId, token) {
  return apiRequest(URLS.bankAccounts.byId(accountId), { token })
}

export function createBankAccount(payload, token) {
  return apiRequest(URLS.bankAccounts.base, {
    method: 'POST',
    body: payload,
    token,
  })
}

export function updateBankAccount(accountId, payload, token) {
  return apiRequest(URLS.bankAccounts.byId(accountId), {
    method: 'PUT',
    body: payload,
    token,
  })
}

export function deleteBankAccount(accountId, token) {
  return apiRequest(URLS.bankAccounts.byId(accountId), {
    method: 'DELETE',
    token,
  })
}
