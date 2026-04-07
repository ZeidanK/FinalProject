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
