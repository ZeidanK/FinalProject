import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'

export function getAdminStats(token) {
  return apiRequest(URLS.admin.stats, { token })
}

export function getAdminUsers(params = {}, token) {
  const { page = 1, limit = 20, role = null, search = null } = params

  return apiRequest(URLS.admin.users, {
    query: { page, limit, role, search },
    token,
  })
}

export function toggleAdminUserActive(userId, token) {
  return apiRequest(URLS.admin.toggleUser(userId), {
    method: 'PATCH',
    token,
  })
}

export function getAdminLogs(params = {}, token) {
  const { page = 1, limit = 50, level = null, category = null } = params

  return apiRequest(URLS.admin.logs, {
    query: { page, limit, level, category },
    token,
  })
}

export function getAdminAuditLogs(params = {}, token) {
  const { page = 1, limit = 50, companyId = null } = params

  return apiRequest(URLS.admin.auditLogs, {
    query: { page, limit, companyId },
    token,
  })
}
