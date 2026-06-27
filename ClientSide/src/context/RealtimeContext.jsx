import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { RealtimeContext } from './RealtimeContextProvider'
import { useAuth } from './useAuth'
import { useCompany } from './useCompany'
import { useNotification } from './useNotification'
import { createRealtimeClient } from '../services/realtime'

/**
 * Provides realtime SignalR connection and event subscription helpers.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components.
 * @returns {JSX.Element} Realtime context provider.
 */
export function RealtimeProvider({ children }) {
  const { token, isAuthenticated } = useAuth()
  const { activeCompanyId } = useCompany()
  const { notify } = useNotification()
  const [connectionState, setConnectionState] = useState('disconnected')
  const [isConnected, setIsConnected] = useState(false)

  const clientRef = useRef(null)
  const activeCompanyRef = useRef(null)
  const subscribersRef = useRef(new Map())

  const emit = useCallback((eventName, payload) => {
    const handlers = subscribersRef.current.get(eventName)
    if (!handlers || handlers.size === 0) return

    handlers.forEach((handler) => {
      try {
        handler(payload)
      } catch {
        // Keep realtime stream alive even if one subscriber throws.
      }
    })
  }, [])

  const subscribe = useCallback((eventName, handler) => {
    if (!eventName || typeof handler !== 'function') return () => {}

    const current = subscribersRef.current.get(eventName) || new Set()
    current.add(handler)
    subscribersRef.current.set(eventName, current)

    return () => {
      const handlers = subscribersRef.current.get(eventName)
      if (!handlers) return
      handlers.delete(handler)
      if (handlers.size === 0) {
        subscribersRef.current.delete(eventName)
      }
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !token) {
      activeCompanyRef.current = null
      return
    }

    let disposed = false
    let retryTimer = null
    let retryAttempt = 0
    const client = createRealtimeClient(token)
    clientRef.current = client

    client.onStateChange((state) => {
      if (disposed) return
      if (state === 'reconnecting' || state === 'disconnected') {
        activeCompanyRef.current = null
      }
      setConnectionState(state)
      setIsConnected(state === 'connected')
    })

    const onUploadJobUpdated = (payload) => {
      emit('uploadJobUpdated', payload)
    }

    const onNotificationEvent = (payload) => {
      emit('notificationEvent', payload)
    }
    const onNotificationCreated = (payload) => {
      emit('notificationCreated', payload)
      notify({
        eventId: payload?.eventId || payload?.EventId,
        message: payload?.title || payload?.Title || 'You have a new notification.',
        severity: payload?.severity || payload?.Severity || 'info',
      })
    }
    const onNotificationReadStateChanged = (payload) => {
      emit('notificationReadStateChanged', payload)
    }
    client.on('uploadJobUpdated', onUploadJobUpdated)
    client.on('notificationEvent', onNotificationEvent)
    client.on('notificationCreated', onNotificationCreated)
    client.on('notificationReadStateChanged', onNotificationReadStateChanged)

    const connect = async () => {
      try {
        await client.start()
        if (disposed) return
        retryAttempt = 0
      } catch {
        if (!disposed) {
          setConnectionState('disconnected')
          setIsConnected(false)
          const delay = Math.min(30_000, 1_000 * (2 ** retryAttempt))
          retryAttempt += 1
          retryTimer = globalThis.setTimeout(connect, delay)
        }
      }
    }

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

      if (clientRef.current === client) {
        clientRef.current = null
      }
    }
  }, [emit, isAuthenticated, notify, token])

  useEffect(() => {
    const client = clientRef.current
    if (!client || !isConnected) return

    const nextCompanyId = Number(activeCompanyId) || null
    const currentCompanyId = activeCompanyRef.current
    if (nextCompanyId === currentCompanyId) return

    const syncGroups = async () => {
      if (currentCompanyId) {
        await client.leaveCompany(currentCompanyId)
      }
      if (nextCompanyId) {
        await client.joinCompany(nextCompanyId)
      }

      activeCompanyRef.current = nextCompanyId
    }

    syncGroups().catch(() => {})
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
