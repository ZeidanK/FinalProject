import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getUserById, updateUser, changePassword, uploadProfilePicture, updateUserVisibility } from '../../services/users'

const originalFetch = globalThis.fetch

describe('users service', () => {
  beforeEach(() => { globalThis.fetch = vi.fn() })
  afterEach(() => { globalThis.fetch = originalFetch })

  it('getUserById fetches', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: { id: 1, name: 'John' } }) })
    expect(await getUserById(1, 'token')).toEqual({ id: 1, name: 'John' })
  })

  it('updateUser sends PUT', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: { id: 1 } }) })
    expect(await updateUser(1, { name: 'New Name' }, 'token')).toEqual({ id: 1 })
  })

  it('changePassword sends PATCH', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: { changed: true } }) })
    expect(await changePassword(1, { currentPassword: 'old', newPassword: 'new' }, 'token')).toEqual({ changed: true })
  })

  it('uploadProfilePicture sends FormData', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: { url: 'img.jpg' } }) })
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    expect(await uploadProfilePicture(1, file, 'token')).toEqual({ url: 'img.jpg' })
  })

  it('updateUserVisibility sends PATCH', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: { isPublic: true } }) })
    expect(await updateUserVisibility(1, true, 'token')).toEqual({ isPublic: true })
  })
})
