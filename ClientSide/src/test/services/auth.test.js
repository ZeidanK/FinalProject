import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  registerUser,
  loginUser,
  validateSession,
  saveAuthSession,
  clearAuthSession,
  getStoredAuthSession,
} from '../../services/auth'

const originalFetch = globalThis.fetch

describe('auth service (api calls)', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    localStorage.clear()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  describe('registerUser', () => {
    it('calls register endpoint and unwraps envelope', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ success: true, data: { userId: 1 } }),
      })

      const result = await registerUser({ name: 'John', email: 'john@test.com', password: 'secret123' })
      expect(result).toEqual({ userId: 1 })
    })

    it('throws on failure', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ message: 'Email exists' }),
      })

      await expect(registerUser({})).rejects.toThrow('Email exists')
    })
  })

  describe('loginUser', () => {
    it('calls login endpoint and unwraps envelope', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ success: true, data: { token: 'jwt', user: { id: 1 } } }),
      })

      const result = await loginUser({ email: 'john@test.com', password: 'secret' })
      expect(result).toEqual({ token: 'jwt', user: { id: 1 } })
    })
  })

  describe('validateSession', () => {
    it('calls validate endpoint with token', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ success: true, data: { id: 1, email: 'john@test.com' } }),
      })

      const result = await validateSession('token123')
      expect(result).toEqual({ id: 1, email: 'john@test.com' })
    })
  })
})

describe('auth session persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('saveAuthSession', () => {
    it('saves token and user to localStorage', () => {
      saveAuthSession('token123', { id: 1, name: 'John' })
      expect(localStorage.getItem('authToken')).toBe('token123')
      expect(JSON.parse(localStorage.getItem('authUser'))).toEqual({ id: 1, name: 'John' })
    })
  })

  describe('clearAuthSession', () => {
    it('removes token and user from localStorage', () => {
      localStorage.setItem('authToken', 'token123')
      localStorage.setItem('authUser', JSON.stringify({ id: 1 }))
      clearAuthSession()
      expect(localStorage.getItem('authToken')).toBeNull()
      expect(localStorage.getItem('authUser')).toBeNull()
    })
  })

  describe('getStoredAuthSession', () => {
    it('returns parsed session when data exists', () => {
      localStorage.setItem('authToken', 'token123')
      localStorage.setItem('authUser', JSON.stringify({ id: 1, name: 'John' }))
      const session = getStoredAuthSession()
      expect(session).toEqual({ token: 'token123', user: { id: 1, name: 'John' } })
    })

    it('returns null when token is missing', () => {
      localStorage.setItem('authUser', JSON.stringify({ id: 1 }))
      expect(getStoredAuthSession()).toBeNull()
    })

    it('returns null when user data is missing', () => {
      localStorage.setItem('authToken', 'token123')
      expect(getStoredAuthSession()).toBeNull()
    })

    it('returns null and clears on corrupt JSON', () => {
      localStorage.setItem('authToken', 'token123')
      localStorage.setItem('authUser', '{corrupt}')
      expect(getStoredAuthSession()).toBeNull()
      expect(localStorage.getItem('authToken')).toBeNull()
    })
  })
})
