import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAdminAuditLogs,
  getAdminLogs,
  getAdminStats,
  getAdminUsers,
  toggleAdminUserActive,
} from '../../services/admin'
import { adminKeys } from '../../queries/queryKeys'

export function useAdminStatsQuery({ token, enabled = true }) {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: () => getAdminStats(token),
    enabled: Boolean(token) && enabled,
  })
}

export function useAdminUsersQuery({ token, query, enabled = true }) {
  return useQuery({
    queryKey: adminKeys.users(query),
    queryFn: () => getAdminUsers(query, token),
    enabled: Boolean(token) && enabled,
  })
}

export function useAdminLogsQuery({ token, query, enabled = true }) {
  return useQuery({
    queryKey: adminKeys.logs(query),
    queryFn: () => getAdminLogs(query, token),
    enabled: Boolean(token) && enabled,
  })
}

export function useAdminAuditQuery({ token, query, enabled = true }) {
  return useQuery({
    queryKey: adminKeys.audit(query),
    queryFn: () => getAdminAuditLogs(query, token),
    enabled: Boolean(token) && enabled,
  })
}

export function useToggleAdminUserActiveMutation({ token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId }) => toggleAdminUserActive(userId, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.all })
    },
  })
}
