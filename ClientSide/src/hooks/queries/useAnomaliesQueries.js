import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAnomaliesByCompany,
  getAnomalyById,
  getAnomalyStats,
  resolveAnomaly,
} from '../../services/anomalies'
import { anomalyKeys } from '../../queries/queryKeys'

export function useAnomaliesListQuery({ companyId, token, filters }) {
  return useQuery({
    queryKey: anomalyKeys.list(companyId, filters),
    queryFn: () => getAnomaliesByCompany(companyId, filters, token),
    enabled: Boolean(companyId) && Boolean(token),
  })
}

export function useAnomalyStatsQuery({ companyId, token }) {
  return useQuery({
    queryKey: anomalyKeys.stats(companyId),
    queryFn: () => getAnomalyStats(companyId, token),
    enabled: Boolean(companyId) && Boolean(token),
  })
}

export function useAnomalyDetailsQuery({ anomalyId, token, enabled = true }) {
  return useQuery({
    queryKey: anomalyKeys.detail(anomalyId),
    queryFn: () => getAnomalyById(anomalyId, token),
    enabled: Boolean(anomalyId) && Boolean(token) && enabled,
  })
}

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
