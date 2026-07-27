import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getUploadJobStatus,
  getMyUploadJobs,
  deleteUploadJob,
  deleteUploadJobsByCompany,
  markUploadJobVerified,
  verifyInvoiceUploadJob,
  verifyInvoiceUploadJobs,
  downloadUploadJobPdf,
} from '../../services/uploadJobs'

const originalFetch = globalThis.fetch

describe('uploadJobs service', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  const mockJsonResponse = (data) => ({
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve({ success: true, data }),
  })

  it('getUploadJobStatus fetches job by id', async () => {
    globalThis.fetch.mockResolvedValueOnce(mockJsonResponse({ id: 1, status: 'completed' }))
    const result = await getUploadJobStatus(1, 'token')
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ id: 1, status: 'completed' })
    const callUrl = globalThis.fetch.mock.calls[0][0]
    expect(callUrl).toContain('/UploadJobs/1')
  })

  it('getMyUploadJobs fetches with default options', async () => {
    globalThis.fetch.mockResolvedValueOnce(mockJsonResponse([]))
    const result = await getMyUploadJobs('token')
    expect(result.success).toBe(true)
    expect(result.data).toEqual([])
    const callUrl = globalThis.fetch.mock.calls[0][0]
    expect(callUrl).toContain('/UploadJobs/mine')
  })

  it('getMyUploadJobs passes query params', async () => {
    globalThis.fetch.mockResolvedValueOnce(mockJsonResponse([]))
    await getMyUploadJobs('token', { companyId: 5, status: 'pending', take: 10 })
    const callUrl = globalThis.fetch.mock.calls[0][0]
    expect(callUrl).toContain('/UploadJobs/mine')
    expect(callUrl).toContain('companyId=5')
    expect(callUrl).toContain('status=pending')
    expect(callUrl).toContain('take=10')
  })

  it('deleteUploadJob sends DELETE', async () => {
    globalThis.fetch.mockResolvedValueOnce(mockJsonResponse(null))
    await deleteUploadJob(3, 'token')
    expect(globalThis.fetch.mock.calls[0][1].method).toBe('DELETE')
    expect(globalThis.fetch.mock.calls[0][0]).toContain('/UploadJobs/3')
  })

  it('deleteUploadJobsByCompany sends DELETE with query', async () => {
    globalThis.fetch.mockResolvedValueOnce(mockJsonResponse(null))
    await deleteUploadJobsByCompany(5, 'token', 'invoice')
    expect(globalThis.fetch.mock.calls[0][1].method).toBe('DELETE')
    expect(globalThis.fetch.mock.calls[0][0]).toContain('/UploadJobs/company/5')
    expect(globalThis.fetch.mock.calls[0][0]).toContain('jobType=invoice')
  })

  it('markUploadJobVerified sends PATCH', async () => {
    globalThis.fetch.mockResolvedValueOnce(mockJsonResponse({ status: 'verified' }))
    const result = await markUploadJobVerified(2, 'token')
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ status: 'verified' })
    expect(globalThis.fetch.mock.calls[0][1].method).toBe('PATCH')
    expect(globalThis.fetch.mock.calls[0][0]).toContain('/UploadJobs/2/verified')
  })

  it('verifyInvoiceUploadJob sends POST with invoice body', async () => {
    globalThis.fetch.mockResolvedValueOnce(mockJsonResponse({ ok: true }))
    const invoice = { vendorName: 'Acme', totalAmount: 100 }
    await verifyInvoiceUploadJob(1, invoice, 'token')
    expect(globalThis.fetch.mock.calls[0][1].method).toBe('POST')
    expect(globalThis.fetch.mock.calls[0][0]).toContain('/UploadJobs/1/verify-invoice')
    expect(globalThis.fetch.mock.calls[0][1].body).toBe(JSON.stringify(invoice))
  })

  it('verifyInvoiceUploadJobs sends POST with jobIds body', async () => {
    globalThis.fetch.mockResolvedValueOnce(mockJsonResponse({ results: [] }))
    await verifyInvoiceUploadJobs([1, 2, 3], 'token')
    expect(globalThis.fetch.mock.calls[0][1].method).toBe('POST')
    expect(globalThis.fetch.mock.calls[0][0]).toContain('/UploadJobs/verify-invoices')
    expect(JSON.parse(globalThis.fetch.mock.calls[0][1].body)).toEqual({ jobIds: [1, 2, 3] })
  })

  describe('downloadUploadJobPdf', () => {
    const createBlobResponse = (contentDisposition) => ({
      ok: true,
      headers: new Headers({
        'content-type': 'application/pdf',
        ...(contentDisposition ? { 'content-disposition': contentDisposition } : {}),
      }),
      blob: () => Promise.resolve(new Blob(['pdf content'], { type: 'application/pdf' })),
    })

    it('downloads PDF and returns blob with parsed filename', async () => {
      globalThis.fetch.mockResolvedValueOnce(createBlobResponse('filename="report.pdf"'))
      const result = await downloadUploadJobPdf(1, 'token')
      expect(result.blob).toBeInstanceOf(Blob)
      expect(result.fileName).toBe('report.pdf')
      expect(result.contentType).toBe('application/pdf')
    })

    it('handles UTF-8 encoded filename', async () => {
      globalThis.fetch.mockResolvedValueOnce(createBlobResponse("filename*=UTF-8''invoice%20statement.pdf"))
      const result = await downloadUploadJobPdf(2, 'token')
      expect(result.fileName).toBe('invoice statement.pdf')
    })

    it('falls back to invoice.pdf when no content-disposition', async () => {
      globalThis.fetch.mockResolvedValueOnce(createBlobResponse(null))
      const result = await downloadUploadJobPdf(3, 'token')
      expect(result.fileName).toBe('invoice.pdf')
    })

    it('throws on non-ok response', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ message: 'Not found' }),
      })
      const err = await downloadUploadJobPdf(99, 'token').catch(e => e)
      expect(err.message).toBe('Not found')
      expect(err.status).toBe(404)
    })

    it('uses fallback message when response body is not JSON', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'text/plain' }),
        json: () => Promise.reject(new Error('not json')),
      })
      const err = await downloadUploadJobPdf(99, 'token').catch(e => e)
      expect(err.message).toContain('500')
    })

    it('sends Authorization header with token', async () => {
      globalThis.fetch.mockResolvedValueOnce(createBlobResponse(null))
      await downloadUploadJobPdf(1, 'my-token')
      expect(globalThis.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer my-token')
    })
  })
})
