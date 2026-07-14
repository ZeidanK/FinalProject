import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAnomaliesByCompany,
  getAnomalyById,
  getAnomalyStats,
  resolveAnomaly,
} from '../../services/anomalies'
import { anomalyKeys } from '../../queries/queryKeys'

function normalizeAnomalyItem(item) {
  if (!item || typeof item !== 'object') return item

  const relatedItems = Array.isArray(item.relatedItems) ? item.relatedItems : []
  const fallbackCount =
    (item.relatedInvoiceId ? 1 : 0) +
    (item.relatedTransactionId ? 1 : 0) +
    (item.relatedMatchId ? 1 : 0)

  return {
    ...item,
    relatedItems,
    relatedItemsCount: Number(item.relatedItemsCount ?? relatedItems.length ?? fallbackCount),
  }
}

/**
 * Fetches a paginated list of anomalies for a company with optional filters and search.
 *
 * @param {Object} params - Query parameters.
 * @param {string|number} params.companyId - Company identifier used to fetch anomalies.
 * @param {string} params.token - Authentication token for the request.
 * @param {Object} [params.filters] - Optional filter values (status, severity, type).
 * @param {number} [params.page=1] - Page number (1-based).
 * @param {number} [params.pageSize=50] - Items per page.
 * @param {string} [params.searchTerm] - Search title or description.
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query result for the anomaly list.
 */
export function useAnomaliesListQuery({ companyId, token, filters, page = 1, pageSize = 50, searchTerm }) {
  return useQuery({
    queryKey: anomalyKeys.list(companyId, { ...filters, page, pageSize, searchTerm }),
    queryFn: async () => {
      const data = await getAnomaliesByCompany(companyId, { ...filters, page, pageSize, searchTerm }, token)
      if (data && Array.isArray(data.items)) {
        return {
          items: data.items.map(normalizeAnomalyItem),
          totalCount: data.totalCount ?? 0,
          pageNumber: data.pageNumber ?? page,
          pageSize: data.pageSize ?? pageSize,
          totalPages: data.totalPages ?? 0,
        }
      }
      return { items: [], totalCount: 0, pageNumber: page, pageSize, totalPages: 0 }
    },
    enabled: Boolean(companyId) && Boolean(token),
  })
}

/**
 * Fetches anomaly statistics for a given company.
 *
 * @param {Object} params - Query parameters.
 * @param {string|number} params.companyId - Company identifier used to fetch stats.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query result for anomaly stats.
 */
export function useAnomalyStatsQuery({ companyId, token }) {
  return useQuery({
    queryKey: anomalyKeys.stats(companyId),
    queryFn: () => getAnomalyStats(companyId, token),
    enabled: Boolean(companyId) && Boolean(token),
  })
}

/**
 * Fetches details for a specific anomaly.
 *
 * @param {Object} params - Query parameters.
 * @param {string|number} params.anomalyId - Anomaly identifier.
 * @param {string} params.token - Authentication token for the request.
 * @param {boolean} [params.enabled=true] - Whether the query should be active.
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query result for anomaly details.
 */
export function useAnomalyDetailsQuery({ anomalyId, token, enabled = true }) {
  return useQuery({
    queryKey: anomalyKeys.detail(anomalyId),
    queryFn: async () => {
      const data = await getAnomalyById(anomalyId, token)
      return normalizeAnomalyItem(data)
    },
    enabled: Boolean(anomalyId) && Boolean(token) && enabled,
  })
}

/**
 * Resolves an anomaly and invalidates related query caches.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string|number} params.companyId - Company identifier for cache invalidation.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result.
 */
export function useResolveAnomalyMutation({ companyId, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ anomalyId, payload }) => resolveAnomaly(anomalyId, payload, token),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: anomalyKeys.byCompany(companyId) }),
        queryClient.invalidateQueries({ queryKey: anomalyKeys.detail(variables.anomalyId) }),
      ])
    },
  })
}
