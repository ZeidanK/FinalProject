import { useContext } from 'react'
import { NotificationContext } from './NotificationContextProvider'

/**
 * Hook to consume global notification context.
 *
 * @returns {object} Notification context value.
 * @throws {Error} When used outside NotificationProvider.
 */
export function useNotification() {
  const context = useContext(NotificationContext)

  if (!context) {
    throw new Error('useNotification must be used inside NotificationProvider.')
  }

  return context
}