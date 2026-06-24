import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notifications'
import { notificationKeys } from '../../queries/queryKeys'

/**
 * Fetches the current user's notifications.
 *
 * @param {object} params
 * @param {string} params.token - JWT bearer token.
 * @param {number} [params.take=50] - Max number of notifications.
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useNotificationsQuery({ token, take = 50 }) {
  return useQuery({
    queryKey: notificationKeys.mine(take),
    queryFn: () => getMyNotifications(token, take),
    enabled: Boolean(token),
    staleTime: 30_000,
  })
}

/**
 * Marks a single notification as read and invalidates the notifications cache.
 *
 * @param {object} params
 * @param {string} params.token - JWT bearer token.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useMarkNotificationReadMutation({ token }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => markNotificationRead(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

/**
 * Marks all notifications as read and invalidates the notifications cache.
 *
 * @param {object} params
 * @param {string} params.token - JWT bearer token.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useMarkAllNotificationsReadMutation({ token }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markAllNotificationsRead(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
