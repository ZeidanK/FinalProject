import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getNotificationInbox,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notifications'
import { notificationKeys } from '../../queries/queryKeys'

const updateNotificationPages = (data, updater) => {
  if (!data?.pages) return data
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: (page.items || []).map(updater),
    })),
  }
}

export function useNotificationsInboxQuery({
  token,
  userId,
  view,
  companyId,
  take = 25,
  isRealtimeConnected = true,
}) {
  return useInfiniteQuery({
    queryKey: notificationKeys.inbox(userId, view, companyId),
    queryFn: ({ pageParam }) => getNotificationInbox(token, {
      view,
      companyId,
      cursor: pageParam,
      take,
    }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,
    enabled: Boolean(token && userId && (view !== 'company' || companyId)),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchInterval: isRealtimeConnected ? false : 15_000,
    refetchIntervalInBackground: true,
  })
}

export function useMarkNotificationReadMutation({ token, userId, view, companyId }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => markNotificationRead(id, token, { view, companyId }),
    onMutate: async (id) => {
      const key = notificationKeys.user(userId)
      await queryClient.cancelQueries({ queryKey: key })
      const snapshots = queryClient.getQueriesData({ queryKey: key })
      snapshots.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, updateNotificationPages(data, (item) => (
          item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
        )))
      })
      return { snapshots }
    },
    onError: (_error, _id, context) => {
      context?.snapshots?.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.user(userId) }),
  })
}

export function useMarkAllNotificationsReadMutation({ token, userId, view, companyId }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markAllNotificationsRead(token, { view, companyId }),
    onMutate: async () => {
      const key = notificationKeys.inbox(userId, view, companyId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)
      queryClient.setQueryData(key, updateNotificationPages(previous, (item) => ({
        ...item,
        isRead: true,
        readAt: item.readAt || new Date().toISOString(),
      })))
      return { key, previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.key) queryClient.setQueryData(context.key, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.user(userId) }),
  })
}
