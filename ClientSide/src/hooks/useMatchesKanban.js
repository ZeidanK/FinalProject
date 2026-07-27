import { useCallback, useMemo, useState } from 'react'

export function useMatchesKanban({
  invoices: rawInvoices,
  transactions: rawTransactions,
  matches: rawMatches,
  suggestions: rawSuggestions,
  simpleSuggestions: rawSimpleSuggestions,
  installmentSuggestions: rawInstallmentSuggestions,
}) {
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [transactionSearch, setTransactionSearch] = useState('')
  const [activeColumn, setActiveColumn] = useState('unmatched')
  const [focusedIndex, setFocusedIndex] = useState(null)
  const [deniedSimplePairs, setDeniedSimplePairs] = useState(new Set())
  const [deniedInstallmentPairs, setDeniedInstallmentPairs] = useState(new Set())

  const [reviewInvoiceId, setReviewInvoiceId] = useState(null)
  const [reviewTransactionId, setReviewTransactionId] = useState(null)
  const [manualMatchAmount, setManualMatchAmount] = useState('')

  const filteredInvoices = useMemo(() => {
    const q = invoiceSearch.toLowerCase()
    if (!q) return rawInvoices
    return rawInvoices.filter((inv) => {
      const vendor = (inv.vendor_name || inv.vendorName || '').toLowerCase()
      const num = (inv.invoice_number || inv.invoiceNumber || '').toLowerCase()
      return vendor.includes(q) || num.includes(q)
    })
  }, [rawInvoices, invoiceSearch])

  const filteredTransactions = useMemo(() => {
    const q = transactionSearch.toLowerCase()
    if (!q) return rawTransactions
    return rawTransactions.filter((trx) => {
      const vendor = (trx.vendor_name || trx.vendorName || '').toLowerCase()
      const amt = `${trx.chargeAmount ?? trx.charge_amount ?? trx.amount ?? ''}`
      return vendor.includes(q) || amt.includes(q)
    })
  }, [rawTransactions, transactionSearch])

  const invoiceTransactions = useMemo(
    () => filteredTransactions.filter((t) => t.requiresInvoice !== false),
    [filteredTransactions],
  )
  const noInvoiceTransactions = useMemo(
    () => filteredTransactions.filter((t) => t.requiresInvoice === false),
    [filteredTransactions],
  )

  const validSuggestions = useMemo(
    () => (Array.isArray(rawSuggestions) ? rawSuggestions : []),
    [rawSuggestions],
  )

  const quickSuggestions = useMemo(() => {
    const raw = Array.isArray(rawSimpleSuggestions) ? rawSimpleSuggestions : []
    return raw.filter((s) => !deniedSimplePairs.has(`${s.invoiceId}-${s.transactionId}`))
  }, [rawSimpleSuggestions, deniedSimplePairs])

  const installmentGroups = useMemo(() => {
    const raw = Array.isArray(rawInstallmentSuggestions) ? rawInstallmentSuggestions : []
    return raw
  }, [rawInstallmentSuggestions])

  const regularMatches = useMemo(
    () => (Array.isArray(rawMatches) ? rawMatches : []),
    [rawMatches],
  )

  const totalMatchedAmount = useMemo(
    () => regularMatches.reduce((sum, m) => sum + (Number(m.matched_amount ?? m.matchedAmount) || 0), 0),
    [regularMatches],
  )

  const reviewInvoice = useMemo(
    () => rawInvoices.find((i) => i.id === reviewInvoiceId) || null,
    [rawInvoices, reviewInvoiceId],
  )
  const reviewTransaction = useMemo(
    () => rawTransactions.find((t) => t.id === reviewTransactionId) || null,
    [rawTransactions, reviewTransactionId],
  )

  const setReviewInvoice = useCallback((id) => {
    setReviewInvoiceId(id)
    setActiveColumn('review')
  }, [])

  const setReviewTransaction = useCallback((id) => {
    setReviewTransactionId(id)
    setActiveColumn('review')
  }, [])

  const clearManualPair = useCallback(() => {
    setReviewInvoiceId(null)
    setReviewTransactionId(null)
    setManualMatchAmount('')
  }, [])

  const denySimplePair = useCallback((invoiceId, transactionId) => {
    setDeniedSimplePairs((prev) => new Set([...prev, `${invoiceId}-${transactionId}`]))
  }, [])

  const undoAllDenied = useCallback(() => {
    setDeniedSimplePairs(new Set())
  }, [])

  const denyInstallmentPair = useCallback((invoiceId, transactionId) => {
    setDeniedInstallmentPairs((prev) => new Set([...prev, `${invoiceId}-${transactionId}`]))
  }, [])

  const clearAllSelection = useCallback(() => {
    clearManualPair()
    setFocusedIndex(null)
  }, [clearManualPair])

  const canCreateManualMatch = Boolean(reviewInvoiceId && reviewTransactionId)

  const computeMatchedAmount = useCallback(() => {
    if (manualMatchAmount) return Number(manualMatchAmount)
    if (!reviewInvoice || !reviewTransaction) return 0
    return Math.min(
      Math.abs(Number(reviewInvoice.total_amount ?? reviewInvoice.totalAmount) || 0),
      Math.abs(Number(reviewTransaction.amount) || 0),
    )
  }, [manualMatchAmount, reviewInvoice, reviewTransaction])

  return {
    invoiceSearch,
    setInvoiceSearch,
    transactionSearch,
    setTransactionSearch,
    activeColumn,
    setActiveColumn,
    focusedIndex,
    setFocusedIndex,
    deniedSimplePairs,
    deniedInstallmentPairs,
    reviewInvoiceId,
    reviewTransactionId,
    manualMatchAmount,
    setManualMatchAmount,
    filteredInvoices,
    filteredTransactions,
    invoiceTransactions,
    noInvoiceTransactions,
    validSuggestions,
    quickSuggestions,
    installmentGroups,
    regularMatches,
    totalMatchedAmount,
    reviewInvoice,
    reviewTransaction,
    setReviewInvoice,
    setReviewTransaction,
    clearManualPair,
    denySimplePair,
    undoAllDenied,
    denyInstallmentPair,
    clearAllSelection,
    canCreateManualMatch,
    computeMatchedAmount,
  }
}
