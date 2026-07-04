import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiRequest } from '../../services/httpClient'

const originalFetch = globalThis.fetch

describe('apiRequest', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('performs GET request by default', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ data: 'ok' }),
    })

    const result = await apiRequest('/api/test')
    expect(result).toEqual({ data: 'ok' })
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('sends JSON body for object payloads', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true }),
    })

    await apiRequest('/api/test', {
      method: 'POST',
      body: { name: 'test' },
    })

    const call = globalThis.fetch.mock.calls[0]
    expect(call[1].body).toBe(JSON.stringify({ name: 'test' }))
    expect(call[1].headers['Content-Type']).toBe('application/json')
  })

  it('appends Authorization header when token is provided', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({}),
    })

    await apiRequest('/api/test', { token: 'abc123' })

    const call = globalThis.fetch.mock.calls[0]
    expect(call[1].headers.Authorization).toBe('Bearer abc123')
  })

  it('builds query string from query params', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({}),
    })

    await apiRequest('/api/test', { query: { page: 1, limit: 10 } })

    const call = globalThis.fetch.mock.calls[0]
    expect(call[0]).toBe('/api/test?page=1&limit=10')
  })

  it('skips null/undefined/empty query params', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({}),
    })

    await apiRequest('/api/test', { query: { page: 1, search: null, filter: undefined, sort: '' } })

    const call = globalThis.fetch.mock.calls[0]
    expect(call[0]).toBe('/api/test?page=1')
  })

  it('handles array query params', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({}),
    })

    await apiRequest('/api/test', { query: { ids: [1, 2, 3] } })

    const call = globalThis.fetch.mock.calls[0]
    expect(call[0]).toBe('/api/test?ids=1&ids=2&ids=3')
  })

  it('throws ApiError on non-ok response', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ message: 'Unauthorized', code: 'AUTH_FAILED' }),
    })

    const err = await apiRequest('/api/test').catch(e => e)
    expect(err.message).toBe('Unauthorized')
    expect(err.status).toBe(401)
    expect(err.code).toBe('AUTH_FAILED')
  })

  it('does not serialize FormData', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({}),
    })

    const formData = new FormData()
    formData.append('file', 'test')
    await apiRequest('/api/upload', { method: 'POST', body: formData })

    const call = globalThis.fetch.mock.calls[0]
    expect(call[1].body).toBe(formData)
    expect(call[1].headers['Content-Type']).toBeUndefined()
  })

  it('passes abort signal to fetch', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({}),
    })

    const controller = new AbortController()
    await apiRequest('/api/test', { signal: controller.signal })

    const call = globalThis.fetch.mock.calls[0]
    expect(call[1].signal).toBe(controller.signal)
  })

  it('returns null when JSON parsing fails', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.reject(new Error('parse error')),
    })

    const result = await apiRequest('/api/test')
    expect(result).toBeNull()
  })

  it('returns text for non-JSON responses', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: () => Promise.resolve('plain text'),
    })

    const result = await apiRequest('/api/test')
    expect(result).toBe('plain text')
  })
})
