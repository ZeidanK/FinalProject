import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getAdminStats, getAdminUsers, toggleAdminUserBan, getAdminLogs, clearAdminLogs, getAdminAuditLogs, deleteAdminLog } from '../../services/admin'

const originalFetch = globalThis.fetch

describe('admin service', () => {
  beforeEach(() => { globalThis.fetch = vi.fn() })
  afterEach(() => { globalThis.fetch = originalFetch })

  it('getAdminStats fetches', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: { users: 10 } }) })
    expect(await getAdminStats('token')).toEqual({ users: 10 })
  })

  it('getAdminUsers fetches with defaults', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: [] }) })
    await getAdminUsers({}, 'token')
    const call = globalThis.fetch.mock.calls[0]
    expect(call[0]).toContain('page=1')
    expect(call[0]).toContain('limit=20')
  })

  it('toggleAdminUserBan sends PATCH', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: { isActive: false } }) })
    expect(await toggleAdminUserBan(1, 'token')).toEqual({ isActive: false })
  })

  it('getAdminLogs fetches with defaults', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: [] }) })
    await getAdminLogs({}, 'token')
    const call = globalThis.fetch.mock.calls[0]
    expect(call[0]).toContain('page=1')
    expect(call[0]).toContain('limit=50')
  })

  it('clearAdminLogs sends DELETE', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: { cleared: true } }) })
    expect(await clearAdminLogs('token')).toEqual({ cleared: true })
  })

  it('deleteAdminLog sends DELETE', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: null }) })
    await expect(deleteAdminLog(1, 'token')).resolves.toBeNull()
  })

  it('getAdminAuditLogs fetches', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: [] }) })
    await getAdminAuditLogs({}, 'token')
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })
})
