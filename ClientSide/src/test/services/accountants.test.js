import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getPublicAccountants, getPublicAccountantsPaginated, sendAccountantRequest, getAccountantRequests, getAccountantCompanies, respondToRequest } from '../../services/accountants'

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

  it('getPublicAccountantsPaginated fetches with defaults', async () => {
    const pagedResponse = { items: [{ id: 1, name: 'Test' }], totalCount: 1, page: 1, limit: 20 }
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve(pagedResponse) })
    const result = await getPublicAccountantsPaginated({}, 'token')
    expect(result.totalCount).toBe(1)
    expect(result.items).toHaveLength(1)
  })

  it('getPublicAccountantsPaginated passes query params', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ items: [], totalCount: 0, page: 1, limit: 10 }) })
    await getPublicAccountantsPaginated({ companyId: 5, page: 2, limit: 10, search: 'bob', sortBy: 'experience', sortDirection: 'DESC' }, 'token')
    const calledUrl = globalThis.fetch.mock.calls[0][0]
    expect(calledUrl).toContain('page=2')
    expect(calledUrl).toContain('limit=10')
    expect(calledUrl).toContain('search=bob')
    expect(calledUrl).toContain('sortBy=experience')
    expect(calledUrl).toContain('sortDirection=DESC')
  })
})
