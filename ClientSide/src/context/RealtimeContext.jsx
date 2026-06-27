import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useQueryClient } from '@tanstack/react-query'
import { RealtimeContext } from './RealtimeContextProvider'
import { useAuth } from './useAuth'
import { useCompany } from './useCompany'
import { useNotification } from './useNotification'
import { createRealtimeClient } from '../services/realtime'
import { notificationKeys } from '../queries/queryKeys'
import { applyNotificationCreatedToCache } from '../queries/notificationRealtimeCache'

/** Provides the authenticated SignalR connection and live event subscriptions. */
export function RealtimeProvider({ children }) {
  const queryClient = useQueryClient()
  const { token, isAuthenticated, user } = useAuth()
  const { activeCompanyId } = useCompany()
  const { notify } = useNotification()
  const [connectionState, setConnectionState] = useState('disconnected')
  const [isConnected, setIsConnected] = useState(false)

  const clientRef = useRef(null)
  const activeCompanyRef = useRef(null)
  const subscribersRef = useRef(new Map())
  const seenNotificationEventsRef = useRef(new Set())

  const emit = useCallback((eventName, payload) => {
    const handlers = subscribersRef.current.get(eventName)
    if (!handlers?.size) return

    handlers.forEach((handler) => {
      try {
        handler(payload)
      } catch {
        // One page subscriber must not interrupt the shared realtime stream.
      }
    })
  }, [])

  const subscribe = useCallback((eventName, handler) => {
    if (!eventName || typeof handler !== 'function') return () => {}

    const handlers = subscribersRef.current.get(eventName) || new Set()
    handlers.add(handler)
    subscribersRef.current.set(eventName, handlers)

    return () => {
      const current = subscribersRef.current.get(eventName)
      if (!current) return
      current.delete(handler)
      if (current.size === 0) subscribersRef.current.delete(eventName)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !token || !user?.id) {
      activeCompanyRef.current = null
      return
    }

    let disposed = false
    let retryTimer = null
    let retryAttempt = 0
    let hasConnected = false
    const client = createRealtimeClient(token)
    clientRef.current = client

    const reconcileNotifications = () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.user(user.id) })
    }

    const scheduleRetry = (connect) => {
      if (disposed || retryTimer) return
      const delay = Math.min(30_000, 1_000 * (2 ** retryAttempt))
      retryAttempt += 1
      retryTimer = globalThis.setTimeout(() => {
        retryTimer = null
        connect()
      }, delay)
    }

    const connect = async () => {
      try {
        await client.start()
      } catch {
        scheduleRetry(connect)
      }
    }

    client.onStateChange((state, meta = {}) => {
      if (disposed) return

      if (state === 'reconnecting' || state === 'disconnected') {
        activeCompanyRef.current = null
      }
      setConnectionState(state)
      setIsConnected(state === 'connected')

      if (state === 'connected') {
        retryAttempt = 0
        if (retryTimer) {
          globalThis.clearTimeout(retryTimer)
          retryTimer = null
        }
        // Initial reconciliation is cheap; after reconnect it recovers missed events.
        reconcileNotifications()
        hasConnected = true
      } else if (state === 'disconnected' && !meta.stopped && (meta.startFailed || meta.closed || hasConnected)) {
        scheduleRetry(connect)
      }
    })

    const onUploadJobUpdated = (payload) => emit('uploadJobUpdated', payload)
    const onNotificationEvent = (payload) => emit('notificationEvent', payload)
    const onNotificationCreated = (payload) => {
      const eventKey = String(payload?.eventId || payload?.EventId || payload?.id || payload?.Id || '')
      if (eventKey && seenNotificationEventsRef.current.has(eventKey)) return
      if (eventKey) {
        seenNotificationEventsRef.current.add(eventKey)
        if (seenNotificationEventsRef.current.size > 500) {
          const oldest = seenNotificationEventsRef.current.values().next().value
          seenNotificationEventsRef.current.delete(oldest)
        }
      }
      applyNotificationCreatedToCache(queryClient, user.id, payload)
      emit('notificationCreated', payload)
      notify({
        eventId: payload?.eventId || payload?.EventId,
        message: payload?.title || payload?.Title || 'You have a new notification.',
        severity: payload?.severity || payload?.Severity || 'info',
      })
      // Reconcile after the immediate local update; the row is already committed server-side.
      reconcileNotifications()
    }
    const onNotificationReadStateChanged = (payload) => {
      emit('notificationReadStateChanged', payload)
      reconcileNotifications()
    }

    client.on('uploadJobUpdated', onUploadJobUpdated)
    client.on('notificationEvent', onNotificationEvent)
    client.on('notificationCreated', onNotificationCreated)
    client.on('notificationReadStateChanged', onNotificationReadStateChanged)
    connect()

    return () => {
      disposed = true
      if (retryTimer) globalThis.clearTimeout(retryTimer)
      activeCompanyRef.current = null
      client.off('uploadJobUpdated', onUploadJobUpdated)
      client.off('notificationEvent', onNotificationEvent)
      client.off('notificationCreated', onNotificationCreated)
      client.off('notificationReadStateChanged', onNotificationReadStateChanged)
      client.stop().catch(() => {})
      if (clientRef.current === client) clientRef.current = null
    }
  }, [emit, isAuthenticated, notify, queryClient, token, user?.id])

  useEffect(() => {
    const client = clientRef.current
    if (!client || !isConnected) return

    const nextCompanyId = Number(activeCompanyId) || null
    const currentCompanyId = activeCompanyRef.current
    if (nextCompanyId === currentCompanyId) return

    const syncGroups = async () => {
      if (currentCompanyId) await client.leaveCompany(currentCompanyId)
      if (nextCompanyId) await client.joinCompany(nextCompanyId)
      activeCompanyRef.current = nextCompanyId
    }

    syncGroups().catch(() => {
      activeCompanyRef.current = null
    })
  }, [activeCompanyId, isConnected])

  const value = useMemo(() => ({
    connectionState: isAuthenticated ? connectionState : 'disconnected',
    isConnected: isAuthenticated && isConnected,
    subscribe,
  }), [connectionState, isAuthenticated, isConnected, subscribe])

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

RealtimeProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
