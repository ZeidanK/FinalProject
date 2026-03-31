import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'

export function getUserById(userId, token) {
  return apiRequest(URLS.users.byId(userId), { token })
}

export function updateUser(userId, payload, token) {
  return apiRequest(URLS.users.byId(userId), {
    method: 'PUT',
    body: payload,
    token,
  })
}

export function changePassword(userId, payload, token) {
  return apiRequest(URLS.users.changePassword(userId), {
    method: 'PATCH',
    body: payload,
    token,
  })
}

export function uploadProfilePicture(userId, file, token) {
  const formData = new FormData()
  formData.append('file', file)

  return apiRequest(URLS.users.profilePicture(userId), {
    method: 'POST',
    body: formData,
    token,
  })
}
