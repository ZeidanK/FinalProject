import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getInvoicesByCompany,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  uploadInvoicePdf,
  downloadInvoicePdf,
  bulkDeleteInvoices,
  updateInvoiceStatus,
} from '../../services/invoices'

const originalFetch = globalThis.fetch

describe('invoices service', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('getInvoicesByCompany fetches and unwraps', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: [{ id: 1 }] }),
    })
    const result = await getInvoicesByCompany(1, {}, 'token')
    expect(result).toEqual([{ id: 1 }])
  })

  it('getInvoiceById fetches single invoice', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { id: 1 } }),
    })
    const result = await getInvoiceById(1, 'token')
    expect(result).toEqual({ id: 1 })
  })

  it('createInvoice sends POST', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { id: 1 } }),
    })
    const result = await createInvoice({ vendorName: 'Test' }, false, 'token')
    expect(result).toEqual({ id: 1 })
  })

  it('updateInvoice sends PUT', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { id: 1 } }),
    })
    const result = await updateInvoice(1, { vendorName: 'Updated' }, 'token')
    expect(result).toEqual({ id: 1 })
  })

  it('deleteInvoice sends DELETE', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: null }),
    })
    await expect(deleteInvoice(1, 'token')).resolves.toBeNull()
  })

  it('uploadInvoicePdf sends FormData', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { id: 1 } }),
    })
    const file = new File(['pdf content'], 'invoice.pdf', { type: 'application/pdf' })
    const result = await uploadInvoicePdf(file, 1, true, 'token')
    expect(result).toEqual({ id: 1 })
  })

  it('downloadInvoicePdf returns blob metadata', async () => {
    const blob = new Blob(['pdf data'])
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/pdf', 'content-disposition': 'filename="test.pdf"' }),
      blob: () => Promise.resolve(blob),
    })
    const result = await downloadInvoicePdf(1, 'token')
    expect(result.blob).toBe(blob)
    expect(result.fileName).toBe('test.pdf')
    expect(result.contentType).toBe('application/pdf')
  })

  it('bulkDeleteInvoices sends DELETE', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { deleted: 2 } }),
    })
    expect(await bulkDeleteInvoices([1, 2], 'token')).toEqual({ deleted: 2 })
  })

  it('updateInvoiceStatus sends PATCH', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { id: 1, status: 'verified' } }),
    })
    expect(await updateInvoiceStatus(1, 'verified', 'token')).toEqual({ id: 1, status: 'verified' })
  })
})
