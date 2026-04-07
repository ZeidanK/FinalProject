import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'
import { unwrapEnvelope } from './unwrapEnvelope'

export async function getAdminStats(token) {
  const response = await apiRequest(URLS.admin.stats, { token })
  return unwrapEnvelope(response)
}

export async function getAdminUsers(params = {}, token) {
  const { page = 1, limit = 20, role = null, search = null } = params

  const response = await apiRequest(URLS.admin.users, {
    query: { page, limit, role, search },
    token,
  })

  return unwrapEnvelope(response)
}

export async function toggleAdminUserActive(userId, token) {
  const response = await apiRequest(URLS.admin.toggleUser(userId), {
    method: 'PATCH',
    token,
  })

  return unwrapEnvelope(response)
}

export async function getAdminLogs(params = {}, token) {
  const { page = 1, limit = 50, level = null, category = null } = params

  const response = await apiRequest(URLS.admin.logs, {
    query: { page, limit, level, category },
    token,
  })

  return unwrapEnvelope(response)
}

export async function getAdminAuditLogs(params = {}, token) {
  const { page = 1, limit = 50, companyId = null } = params

  const response = await apiRequest(URLS.admin.auditLogs, {
    query: { page, limit, companyId },
    token,
  })

  return unwrapEnvelope(response)
}
