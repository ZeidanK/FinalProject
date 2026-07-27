import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockGetTransactionsByCompany = vi.fn()
const mockGetTransactionById = vi.fn()
const mockCreateTransactionsBulk = vi.fn()
const mockDeleteTransaction = vi.fn()
const mockBulkDeleteTransactions = vi.fn()
const mockPreviewExcel = vi.fn()

vi.mock('../../services/transactions', () => ({
  getTransactionsByCompany: (...args) => mockGetTransactionsByCompany(...args),
  getTransactionById: (...args) => mockGetTransactionById(...args),
  createTransactionsBulk: (...args) => mockCreateTransactionsBulk(...args),
  deleteTransaction: (...args) => mockDeleteTransaction(...args),
  bulkDeleteTransactions: (...args) => mockBulkDeleteTransactions(...args),
  previewExcel: (...args) => mockPreviewExcel(...args),
}))

import {
  useTransactionsByCompanyQuery,
  useTransactionDetailsQuery,
  useCreateTransactionsBulkMutation,
  useDeleteTransactionMutation,
  useBulkDeleteTransactionsMutation,
  usePreviewExcelMutation,
} from '../../hooks/queries/useTransactionsQueries'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useTransactionsByCompanyQuery', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns transactions on success', async () => {
    const txns = [{ id: 1, amount: 100 }]
    mockGetTransactionsByCompany.mockResolvedValue(txns)

    const { result } = renderHook(
      () => useTransactionsByCompanyQuery({ companyId: 1, token: 'tok', filters: { page: 1 } }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(txns)
    expect(mockGetTransactionsByCompany).toHaveBeenCalledWith(1, { page: 1 }, 'tok')
  })

  it('is not enabled when companyId is missing', () => {
    const { result } = renderHook(
      () => useTransactionsByCompanyQuery({ companyId: null, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useTransactionDetailsQuery', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns a single transaction', async () => {
    const txn = { id: 42, amount: 250 }
    mockGetTransactionById.mockResolvedValue(txn)

    const { result } = renderHook(
      () => useTransactionDetailsQuery({ transactionId: 42, token: 'tok', enabled: true }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(txn)
    expect(mockGetTransactionById).toHaveBeenCalledWith(42, 'tok')
  })

  it('is not enabled when transactionId is missing', () => {
    const { result } = renderHook(
      () => useTransactionDetailsQuery({ transactionId: null, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCreateTransactionsBulkMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls createTransactionsBulk with payload and token', async () => {
    mockCreateTransactionsBulk.mockResolvedValue([{ id: 1 }])

    const { result } = renderHook(
      () => useCreateTransactionsBulkMutation({ companyId: 1, filters: { page: 1 }, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync([{ amount: 100 }])

    expect(mockCreateTransactionsBulk).toHaveBeenCalledWith([{ amount: 100 }], 'tok')
    expect(data).toEqual([{ id: 1 }])
  })
})

describe('useDeleteTransactionMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls deleteTransaction with transactionId and token', async () => {
    mockDeleteTransaction.mockResolvedValue({ id: 10 })

    const { result } = renderHook(
      () => useDeleteTransactionMutation({ companyId: 1, filters: { page: 1 }, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync(10)

    expect(mockDeleteTransaction).toHaveBeenCalledWith(10, 'tok')
    expect(data).toEqual({ id: 10 })
  })
})

describe('useBulkDeleteTransactionsMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls bulkDeleteTransactions with ids and token', async () => {
    mockBulkDeleteTransactions.mockResolvedValue({ deletedCount: 3 })

    const { result } = renderHook(
      () => useBulkDeleteTransactionsMutation({ companyId: 1, filters: { page: 1 }, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync([1, 2, 3])

    expect(mockBulkDeleteTransactions).toHaveBeenCalledWith([1, 2, 3], 'tok')
    expect(data).toEqual({ deletedCount: 3 })
  })
})

describe('usePreviewExcelMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls previewExcel with file, companyId, and token', async () => {
    mockPreviewExcel.mockResolvedValue([{ amount: 100, description: 'Test' }])

    const { result } = renderHook(
      () => usePreviewExcelMutation({ token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const file = new File([''], 'data.xlsx')
    const data = await result.current.mutateAsync({ file, companyId: 5 })

    expect(mockPreviewExcel).toHaveBeenCalledWith(file, 5, 'tok')
    expect(data).toEqual([{ amount: 100, description: 'Test' }])
  })
})
