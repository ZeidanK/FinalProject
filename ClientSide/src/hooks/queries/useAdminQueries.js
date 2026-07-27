import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  clearAdminAuditLogs,
  clearAdminLogs,
  deleteAdminAuditLog,
  deleteAdminLog,
  getAdminAuditLogs,
  getAdminLogs,
  getAdminStats,
  getAdminUsers,
  toggleAdminUserBan,
} from '../../services/admin'
import { adminKeys } from '../../queries/queryKeys'

/**
 * Fetches admin statistics using React Query.
 *
 * @param {Object} params - Query parameters.
 * @param {string} params.token - Authentication token for admin requests.
 * @param {boolean} [params.enabled=true] - Whether the query should be enabled.
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query result for admin stats.
 */
export function useAdminStatsQuery({ token, enabled = true }) {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: () => getAdminStats(token),
    enabled: Boolean(token) && enabled,
  })
}

/**
 * Fetches admin users with an optional search query.
 *
 * @param {Object} params - Query parameters.
 * @param {string} params.token - Authentication token for admin requests.
 * @param {string} [params.query] - Optional search or filter query.
 * @param {boolean} [params.enabled=true] - Whether the query should be enabled.
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query result for admin users.
 */
export function useAdminUsersQuery({ token, query, enabled = true }) {
  return useQuery({
    queryKey: adminKeys.users(query),
    queryFn: () => getAdminUsers(query, token),
    enabled: Boolean(token) && enabled,
  })
}

/**
 * Fetches admin logs with an optional filter query.
 *
 * @param {Object} params - Query parameters.
 * @param {string} params.token - Authentication token for admin requests.
 * @param {string} [params.query] - Optional search or filter query.
 * @param {boolean} [params.enabled=true] - Whether the query should be enabled.
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query result for admin logs.
 */
export function useAdminLogsQuery({ token, query, enabled = true }) {
  return useQuery({
    queryKey: adminKeys.logs(query),
    queryFn: () => getAdminLogs(query, token),
    enabled: Boolean(token) && enabled,
  })
}

/**
 * Fetches admin audit records with an optional filter query.
 *
 * @param {Object} params - Query parameters.
 * @param {string} params.token - Authentication token for admin requests.
 * @param {string} [params.query] - Optional search or filter query.
 * @param {boolean} [params.enabled=true] - Whether the query should be enabled.
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query result for admin audit logs.
 */
export function useAdminAuditQuery({ token, query, enabled = true }) {
  return useQuery({
    queryKey: adminKeys.audit(query),
    queryFn: () => getAdminAuditLogs(query, token),
    enabled: Boolean(token) && enabled,
  })
}

/**
 * Toggles an admin user's ban state and invalidates cached admin queries.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string} params.token - Authentication token for admin requests.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result.
 */
export function useToggleAdminUserBanMutation({ token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId }) => toggleAdminUserBan(userId, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.all })
    },
  })
}

/**
 * Clears system logs and invalidates admin log caches.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string} params.token - Authentication token for admin requests.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result.
 */
export function useClearAdminLogsMutation({ token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => clearAdminLogs(token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'logs'] })
    },
  })
}

/**
 * Clears audit logs and invalidates admin audit caches.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string} params.token - Authentication token for admin requests.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result.
 */
export function useClearAdminAuditLogsMutation({ token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => clearAdminAuditLogs(token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'audit'] })
    },
  })
}

/**
 * Deletes a single system log and invalidates admin log caches.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string} params.token - Authentication token for admin requests.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result.
 */
export function useDeleteAdminLogMutation({ token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }) => deleteAdminLog(id, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'logs'] })
    },
  })
}

/**
 * Deletes a single audit log and invalidates admin audit caches.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string} params.token - Authentication token for admin requests.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result.
 */
export function useDeleteAdminAuditLogMutation({ token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }) => deleteAdminAuditLog(id, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'audit'] })
    },
  })
}
