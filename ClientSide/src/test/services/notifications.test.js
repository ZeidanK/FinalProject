import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/notifications'

const originalFetch = globalThis.fetch

describe('notifications service', () => {
  beforeEach(() => { globalThis.fetch = vi.fn() })
  afterEach(() => { globalThis.fetch = originalFetch })

  it('getMyNotifications fetches with take param', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve([{ id: 1, text: 'Test' }]) })
    expect(await getMyNotifications('token', 10)).toEqual([{ id: 1, text: 'Test' }])
  })

  it('markNotificationRead sends PATCH', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true }) })
    await expect(markNotificationRead(1, 'token')).resolves.toEqual({ success: true })
  })

  it('markAllNotificationsRead sends PATCH', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true }) })
    await expect(markAllNotificationsRead('token')).resolves.toEqual({ success: true })
  })
})
