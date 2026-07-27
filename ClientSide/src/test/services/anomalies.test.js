import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getAnomaliesByCompany,
  getAnomalyById,
  getAnomalyStats,
  createAnomaly,
  resolveAnomaly,
  keepDuplicateInvoice,
} from '../../services/anomalies'

const originalFetch = globalThis.fetch

describe('anomalies service', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('getAnomaliesByCompany fetches with filters', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: [{ id: 1 }] }),
    })
    expect(await getAnomaliesByCompany(1, { severity: 'high' }, 'token')).toEqual([{ id: 1 }])
  })

  it('getAnomalyById fetches single', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { id: 1 } }),
    })
    expect(await getAnomalyById(1, 'token')).toEqual({ id: 1 })
  })

  it('getAnomalyStats fetches stats', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { open: 3, resolved: 7 } }),
    })
    expect(await getAnomalyStats(1, 'token')).toEqual({ open: 3, resolved: 7 })
  })

  it('createAnomaly sends POST', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { id: 1 } }),
    })
    expect(await createAnomaly({ type: 'duplicate' }, 'token')).toEqual({ id: 1 })
  })

  it('resolveAnomaly sends PATCH', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { id: 1, status: 'resolved' } }),
    })
    const result = await resolveAnomaly(1, { resolutionNotes: 'Fixed' }, 'token')
    expect(result).toEqual({ id: 1, status: 'resolved' })
  })

  it('keepDuplicateInvoice sends PATCH', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { resolved: true } }),
    })
    const result = await keepDuplicateInvoice(1, { keepInvoiceId: 2 }, 'token')
    expect(result).toEqual({ resolved: true })
  })
})
