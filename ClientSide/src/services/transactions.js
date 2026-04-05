import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'

export function getTransactionsByCompany(companyId, filters = {}, token) {
  return apiRequest(URLS.transactions.byCompany(companyId), {
    query: filters,
    token,
  })
}

export function getTransactionById(transactionId, token) {
  return apiRequest(URLS.transactions.byId(transactionId), { token })
}

export function createTransaction(payload, token) {
  return apiRequest(URLS.transactions.base, {
    method: 'POST',
    body: payload,
    token,
  })
}

export function createTransactionsBulk(payload, token) {
  return apiRequest(URLS.transactions.bulk, {
    method: 'POST',
    body: payload,
    token,
  })
}

export function deleteTransaction(transactionId, token) {
  return apiRequest(URLS.transactions.byId(transactionId), {
    method: 'DELETE',
    token,
  })
}

export function bulkDeleteTransactions(ids, token) {
  return apiRequest(URLS.transactions.bulkDelete, {
    method: 'DELETE',
    body: { ids },
    token,
  })
}

export function previewExcel(file, companyId, token) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('companyId', companyId)
  return apiRequest(URLS.transactions.previewExcel, {
    method: 'POST',
    body: formData,
    token,
  })
}
