import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockGetAnomaliesByCompany = vi.fn()
const mockGetAnomalyStats = vi.fn()
const mockGetAnomalyById = vi.fn()
const mockResolveAnomaly = vi.fn()

vi.mock('../../services/anomalies', () => ({
  getAnomaliesByCompany: (...args) => mockGetAnomaliesByCompany(...args),
  getAnomalyStats: (...args) => mockGetAnomalyStats(...args),
  getAnomalyById: (...args) => mockGetAnomalyById(...args),
  resolveAnomaly: (...args) => mockResolveAnomaly(...args),
}))

import {
  useAnomaliesListQuery,
  useAnomalyStatsQuery,
  useAnomalyDetailsQuery,
  useResolveAnomalyMutation,
} from '../../hooks/queries/useAnomaliesQueries'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useAnomaliesListQuery', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns normalized anomalies on success', async () => {
    const anomaly = {
      id: 1,
      relatedInvoiceId: 10,
      relatedItems: [],
    }
    mockGetAnomaliesByCompany.mockResolvedValue({ items: [anomaly], totalCount: 1, pageNumber: 1, pageSize: 50, totalPages: 1 })

    const { result } = renderHook(
      () => useAnomaliesListQuery({ companyId: 1, token: 'tok', filters: { status: 'open' } }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({
      items: [{ ...anomaly, relatedItems: [], relatedItemsCount: 0 }],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 50,
      totalPages: 1,
    })
    expect(mockGetAnomaliesByCompany).toHaveBeenCalledWith(
      1,
      { status: 'open', page: 1, pageSize: 50, searchTerm: undefined },
      'tok',
    )
  })

  it('returns empty page when data is not paged', async () => {
    mockGetAnomaliesByCompany.mockResolvedValue(null)

    const { result } = renderHook(
      () => useAnomaliesListQuery({ companyId: 1, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({
      items: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 50,
      totalPages: 0,
    })
  })

  it('is not enabled when companyId is missing', () => {
    const { result } = renderHook(
      () => useAnomaliesListQuery({ companyId: null, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useAnomalyStatsQuery', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns anomaly stats', async () => {
    mockGetAnomalyStats.mockResolvedValue({ total: 5, resolved: 2 })

    const { result } = renderHook(
      () => useAnomalyStatsQuery({ companyId: 1, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ total: 5, resolved: 2 })
    expect(mockGetAnomalyStats).toHaveBeenCalledWith(1, 'tok')
  })
})

describe('useAnomalyDetailsQuery', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns normalized anomaly detail', async () => {
    const detail = { id: 5, title: 'Test', relatedItems: [{ id: 1 }] }
    mockGetAnomalyById.mockResolvedValue(detail)

    const { result } = renderHook(
      () => useAnomalyDetailsQuery({ anomalyId: 5, token: 'tok', enabled: true }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({
      ...detail,
      relatedItems: [{ id: 1 }],
      relatedItemsCount: 1,
    })
    expect(mockGetAnomalyById).toHaveBeenCalledWith(5, 'tok')
  })

  it('is not enabled when anomalyId is missing', () => {
    const { result } = renderHook(
      () => useAnomalyDetailsQuery({ anomalyId: null, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useResolveAnomalyMutation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls resolveAnomaly with anomalyId, payload, and token', async () => {
    mockResolveAnomaly.mockResolvedValue({ id: 5, resolved: true })

    const { result } = renderHook(
      () => useResolveAnomalyMutation({ companyId: 1, token: 'tok' }),
      { wrapper: createWrapper() }
    )

    const data = await result.current.mutateAsync({
      anomalyId: 5,
      payload: { resolution: 'fixed' },
    })

    expect(mockResolveAnomaly).toHaveBeenCalledWith(5, { resolution: 'fixed' }, 'tok')
    expect(data).toEqual({ id: 5, resolved: true })
  })
})
