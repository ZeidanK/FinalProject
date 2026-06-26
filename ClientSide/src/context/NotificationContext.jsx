import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

export const NotificationContext = createContext(undefined)

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used inside NotificationProvider.')
  }
  return context
}

export function NotificationProvider({ children }) {
  const [queue, setQueue] = useState([])

  const notify = useCallback(({ message, severity = 'info', autoHideMs = 5000 }) => {
    if (!message) return

    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      severity,
      autoHideMs,
    }

    setQueue((prev) => [...prev, item])
  }, [])

  const dismiss = useCallback((id) => {
    setQueue((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const value = useMemo(() => ({ queue, notify, dismiss }), [queue, notify, dismiss])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
}