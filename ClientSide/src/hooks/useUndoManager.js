import { useCallback, useRef, useState } from 'react'

export function useUndoManager(timeout = 5000) {
  const [pending, setPending] = useState(null)
  const timerRef = useRef(null)

  const push = useCallback((action) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPending(action)
    timerRef.current = setTimeout(() => {
      setPending(null)
      timerRef.current = null
    }, timeout)
  }, [timeout])

  const undo = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const action = pending
    setPending(null)
    return action
  }, [pending])

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setPending(null)
  }, [])

  return { pending, push, undo, dismiss }
}
