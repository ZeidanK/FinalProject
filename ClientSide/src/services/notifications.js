import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'

/**
 * Fetch the current user's notifications.
 *
 * @param {string} token - JWT bearer token.
 * @param {number} [take=50] - Maximum number of notifications to return.
 * @returns {Promise<Array>} List of notification rows.
 */
export async function getMyNotifications(token, take = 50) {
  return apiRequest(URLS.notifications.mine, {
    token,
    query: { take },
  })
}

/** Fetch a cursor-paged, scoped notification inbox. */
export async function getNotificationInbox(token, {
  view = 'combined',
  companyId,
  cursor,
  take = 25,
} = {}) {
  return apiRequest(URLS.notifications.inbox, {
    token,
    query: { view, companyId, cursor, take },
  })
}

/**
 * Mark a single notification as read.
 *
 * @param {number} id - Notification ID.
 * @param {string} token - JWT bearer token.
 * @returns {Promise<any>}
 */
export async function markNotificationRead(id, token, { view = 'combined', companyId } = {}) {
  return apiRequest(URLS.notifications.markRead(id), {
    method: 'PATCH',
    token,
    query: { view, companyId },
  })
}

/**
 * Mark all of the current user's notifications as read.
 *
 * @param {string} token - JWT bearer token.
 * @returns {Promise<any>}
 */
export async function markAllNotificationsRead(token, { view = 'combined', companyId } = {}) {
  return apiRequest(URLS.notifications.markAllRead, {
    method: 'PATCH',
    token,
    query: { view, companyId },
  })
}
