import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getTransactionsByCompany,
  getTransactionById,
  createTransaction,
  deleteTransaction,
  importExcelTransactions,
  previewExcel,
} from '../../services/transactions'

const originalFetch = globalThis.fetch

describe('transactions service', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('getTransactionsByCompany fetches with filters', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: [{ id: 1 }] }),
    })
    const result = await getTransactionsByCompany(1, { type: 'debit' }, 'token')
    expect(result).toEqual([{ id: 1 }])
  })

  it('getTransactionById fetches single', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { id: 1 } }),
    })
    const result = await getTransactionById(1, 'token')
    expect(result).toEqual({ id: 1 })
  })

  it('createTransaction sends POST', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { id: 1 } }),
    })
    const result = await createTransaction({ amount: 100 }, 'token')
    expect(result).toEqual({ id: 1 })
  })

  it('deleteTransaction sends DELETE', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: null }),
    })
    await expect(deleteTransaction(1, 'token')).resolves.toBeNull()
  })

  it('importExcelTransactions sends POST with FormData', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { count: 10 } }),
    })
    const formData = new FormData()
    const result = await importExcelTransactions(formData, 'token')
    expect(result).toEqual({ count: 10 })
  })

  it('previewExcel sends FormData', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: [{ row: 1 }] }),
    })
    const file = new File(['data'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const result = await previewExcel(file, 1, 'token')
    expect(result).toEqual([{ row: 1 }])
  })
})
