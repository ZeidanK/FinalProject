import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'
import { unwrapEnvelope } from './unwrapEnvelope'

/**
 * Fetch a user by ID.
 *
 * @param {string|number} userId - User identifier.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the user detail endpoint.
 */
export async function getUserById(userId, token) {
  const response = await apiRequest(URLS.users.byId(userId), { token })
  return unwrapEnvelope(response)
}

/**
 * Update user profile details.
 *
 * @param {string|number} userId - User identifier.
 * @param {object} payload - User fields to update.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the update user endpoint.
 */
export async function updateUser(userId, payload, token) {
  const response = await apiRequest(URLS.users.byId(userId), {
    method: 'PUT',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Change a user's password.
 *
 * @param {string|number} userId - User identifier.
 * @param {object} payload - Password change payload.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the change password endpoint.
 */
export async function changePassword(userId, payload, token) {
  const response = await apiRequest(URLS.users.changePassword(userId), {
    method: 'PATCH',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Upload a profile picture for a user.
 *
 * @param {string|number} userId - User identifier.
 * @param {File} file - Profile image file to upload.
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the profile picture upload endpoint.
 */
export async function uploadProfilePicture(userId, file, token) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiRequest(URLS.users.profilePicture(userId), {
    method: 'POST',
    body: formData,
    token,
  })

  return unwrapEnvelope(response)
}
