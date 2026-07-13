import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'
import { unwrapEnvelope } from './unwrapEnvelope'

/**
 * Fetch transactions for a specific company.
 *
 * @param {string|number} companyId - Company identifier.
 * @param {object} filters - Optional query filters.
 * @param {string} token - JWT token for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the transactions endpoint.
 */
export async function getTransactionsByCompany(companyId, filters, token) {
  const nextFilters = filters || {}
  const response = await apiRequest(URLS.transactions.byCompany(companyId), {
    query: nextFilters,
    token,
  })

  const unwrapped = unwrapEnvelope(response)

  if (unwrapped && typeof unwrapped === 'object' && !Array.isArray(unwrapped) && Array.isArray(unwrapped.items)) {
    return unwrapped.items
  }

  return unwrapped
}

/**
 * Fetch a single transaction by ID.
 *
 * @param {string|number} transactionId - Transaction identifier.
 * @param {string} token - JWT token for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the transaction detail endpoint.
 */
export async function getTransactionById(transactionId, token) {
  const response = await apiRequest(URLS.transactions.byId(transactionId), { token })
  return unwrapEnvelope(response)
}

/**
 * Create a new transaction.
 *
 * @param {object} payload - Transaction data payload.
 * @param {string} token - JWT token for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the create transaction endpoint.
 */
export async function createTransaction(payload, token) {
  const response = await apiRequest(URLS.transactions.base, {
    method: 'POST',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Create multiple transactions in bulk.
 *
 * @param {object} payload - Bulk transaction payload.
 * @param {string} token - JWT token for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the bulk create endpoint.
 */
export async function createTransactionsBulk(payload, token) {
  const response = await apiRequest(URLS.transactions.bulk, {
    method: 'POST',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Import transactions from an Excel payload.
 *
 * @param {FormData|object} payload - Excel import payload.
 * @param {string} token - JWT token for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the import Excel endpoint.
 */
export async function importExcelTransactions(payload, token) {
  const response = await apiRequest(URLS.transactions.importExcel, {
    method: 'POST',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Delete a transaction by ID.
 *
 * @param {string|number} transactionId - Transaction identifier.
 * @param {string} token - JWT token for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the delete transaction endpoint.
 */
export async function deleteTransaction(transactionId, token) {
  const response = await apiRequest(URLS.transactions.byId(transactionId), {
    method: 'DELETE',
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Delete multiple transactions by their IDs.
 *
 * @param {Array<string|number>} ids - Transaction IDs to delete.
 * @param {string} token - JWT token for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the bulk delete endpoint.
 */
export async function bulkDeleteTransactions(ids, token) {
  const response = await apiRequest(URLS.transactions.bulkDelete, {
    method: 'DELETE',
    body: { ids },
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Preview Excel transaction data before import.
 *
 * @param {File} file - Excel file to preview.
 * @param {string|number} companyId - Company identifier.
 * @param {string} token - JWT token for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the preview endpoint.
 */
/**
 * Set whether a transaction requires an invoice match.
 *
 * @param {string|number} id - Transaction identifier.
 * @param {boolean} requiresInvoice - Whether the transaction should expect an invoice.
 * @param {string} token - JWT token for authorization.
 * @returns {Promise<any>} Unwrapped response payload.
 */
export async function setRequiresInvoice(id, requiresInvoice, token) {
  const response = await apiRequest(URLS.transactions.requiresInvoice(id), {
    method: 'PATCH',
    body: { requiresInvoice },
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
