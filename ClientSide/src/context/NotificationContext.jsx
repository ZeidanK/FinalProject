import { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { NotificationContext } from './NotificationContextProvider'

/**
 * Provides global in-app notifications with queueing support.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components.
 * @returns {JSX.Element} Notification context provider.
 */
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