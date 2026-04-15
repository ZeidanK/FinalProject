/**
 * Extract the payload from a backend response envelope.
 *
 * Some API responses wrap data inside an envelope with metadata like
 * `success` or `code`. This helper returns the inner `data` value when
 * that shape is detected, otherwise it returns the original response.
 *
 * @param {unknown} response - The API response to normalize.
 * @returns {unknown} The unwrapped data payload or the original response.
 */
export function unwrapEnvelope(response) {
  if (!response || typeof response !== 'object') {
    return response
  }

  const hasEnvelopeShape =
    Object.prototype.hasOwnProperty.call(response, 'data') &&
    (Object.prototype.hasOwnProperty.call(response, 'success') ||
      Object.prototype.hasOwnProperty.call(response, 'code'))

  if (!hasEnvelopeShape) {
    return response
  }

  return response.data
}
