import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'
import { unwrapEnvelope } from './unwrapEnvelope'

/**
 * Fetch aggregated admin dashboard statistics.
 *
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the admin stats endpoint.
 */
export async function getAdminStats(token) {
  const response = await apiRequest(URLS.admin.stats, { token })
  return unwrapEnvelope(response)
}

/**
 * Fetch a paginated list of admin users.
 *
 * @param {object} [params={}] - Query parameters for listing users.
 * @param {number} [params.page=1] - Page number to request.
 * @param {number} [params.limit=20] - Page size.
 * @param {string|null} [params.role=null] - Optional role filter.
 * @param {string|null} [params.search=null] - Optional search text.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the admin users endpoint.
 */
export async function getAdminUsers(params = {}, token) {
  const { page = 1, limit = 20, role = null, search = null } = params

  const response = await apiRequest(URLS.admin.users, {
    query: { page, limit, role, search },
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Toggle the active state of an admin user.
 *
 * @param {string|number} userId - Identifier of the user to toggle.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the toggle user endpoint.
 */
export async function toggleAdminUserActive(userId, token) {
  const response = await apiRequest(URLS.admin.toggleUser(userId), {
    method: 'PATCH',
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Fetch admin logs with optional paging and filtering.
 *
 * @param {object} [params={}] - Query parameters for the logs request.
 * @param {number} [params.page=1] - Page number to request.
 * @param {number} [params.limit=50] - Page size.
 * @param {string|null} [params.level=null] - Optional log severity filter.
 * @param {string|null} [params.category=null] - Optional log category filter.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the admin logs endpoint.
 */
export async function getAdminLogs(params = {}, token) {
  const { page = 1, limit = 50, level = null, category = null } = params

  const response = await apiRequest(URLS.admin.logs, {
    query: { page, limit, level, category },
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Fetch admin audit logs with paging and optional company filtering.
 *
 * @param {object} [params={}] - Query parameters for audit logs.
 * @param {number} [params.page=1] - Page number to request.
 * @param {number} [params.limit=50] - Page size.
 * @param {string|null} [params.companyId=null] - Optional company filter.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the audit logs endpoint.
 */
export async function getAdminAuditLogs(params = {}, token) {
  const { page = 1, limit = 50, companyId = null } = params

  const response = await apiRequest(URLS.admin.auditLogs, {
    query: { page, limit, companyId },
    token,
  })

  return unwrapEnvelope(response)
}
