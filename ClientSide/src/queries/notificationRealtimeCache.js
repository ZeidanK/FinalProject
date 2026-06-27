import { notificationKeys } from './queryKeys'

const normalizeNotification = (raw = {}) => ({
  ...raw,
  id: raw.id ?? raw.Id,
  eventId: raw.eventId ?? raw.EventId,
  eventType: raw.eventType ?? raw.EventType,
  scope: String(raw.scope ?? raw.Scope ?? 'personal').toLowerCase(),
  title: raw.title ?? raw.Title ?? '',
  body: raw.body ?? raw.Body ?? '',
  severity: raw.severity ?? raw.Severity ?? 'info',
  isRead: Boolean(raw.isRead ?? raw.IsRead ?? false),
  companyId: raw.companyId ?? raw.CompanyId ?? raw.targetCompanyId ?? raw.TargetCompanyId ?? null,
  companyName: raw.companyName ?? raw.CompanyName ?? null,
  link: raw.link ?? raw.Link ?? null,
  targetType: raw.targetType ?? raw.TargetType ?? null,
  targetId: raw.targetId ?? raw.TargetId ?? null,
  createdAt: raw.createdAt ?? raw.CreatedAt ?? new Date().toISOString(),
  readAt: raw.readAt ?? raw.ReadAt ?? null,
})

const isSameNotification = (left, right) => {
  const leftEventId = left?.eventId ?? left?.EventId
  const rightEventId = right?.eventId ?? right?.EventId
  if (leftEventId && rightEventId) return String(leftEventId) === String(rightEventId)
  return String(left?.id ?? left?.Id) === String(right?.id ?? right?.Id)
}

const matchesView = (notification, view, companyId) => {
  if (view === 'combined') return true
  if (view === 'personal') return notification.scope === 'personal'
  return view === 'company'
    && notification.scope === 'company'
    && Number(notification.companyId) === Number(companyId)
}

const incrementCounts = (counts, notification, view, companyId) => {
  if (notification.isRead) return counts || {}

  const next = { ...(counts || {}) }
  if (notification.scope === 'personal') {
    next.personalUnread = Number(next.personalUnread || 0) + 1
  }
  if (
    notification.scope === 'company'
    && companyId
    && Number(notification.companyId) === Number(companyId)
  ) {
    next.companyUnread = Number(next.companyUnread || 0) + 1
  }
  if (matchesView(notification, view, companyId)) {
    next.visibleUnread = Number(next.visibleUnread || 0) + 1
  }
  return next
}

/**
 * Insert a server-persisted notification into every matching cached inbox.
 * The helper is idempotent by event ID (falling back to notification ID).
 */
export const applyNotificationCreatedToCache = (queryClient, userId, rawNotification) => {
  if (!queryClient || !userId || !rawNotification) return
  const notification = normalizeNotification(rawNotification)
  const eventKey = String(notification.eventId || notification.id)

  queryClient
    .getQueriesData({ queryKey: notificationKeys.user(userId) })
    .forEach(([queryKey, data]) => {
      if (queryKey?.[3] !== 'inbox' || !data?.pages?.length) return

      if ((data.realtimeEventIds || []).includes(eventKey)) return
      const alreadyPresent = data.pages.some((page) =>
        (page.items || []).some((item) => isSameNotification(item, notification)))
      if (alreadyPresent) return

      const view = queryKey[4]
      const companyId = queryKey[5]
      const belongsInList = matchesView(notification, view, companyId)

      queryClient.setQueryData(queryKey, {
        ...data,
        realtimeEventIds: [eventKey, ...(data.realtimeEventIds || [])].slice(0, 100),
        pages: data.pages.map((page, index) => {
          if (index !== 0) return page
          return {
            ...page,
            items: belongsInList
              ? [notification, ...(page.items || [])]
              : (page.items || []),
            counts: incrementCounts(page.counts, notification, view, companyId),
          }
        }),
      })
    })
}
