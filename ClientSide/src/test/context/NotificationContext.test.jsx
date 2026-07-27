import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { NotificationProvider } from '../../context/NotificationContext'
import { NotificationContext } from '../../context/NotificationContextProvider'
import { useContext } from 'react'

function useNotificationContext() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('missing provider')
  return ctx
}

describe('NotificationContext', () => {
  it('starts with empty queue', () => {
    const { result } = renderHook(() => useNotificationContext(), { wrapper: NotificationProvider })
    expect(result.current.queue).toEqual([])
  })

  it('notify adds a notification', () => {
    const { result } = renderHook(() => useNotificationContext(), { wrapper: NotificationProvider })

    act(() => {
      result.current.notify({ message: 'Hello', severity: 'success' })
    })

    expect(result.current.queue).toHaveLength(1)
    expect(result.current.queue[0].message).toBe('Hello')
    expect(result.current.queue[0].severity).toBe('success')
  })

  it('notify ignores empty message', () => {
    const { result } = renderHook(() => useNotificationContext(), { wrapper: NotificationProvider })

    act(() => {
      result.current.notify({ message: '' })
      result.current.notify({ message: null })
    })

    expect(result.current.queue).toHaveLength(0)
  })

  it('deduplicates by eventId', () => {
    const { result } = renderHook(() => useNotificationContext(), { wrapper: NotificationProvider })

    act(() => {
      result.current.notify({ message: 'Dupe', eventId: 'evt1' })
      result.current.notify({ message: 'Dupe again', eventId: 'evt1' })
    })

    expect(result.current.queue).toHaveLength(1)
  })

  it('caps queue at 3 items', () => {
    const { result } = renderHook(() => useNotificationContext(), { wrapper: NotificationProvider })

    act(() => {
      result.current.notify({ message: 'A', eventId: '1' })
      result.current.notify({ message: 'B', eventId: '2' })
      result.current.notify({ message: 'C', eventId: '3' })
      result.current.notify({ message: 'D', eventId: '4' })
    })

    expect(result.current.queue).toHaveLength(3)
  })

  it('dismiss removes a notification by id', () => {
    const { result } = renderHook(() => useNotificationContext(), { wrapper: NotificationProvider })

    act(() => {
      result.current.notify({ message: 'Remove me', eventId: 'rem' })
    })

    const id = result.current.queue[0].id

    act(() => {
      result.current.dismiss(id)
    })

    expect(result.current.queue).toHaveLength(0)
  })
})
