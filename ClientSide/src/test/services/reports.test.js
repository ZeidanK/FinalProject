import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getDashboardReport, getReconciliationReport, getPayablesAgingReport } from '../../services/reports'

const originalFetch = globalThis.fetch

describe('reports service', () => {
  beforeEach(() => { globalThis.fetch = vi.fn() })
  afterEach(() => { globalThis.fetch = originalFetch })

  it('getDashboardReport fetches', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: { totalInvoices: 100 } }) })
    expect(await getDashboardReport(1, 'token')).toEqual({ totalInvoices: 100 })
  })

  it('getReconciliationReport fetches with filters', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: { matched: 50 } }) })
    expect(await getReconciliationReport(1, { dateFrom: '2025-01-01' }, 'token')).toEqual({ matched: 50 })
  })

  it('getPayablesAgingReport fetches', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ success: true, data: { aging: [] } }) })
    expect(await getPayablesAgingReport(1, {}, 'token')).toEqual({ aging: [] })
  })
})
