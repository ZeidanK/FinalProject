import { URLS } from '../scripts/config'

const AUTH_TOKEN_KEY = 'authToken'
const AUTH_USER_KEY = 'authUser'

async function parseResponse(response) {
  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed. Please try again.')
  }

  return data
}

export async function registerUser(payload) {
  const response = await fetch(URLS.auth.register, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: '*/*',
    },
    body: JSON.stringify(payload),
  })

  return parseResponse(response)
}

export async function loginUser(payload) {
  const response = await fetch(URLS.auth.login, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: '*/*',
    },
    body: JSON.stringify(payload),
  })

  return parseResponse(response)
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
    return null
  }
}
