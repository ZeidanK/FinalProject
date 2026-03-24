import { URLS } from '../scripts/config'

export async function registerUser(payload) {
  const response = await fetch(URLS.auth.register, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: '*/*',
    },
    body: JSON.stringify(payload),
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Registration failed. Please try again.')
  }

  return data
}
