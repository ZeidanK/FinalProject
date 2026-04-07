import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'
import { unwrapEnvelope } from './unwrapEnvelope'

export async function getUserById(userId, token) {
  const response = await apiRequest(URLS.users.byId(userId), { token })
  return unwrapEnvelope(response)
}

export async function updateUser(userId, payload, token) {
  const response = await apiRequest(URLS.users.byId(userId), {
    method: 'PUT',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

export async function changePassword(userId, payload, token) {
  const response = await apiRequest(URLS.users.changePassword(userId), {
    method: 'PATCH',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

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
