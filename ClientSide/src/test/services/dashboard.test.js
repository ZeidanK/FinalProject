import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getDashboardStats, getRecentActivity, mapDashboardStatsToKpis } from '../../services/dashboard'

const originalFetch = globalThis.fetch

describe('dashboard service', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  describe('getDashboardStats', () => {
    it('fetches dashboard report', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true, headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ success: true, data: { totalInvoices: 100 } }),
      })
      const result = await getDashboardStats({ companyId: 1, token: 'token' })
      expect(result).toEqual({ totalInvoices: 100 })
    })
  })

  describe('getRecentActivity', () => {
    it('returns empty array when all fetches fail', async () => {
      globalThis.fetch.mockRejectedValue(new Error('fail'))
      const result = await getRecentActivity({ companyId: 1, token: 'token' })
      expect(result).toEqual([])
    })

    it('builds activity feed from fulfilled promises', async () => {
      globalThis.fetch
        .mockResolvedValueOnce({
          ok: true, headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ success: true, data: [{ id: 1, invoiceNumber: 'INV-001', vendorName: 'Acme', status: 'verified' }] }),
        })
        .mockResolvedValueOnce({
          ok: true, headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true, headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ success: true, data: [] }),
        })

      const result = await getRecentActivity({ companyId: 1, token: 'token' })
      expect(result.length).toBeGreaterThan(0)
      expect(result[0].text).toContain('INV-001')
    })
  })

  describe('mapDashboardStatsToKpis', () => {
    it('returns four KPI cards from stats', () => {
      const stats = { unmatchedTransactions: 5, unmatchedInvoices: 3, openAnomalies: 2, totalMatches: 20 }
      const kpis = mapDashboardStatsToKpis(stats)
      expect(kpis).toHaveLength(4)
      expect(kpis[0].title).toBe('Pending Matches')
      expect(kpis[0].value).toBe('5')
      expect(kpis[1].title).toBe('Pending Invoice Matches')
      expect(kpis[1].value).toBe('3')
      expect(kpis[2].title).toBe('Exceptions')
      expect(kpis[2].value).toBe('2')
      expect(kpis[3].title).toBe('Total Matches')
      expect(kpis[3].value).toBe('20')
    })

    it('handles null stats with fallback to 0', () => {
      const kpis = mapDashboardStatsToKpis(null)
      kpis.forEach(kpi => expect(kpi.value).toBe('0'))
    })
  })
})
