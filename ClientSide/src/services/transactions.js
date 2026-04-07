import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'
import { unwrapEnvelope } from './unwrapEnvelope'

export async function getTransactionsByCompany(companyId, filters, token) {
  const nextFilters = filters || {}
  const response = await apiRequest(URLS.transactions.byCompany(companyId), {
    query: nextFilters,
    token,
  })

  return unwrapEnvelope(response)
}

export async function getTransactionById(transactionId, token) {
  const response = await apiRequest(URLS.transactions.byId(transactionId), { token })
  return unwrapEnvelope(response)
}

export async function createTransaction(payload, token) {
  const response = await apiRequest(URLS.transactions.base, {
    method: 'POST',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

export async function createTransactionsBulk(payload, token) {
  const response = await apiRequest(URLS.transactions.bulk, {
    method: 'POST',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

export async function importExcelTransactions(payload, token) {
  const response = await apiRequest(URLS.transactions.importExcel, {
    method: 'POST',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

export async function deleteTransaction(transactionId, token) {
  const response = await apiRequest(URLS.transactions.byId(transactionId), {
    method: 'DELETE',
    token,
  })

  return unwrapEnvelope(response)
}

export async function bulkDeleteTransactions(ids, token) {
  const response = await apiRequest(URLS.transactions.bulkDelete, {
    method: 'DELETE',
    body: { ids },
    token,
  })

  return unwrapEnvelope(response)
}

export async function previewExcel(file, companyId, token) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('companyId', companyId)
  const response = await apiRequest(URLS.transactions.previewExcel, {
    method: 'POST',
    body: formData,
    token,
  })

  return unwrapEnvelope(response)
}
