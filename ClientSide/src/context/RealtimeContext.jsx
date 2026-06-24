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

  const notifyFromRealtimeEvent = useCallback((eventEnvelope) => {
    const eventType = eventEnvelope?.eventType || eventEnvelope?.EventType
    if (!eventType) return

    const payload = eventEnvelope?.payload || eventEnvelope?.Payload || {}

    const rules = {
      'accountant.request.sent': {
        severity: 'info',
        message: 'New accountant work request was sent.',
      },
      'accountant.request.accepted': {
        severity: 'success',
        message: 'An accountant accepted a work request.',
      },
      'accountant.request.declined': {
        severity: 'warning',
        message: 'An accountant declined a work request.',
      },
      'accountant.connection.disconnected': {
        severity: 'warning',
        message: 'An accountant-company connection was removed.',
      },
      'anomaly.created': {
        severity: 'warning',
        message: payload?.title ? `New anomaly: ${payload.title}` : 'A new anomaly was detected.',
      },
      'anomaly.resolved': {
        severity: 'success',
        message: 'An anomaly was resolved.',
      },
      'anomaly.duplicate_invoice.decided': {
        severity: 'info',
        message: 'A duplicate invoice decision was saved.',
      },
      'admin.user.active_toggled': {
        severity: payload?.isActive ? 'success' : 'warning',
        message: payload?.isActive ? 'Your account was activated.' : 'Your account was deactivated.',
      },
    }

    const rule = rules[eventType]
    if (!rule) return
    notify(rule)
  }, [notify])

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
      setIsConnected(false)
      setConnectionState('disconnected')
      activeCompanyRef.current = null
      return
    }

    let disposed = false
    const client = createRealtimeClient(token)
    clientRef.current = client

    client.onStateChange((state) => {
      if (disposed) return
      setConnectionState(state)
      setIsConnected(state === 'connected')
    })

    const onUploadJobUpdated = (payload) => {
      emit('uploadJobUpdated', payload)

      const status = (payload?.status || payload?.Status || '').toLowerCase()
      if (status === 'completed') {
        notify({ message: 'Upload processing completed.', severity: 'success' })
      } else if (status === 'failed' || status === 'canceled') {
        notify({ message: payload?.errorMessage || payload?.ErrorMessage || 'Upload processing failed.', severity: 'error' })
      }
    }

    const onNotificationEvent = (payload) => {
      emit('notificationEvent', payload)
      notifyFromRealtimeEvent(payload)
    }
    client.on('uploadJobUpdated', onUploadJobUpdated)
    client.on('notificationEvent', onNotificationEvent)

    const connect = async () => {
      try {
        await client.start()
        if (disposed) return
      } catch {
        if (!disposed) {
          setConnectionState('disconnected')
          setIsConnected(false)
        }
      }
    }

    connect()

    return () => {
      disposed = true
      activeCompanyRef.current = null
      client.off('uploadJobUpdated', onUploadJobUpdated)
      client.off('notificationEvent', onNotificationEvent)
      client.stop().catch(() => {})

      if (clientRef.current === client) {
        clientRef.current = null
      }
    }
  }, [emit, isAuthenticated, notify, notifyFromRealtimeEvent, token])

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
    connectionState,
    isConnected,
    subscribe,
  }), [connectionState, isConnected, subscribe])

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

RealtimeProvider.propTypes = {
  children: PropTypes.node.isRequired,
}