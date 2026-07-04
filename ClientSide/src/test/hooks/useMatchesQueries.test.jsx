import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockGetMatchesByCompany = vi.fn()
const mockGetInvoicesByCompany = vi.fn()
const mockGetTransactionsByCompany = vi.fn()
const mockGetMatchSuggestions = vi.fn()
const mockCreateMatch = vi.fn()
const mockDeleteMatch = vi.fn()
const mockGetSimpleSuggestions = vi.fn()
const mockGetInstallmentSuggestions = vi.fn()
const mockAutoMatchBatch = vi.fn()

vi.mock('../../services/matches', () => ({
  getMatchesByCompany: (...args) => mockGetMatchesByCompany(...args),
  getMatchSuggestions: (...args) => mockGetMatchSuggestions(...args),
  createMatch: (...args) => mockCreateMatch(...args),
  deleteMatch: (...args) => mockDeleteMatch(...args),
  getSimpleSuggestions: (...args) => mockGetSimpleSuggestions(...args),
  getInstallmentSuggestions: (...args) => mockGetInstallmentSuggestions(...args),
  autoMatchOnLoad: (...args) => mockAutoMatchBatch(...args),
}))

vi.mock('../../services/invoices', () => ({
  getInvoicesByCompany: (...args) => mockGetInvoicesByCompany(...args),
}))

vi.mock('../../services/transactions', () => ({
  getTransactionsByCompany: (...args) => mockGetTransactionsByCompany(...args),
}))

import {
  useMatchesByCompanyQuery,
  useUnmatchedInvoicesQuery,
  useUnmatchedTransactionsQuery,
  useMatchSuggestionsQuery,
  useCreateMatchMutation,
  useDeleteMatchMutation,
  useSimpleSuggestionsQuery,
  useInstallmentSuggestionsQuery,
  useAutoMatchOnLoadMutation,
} from '../../hooks/queries/useMatchesQueries'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useMatchesByCompanyQuery', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns matches on success', async () => {
    const matches = [{ id: 1, invoiceId: 10, transactionId: 20 }]
    mockGetMatchesByCompany.mockResolvedValue(matches)

    const { result } = renderHook(
      () => useMatchesByCompanyQuery({ companyId: 1, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(matches)
    expect(mockGetMatchesByCompany).toHaveBeenCalledWith(1, 'tok')
  })
})

describe('useUnmatchedInvoicesQuery', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('fetches unmatched invoices', async () => {
    const invoices = [{ id: 1, isMatched: false }]
    mockGetInvoicesByCompany.mockResolvedValue(invoices)

    const { result } = renderHook(
      () => useUnmatchedInvoicesQuery({ companyId: 1, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(invoices)
    expect(mockGetInvoicesByCompany).toHaveBeenCalledWith(1, { isMatched: false }, 'tok')
  })
})

describe('useUnmatchedTransactionsQuery', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('fetches unmatched transactions', async () => {
    const transactions = [{ id: 1, isMatched: false }]
    mockGetTransactionsByCompany.mockResolvedValue(transactions)

    const { result } = renderHook(
      () => useUnmatchedTransactionsQuery({ companyId: 1, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(transactions)
    expect(mockGetTransactionsByCompany).toHaveBeenCalledWith(1, { isMatched: false }, 'tok')
  })
})

describe('useMatchSuggestionsQuery', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns match suggestions for an invoice', async () => {
    const suggestions = [{ id: 10, confidence: 0.95 }]
    mockGetMatchSuggestions.mockResolvedValue(suggestions)

    const { result } = renderHook(
      () => useMatchSuggestionsQuery({ invoiceId: 5, token: 'tok', enabled: true }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(suggestions)
    expect(mockGetMatchSuggestions).toHaveBeenCalledWith(5, 'tok')
  })

  it('is not enabled when invoiceId is missing', () => {
    const { result } = renderHook(
      () => useMatchSuggestionsQuery({ invoiceId: null, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCreateMatchMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls createMatch with payload and token', async () => {
    mockCreateMatch.mockResolvedValue({ id: 1 })

    const { result } = renderHook(
      () => useCreateMatchMutation({ companyId: 1, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync({ invoiceId: 10, transactionId: 20 })

    expect(mockCreateMatch).toHaveBeenCalledWith({ invoiceId: 10, transactionId: 20 }, 'tok')
    expect(data).toEqual({ id: 1 })
  })
})

describe('useDeleteMatchMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls deleteMatch with matchId and token', async () => {
    mockDeleteMatch.mockResolvedValue({ id: 1 })

    const { result } = renderHook(
      () => useDeleteMatchMutation({ companyId: 1, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync(1)

    expect(mockDeleteMatch).toHaveBeenCalledWith(1, 'tok')
    expect(data).toEqual({ id: 1 })
  })
})

describe('useSimpleSuggestionsQuery', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns simple suggestions', async () => {
    const suggestions = [{ id: 1, type: 'simple' }]
    mockGetSimpleSuggestions.mockResolvedValue(suggestions)

    const { result } = renderHook(
      () => useSimpleSuggestionsQuery({ companyId: 1, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(suggestions)
    expect(mockGetSimpleSuggestions).toHaveBeenCalledWith(1, 'tok')
  })
})

describe('useInstallmentSuggestionsQuery', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns installment suggestions', async () => {
    const suggestions = [{ id: 2, type: 'installment' }]
    mockGetInstallmentSuggestions.mockResolvedValue(suggestions)

    const { result } = renderHook(
      () => useInstallmentSuggestionsQuery({ companyId: 1, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(suggestions)
    expect(mockGetInstallmentSuggestions).toHaveBeenCalledWith(1, 'tok')
  })
})

describe('useAutoMatchOnLoadMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls autoMatchOnLoad with companyId, minConfidence, and token', async () => {
    mockAutoMatchBatch.mockResolvedValue({ matched: 5 })

    const { result } = renderHook(
      () => useAutoMatchOnLoadMutation({ companyId: 1, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync({ minConfidence: 0.8 })

    expect(mockAutoMatchBatch).toHaveBeenCalledWith(1, 0.8, 'tok')
    expect(data).toEqual({ matched: 5 })
  })
})
