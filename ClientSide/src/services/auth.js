import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'
import { unwrapEnvelope } from './unwrapEnvelope'

const AUTH_TOKEN_KEY = 'authToken'
const AUTH_USER_KEY = 'authUser'

export async function registerUser(payload) {
  const response = await apiRequest(URLS.auth.register, {
    method: 'POST',
    body: payload,
  })

  return unwrapEnvelope(response)
}

export async function loginUser(payload) {
  const response = await apiRequest(URLS.auth.login, {
    method: 'POST',
    body: payload,
  })

  return unwrapEnvelope(response)
}

export async function validateSession(token) {
  const response = await apiRequest(URLS.auth.validate, {
    method: 'POST',
    token,
  })

  return unwrapEnvelope(response)
}

export function saveAuthSession(token, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

export function getStoredAuthSession() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  const userRaw = localStorage.getItem(AUTH_USER_KEY)

  if (!token || !userRaw) {
    return null
  }

  try {
    return { token, user: JSON.parse(userRaw) }
  } catch {
    clearAuthSession()
    return null
  }
}
