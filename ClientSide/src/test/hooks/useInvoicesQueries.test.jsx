import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockGetInvoicesByCompany = vi.fn()
const mockGetInvoiceById = vi.fn()
const mockUploadInvoicePdf = vi.fn()
const mockCreateInvoice = vi.fn()
const mockUpdateInvoice = vi.fn()
const mockDeleteInvoice = vi.fn()
const mockBulkDeleteInvoices = vi.fn()

vi.mock('../../services/invoices', () => ({
  getInvoicesByCompany: (...args) => mockGetInvoicesByCompany(...args),
  getInvoiceById: (...args) => mockGetInvoiceById(...args),
  uploadInvoicePdf: (...args) => mockUploadInvoicePdf(...args),
  createInvoice: (...args) => mockCreateInvoice(...args),
  updateInvoice: (...args) => mockUpdateInvoice(...args),
  deleteInvoice: (...args) => mockDeleteInvoice(...args),
  bulkDeleteInvoices: (...args) => mockBulkDeleteInvoices(...args),
}))

import {
  useInvoicesByCompanyQuery,
  useInvoiceByIdQuery,
  useUploadInvoicePdfMutation,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useBulkDeleteInvoicesMutation,
} from '../../hooks/queries/useInvoicesQueries'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useInvoicesByCompanyQuery', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns invoices on success', async () => {
    const invoices = [{ id: 1, number: 'INV-001' }]
    mockGetInvoicesByCompany.mockResolvedValue(invoices)

    const { result } = renderHook(
      () => useInvoicesByCompanyQuery({ companyId: 1, token: 'tok', filters: { page: 1 } }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(invoices)
    expect(mockGetInvoicesByCompany).toHaveBeenCalledWith(1, { page: 1 }, 'tok')
  })

  it('is not enabled when companyId is missing', () => {
    const { result } = renderHook(
      () => useInvoicesByCompanyQuery({ companyId: null, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useInvoiceByIdQuery', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns a single invoice', async () => {
    const invoice = { id: 42, number: 'INV-042' }
    mockGetInvoiceById.mockResolvedValue(invoice)

    const { result } = renderHook(
      () => useInvoiceByIdQuery({ invoiceId: 42, token: 'tok', enabled: true }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(invoice)
    expect(mockGetInvoiceById).toHaveBeenCalledWith(42, 'tok')
  })

  it('is not enabled when invoiceId is missing', () => {
    const { result } = renderHook(
      () => useInvoiceByIdQuery({ invoiceId: null, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useUploadInvoicePdfMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls uploadInvoicePdf with file, companyId, autoVerify, provider, and token', async () => {
    mockUploadInvoicePdf.mockResolvedValue({ id: 1, url: 'http://example.com/invoice.pdf' })

    const { result } = renderHook(
      () => useUploadInvoicePdfMutation({ token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync({
      file: new File([''], 'invoice.pdf'),
      companyId: 5,
      autoVerify: true,
      extractionProvider: 'localmodel',
    })

    expect(mockUploadInvoicePdf).toHaveBeenCalledWith(
      expect.any(File),
      5,
      true,
      'localmodel',
      'tok'
    )
    expect(data).toEqual({ id: 1, url: 'http://example.com/invoice.pdf' })
  })
})

describe('useCreateInvoiceMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls createInvoice with payload, autoMatch, and token', async () => {
    mockCreateInvoice.mockResolvedValue({ id: 10 })

    const { result } = renderHook(
      () => useCreateInvoiceMutation({ companyId: 1, filters: { page: 1 }, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync({
      payload: { amount: 100 },
      autoMatch: true,
    })

    expect(mockCreateInvoice).toHaveBeenCalledWith({ amount: 100 }, true, 'tok')
    expect(data).toEqual({ id: 10 })
  })
})

describe('useUpdateInvoiceMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls updateInvoice with invoiceId, payload, and token', async () => {
    mockUpdateInvoice.mockResolvedValue({ id: 10, amount: 200 })

    const { result } = renderHook(
      () => useUpdateInvoiceMutation({ companyId: 1, filters: { page: 1 }, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync({
      invoiceId: 10,
      payload: { amount: 200 },
    })

    expect(mockUpdateInvoice).toHaveBeenCalledWith(10, { amount: 200 }, 'tok')
    expect(data).toEqual({ id: 10, amount: 200 })
  })
})

describe('useDeleteInvoiceMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls deleteInvoice with invoiceId and token', async () => {
    mockDeleteInvoice.mockResolvedValue({ id: 10 })

    const { result } = renderHook(
      () => useDeleteInvoiceMutation({ companyId: 1, filters: { page: 1 }, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync(10)

    expect(mockDeleteInvoice).toHaveBeenCalledWith(10, 'tok')
    expect(data).toEqual({ id: 10 })
  })
})

describe('useBulkDeleteInvoicesMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls bulkDeleteInvoices with ids and token', async () => {
    mockBulkDeleteInvoices.mockResolvedValue({ deletedCount: 3 })

    const { result } = renderHook(
      () => useBulkDeleteInvoicesMutation({ companyId: 1, filters: { page: 1 }, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync([1, 2, 3])

    expect(mockBulkDeleteInvoices).toHaveBeenCalledWith([1, 2, 3], 'tok')
    expect(data).toEqual({ deletedCount: 3 })
  })
})
