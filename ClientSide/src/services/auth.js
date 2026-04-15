import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'
import { unwrapEnvelope } from './unwrapEnvelope'

const AUTH_TOKEN_KEY = 'authToken'
const AUTH_USER_KEY = 'authUser'

/**
 * Register a new user account.
 *
 * @param {object} payload - Registration data to send to the backend.
 * @returns {Promise<any>} Unwrapped response payload from the registration endpoint.
 */
export async function registerUser(payload) {
  const response = await apiRequest(URLS.auth.register, {
    method: 'POST',
    body: payload,
  })

  return unwrapEnvelope(response)
}

/**
 * Authenticate a user and return session payload.
 *
 * @param {object} payload - Login credentials.
 * @returns {Promise<any>} Unwrapped response payload from the login endpoint.
 */
export async function loginUser(payload) {
  const response = await apiRequest(URLS.auth.login, {
    method: 'POST',
    body: payload,
  })

  return unwrapEnvelope(response)
}

/**
 * Validate the current user session token with the backend.
 *
 * @param {string} token - JWT token used for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the validation endpoint.
 */
export async function validateSession(token) {
  const response = await apiRequest(URLS.auth.validate, {
    method: 'POST',
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Persist the authenticated user session to localStorage.
 *
 * @param {string} token - Authentication token.
 * @param {object} user - Authenticated user data.
 */
export function saveAuthSession(token, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

/**
 * Clear the persisted authentication session from localStorage.
 */
export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

/**
 * Retrieve the persisted authentication session from localStorage.
 *
 * @returns {{token: string, user: any}|null} Stored auth session or null if unavailable.
 */
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
