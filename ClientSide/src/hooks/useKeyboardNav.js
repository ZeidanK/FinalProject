import { useEffect } from 'react'

export function useKeyboardNav({
  activeColumn,
  setActiveColumn,
  focusedIndex,
  setFocusedIndex,
  items,
  onConfirm,
  onDeny,
  onCreateMatch,
  onUndo,
  onSearch,
  hasUndo,
}) {
  const handleKeyDown = useCallback((e) => {
    const target = e.target
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
    if (isInput) return

    const key = e.key

    if (key === '1') { e.preventDefault(); setActiveColumn('unmatched') }
    else if (key === '2') { e.preventDefault(); setActiveColumn('review') }
    else if (key === '3') { e.preventDefault(); setActiveColumn('matched') }
    else if (key === 'j' || key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex((prev) => Math.min((prev ?? -1) + 1, items.length - 1))
    }
    else if (key === 'k' || key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex((prev) => Math.max((prev ?? 1) - 1, 0))
    }
    else if (key === 'Enter' && onConfirm && focusedIndex != null) {
      e.preventDefault()
      const item = items[focusedIndex]
      if (item) onConfirm(item)
    }
    else if ((key === 'd' || key === 'x') && onDeny && focusedIndex != null) {
      e.preventDefault()
      const item = items[focusedIndex]
      if (item) onDeny(item)
    }
    else if (key === 'm' && onCreateMatch) {
      e.preventDefault()
      onCreateMatch()
    }
    else if (key === 'u' && onUndo && hasUndo) {
      e.preventDefault()
      onUndo()
    }
    else if (key === '/' && onSearch) {
      e.preventDefault()
      onSearch()
    }
  }, [focusedIndex, items, onConfirm, onDeny, onCreateMatch, onUndo, onSearch, hasUndo, setActiveColumn, setFocusedIndex])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const focusSearch = useCallback((inputRef) => {
    if (inputRef?.current) {
      inputRef.current.focus()
    }
  }, [])

  return { focusSearch }
}
