import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getMatchesByCompany,
  getMatchById,
  getMatchSuggestions,
  createMatch,
  deleteMatch,
  autoMatchInvoice,
  autoMatchBatch,
} from '../../services/matches'

const originalFetch = globalThis.fetch

describe('matches service', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('getMatchesByCompany fetches list', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: [{ id: 1 }] }),
    })
    expect(await getMatchesByCompany(1, 'token')).toEqual([{ id: 1 }])
  })

  it('getMatchById fetches single', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { id: 1 } }),
    })
    expect(await getMatchById(1, 'token')).toEqual({ id: 1 })
  })

  it('getMatchSuggestions returns suggestions', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: [{ score: 85 }] }),
    })
    expect(await getMatchSuggestions(1, 'token')).toEqual([{ score: 85 }])
  })

  it('createMatch sends POST', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { id: 1 } }),
    })
    expect(await createMatch({ invoiceId: 1, transactionId: 1 }, 'token')).toEqual({ id: 1 })
  })

  it('deleteMatch sends DELETE', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: null }),
    })
    await expect(deleteMatch(1, 'token')).resolves.toBeNull()
  })

  it('autoMatchInvoice sends POST with minConfidence', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { matchId: 1 } }),
    })
    const result = await autoMatchInvoice(1, 80, 'token')
    expect(result).toEqual({ matchId: 1 })
  })

  it('autoMatchBatch sends POST', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { matched: 5 } }),
    })
    expect(await autoMatchBatch(1, 70, 'token')).toEqual({ matched: 5 })
  })
})
