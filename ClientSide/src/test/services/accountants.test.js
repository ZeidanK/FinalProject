import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getPublicAccountants, sendAccountantRequest, getAccountantRequests, getAccountantCompanies, respondToRequest } from '../../services/accountants'

const originalFetch = globalThis.fetch

describe('accountants service', () => {
  beforeEach(() => { globalThis.fetch = vi.fn() })
  afterEach(() => { globalThis.fetch = originalFetch })

  it('getPublicAccountants fetches without companyId', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: [] }) })
    await getPublicAccountants(null, 'token')
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('getPublicAccountants fetches with companyId', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: [{ id: 1 }] }) })
    expect(await getPublicAccountants(1, 'token')).toEqual([{ id: 1 }])
  })

  it('sendAccountantRequest sends POST', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: { requestId: 1 } }) })
    expect(await sendAccountantRequest(1, 2, 'token')).toEqual({ requestId: 1 })
  })

  it('getAccountantRequests fetches', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: [{ id: 1 }] }) })
    expect(await getAccountantRequests(1, 'token')).toEqual([{ id: 1 }])
  })

  it('getAccountantCompanies fetches', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: [{ id: 1 }] }) })
    expect(await getAccountantCompanies(1, 'token')).toEqual([{ id: 1 }])
  })

  it('respondToRequest sends PATCH', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: { status: 'active' } }) })
    expect(await respondToRequest(1, true, 'token')).toEqual({ status: 'active' })
  })
})
