const isSkippableValue = (value) =>
  value === undefined || value === null || value === ''

const buildQueryString = (query = {}) => {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (isSkippableValue(value)) {
      return
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (!isSkippableValue(entry)) {
          params.append(key, String(entry))
        }
      })
      return
    }

    params.append(key, String(value))
  })

  const value = params.toString()
  return value ? `?${value}` : ''
}

const parseResponseBody = async (response) => {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  try {
    const text = await response.text()
    return text || null
  } catch {
    return null
  }
}

const createApiError = ({ response, data, url }) => {
  const code =
    (data && typeof data === 'object' && data.code) ||
    `HTTP_${response.status}`

  const message =
    (data && typeof data === 'object' && data.message) ||
    `Request failed with status ${response.status}.`

  const error = new Error(message)
  error.code = code
  error.status = response.status
  error.data = data
  error.url = url

  return error
}

const shouldSerializeBody = (body) =>
  typeof body === 'object' &&
  body !== null &&
  !(body instanceof FormData) &&
  !(body instanceof Blob) &&
  !(body instanceof URLSearchParams)

export async function apiRequest(url, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    query,
    token,
    signal,
  } = options

  const requestUrl = `${url}${buildQueryString(query)}`
  const nextHeaders = {
    Accept: 'application/json',
    ...headers,
  }

  if (token) {
    nextHeaders.Authorization = `Bearer ${token}`
  }

  let payload = body
  if (shouldSerializeBody(body)) {
    nextHeaders['Content-Type'] = nextHeaders['Content-Type'] || 'application/json'
    payload = JSON.stringify(body)
  }

  const response = await fetch(requestUrl, {
    method,
    headers: nextHeaders,
    body: payload,
    signal,
  })

  const data = await parseResponseBody(response)

  if (!response.ok) {
    throw createApiError({ response, data, url: requestUrl })
  }

  return data
}
