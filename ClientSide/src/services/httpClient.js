/**
 * Determine whether a query parameter value should be excluded.
 *
 * @param {unknown} value - The value to evaluate.
 * @returns {boolean} True when the value is undefined, null, or an empty string.
 */
const isSkippableValue = (value) =>
  value === undefined || value === null || value === ''

const SESSION_REVOKED_EVENT = 'auth:session-revoked'

const dispatchSessionRevoked = (error) => {
  if (
    typeof globalThis.dispatchEvent !== 'function' ||
    typeof globalThis.CustomEvent !== 'function'
  ) {
    return
  }

  globalThis.dispatchEvent(new CustomEvent(SESSION_REVOKED_EVENT, {
    detail: { error },
  }))
}

/**
 * Build a URL query string from an object of query values.
 *
 * @param {object} [query={}] - Query parameters to serialize.
 * @returns {string} Serialized query string beginning with '?', or an empty string.
 */
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

/**
 * Parse a fetch response body when possible.
 *
 * If JSON is returned, parses and returns it; otherwise returns text or null.
 *
 * @param {Response} response - Fetch API response.
 * @returns {Promise<any>} Parsed response body or null.
 */
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

/**
 * Create a standardized API error object.
 *
 * @param {object} params - Error creation parameters.
 * @param {Response} params.response - Fetch response object.
 * @param {any} params.data - Parsed response body.
 * @param {string} params.url - Requested URL.
 * @returns {Error} Error with status, code, data, and url metadata.
 */
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

/**
 * Determine whether the request body should be serialized as JSON.
 *
 * @param {any} body - Request body value.
 * @returns {boolean} True when body should be stringified.
 */
const shouldSerializeBody = (body) =>
  typeof body === 'object' &&
  body !== null &&
  !(body instanceof FormData) &&
  !(body instanceof Blob) &&
  !(body instanceof URLSearchParams)

/**
 * Send an API request and return parsed response data.
 *
 * @param {string} url - Base endpoint URL.
 * @param {object} [options={}] - Fetch options and helpers.
 * @param {string} [options.method='GET'] - HTTP method.
 * @param {any} [options.body] - Request body to send.
 * @param {object} [options.headers={}] - Additional request headers.
 * @param {object} [options.query] - URL query parameters.
 * @param {string} [options.token] - Optional bearer token.
 * @param {AbortSignal} [options.signal] - Optional abort signal.
 * @returns {Promise<any>} Parsed response body.
 * @throws {Error} When the request fails or the response status is not ok.
 */
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
    const error = createApiError({ response, data, url: requestUrl })
    if (response.status === 401 && token) {
      dispatchSessionRevoked(error)
    }
    throw error
  }

  return data
}
