import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'
import { unwrapEnvelope } from './unwrapEnvelope'

/**
 * Fetch bank accounts associated with a specific company.
 *
 * @param {string|number} companyId - Identifier for the company.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the company bank accounts endpoint.
 */
export async function getBankAccountsByCompany(companyId, token) {
  const response = await apiRequest(URLS.bankAccounts.byCompany(companyId), { token })
  return unwrapEnvelope(response)
}

/**
 * Fetch a single bank account by its ID.
 *
 * @param {string|number} accountId - Identifier for the bank account.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the bank account detail endpoint.
 */
export async function getBankAccountById(accountId, token) {
  const response = await apiRequest(URLS.bankAccounts.byId(accountId), { token })
  return unwrapEnvelope(response)
}

/**
 * Create a new bank account record.
 *
 * @param {object} payload - Bank account data to create.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the create bank account endpoint.
 */
export async function createBankAccount(payload, token) {
  const response = await apiRequest(URLS.bankAccounts.base, {
    method: 'POST',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Update an existing bank account.
 *
 * @param {string|number} accountId - Identifier for the bank account.
 * @param {object} payload - Updated bank account data.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the update bank account endpoint.
 */
export async function updateBankAccount(accountId, payload, token) {
  const response = await apiRequest(URLS.bankAccounts.byId(accountId), {
    method: 'PUT',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Delete a bank account by ID.
 *
 * @param {string|number} accountId - Identifier for the bank account.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the delete bank account endpoint.
 */
export async function deleteBankAccount(accountId, token) {
  const response = await apiRequest(URLS.bankAccounts.byId(accountId), {
    method: 'DELETE',
    token,
  })

  return unwrapEnvelope(response)
}
