import { useCallback, useMemo, useState } from 'react'

export function useMatchesTable({
  invoices: rawInvoices,
  transactions: rawTransactions,
  matches: rawMatches,
  simpleSuggestions: rawSimpleSuggestions,
  installmentSuggestions: rawInstallmentSuggestions,
}) {
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [transactionSearch, setTransactionSearch] = useState('')
  const [invoiceSort, setInvoiceSort] = useState({ column: 'id', dir: 'asc' })
  const [transactionSort, setTransactionSort] = useState({ column: 'id', dir: 'asc' })
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null)
  const [selectedTransactionId, setSelectedTransactionId] = useState(null)
  const [manualMatchAmount, setManualMatchAmount] = useState('')
  const [deniedSimplePairs, setDeniedSimplePairs] = useState(new Set())
  const [deniedInstallmentPairs, setDeniedInstallmentPairs] = useState(new Set())

  const invoices = useMemo(() => (Array.isArray(rawInvoices) ? rawInvoices : []), [rawInvoices])
  const transactions = useMemo(() => (Array.isArray(rawTransactions) ? rawTransactions : []), [rawTransactions])
  const matches = useMemo(() => (Array.isArray(rawMatches) ? rawMatches : []), [rawMatches])

  const simpleSuggestions = useMemo(() => (Array.isArray(rawSimpleSuggestions) ? rawSimpleSuggestions : []), [rawSimpleSuggestions])
  const installmentSuggestions = useMemo(() => (Array.isArray(rawInstallmentSuggestions) ? rawInstallmentSuggestions : []), [rawInstallmentSuggestions])

  const invoiceTransactions = useMemo(
    () => transactions.filter((t) => t.requiresInvoice !== false),
    [transactions],
  )
  const noInvoiceTransactions = useMemo(
    () => transactions.filter((t) => t.requiresInvoice === false),
    [transactions],
  )

  const quickSuggestions = useMemo(() => {
    return simpleSuggestions.filter((s) => !deniedSimplePairs.has(`${s.invoiceId}-${s.transactionId}`))
  }, [simpleSuggestions, deniedSimplePairs])

  const installmentMatches = useMemo(() => {
    return matches.filter((m) => (m.match_method ?? m.matchMethod) === 'installment_simple')
  }, [matches])

  const regularMatches = useMemo(() => {
    return matches.filter((m) => (m.match_method ?? m.matchMethod) !== 'installment_simple')
  }, [matches])
  const totalMatchedAmount = useMemo(
    () => regularMatches.reduce((sum, m) => sum + (Number(m.matched_amount ?? m.matchedAmount) || 0), 0),
    [regularMatches],
  )

  const selectedInvoice = useMemo(
    () => invoices.find((i) => i.id === selectedInvoiceId) || null,
    [invoices, selectedInvoiceId],
  )
  const selectedTransaction = useMemo(
    () => transactions.find((t) => t.id === selectedTransactionId) || null,
    [transactions, selectedTransactionId],
  )

  const sortItems = useCallback((items, sortCol, sortDir, fieldMap) => {
    if (!sortCol) return items
    return [...items].sort((a, b) => {
      const aVal = a[fieldMap?.[sortCol] || sortCol] ?? a[sortCol] ?? ''
      const bVal = b[fieldMap?.[sortCol] || sortCol] ?? b[sortCol] ?? ''
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(String(bVal)) : (Number(aVal) - Number(bVal))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [])

  const invoiceFieldMap = { invoice: 'invoice_number', vendor: 'vendor_name', amount: 'total_amount', date: 'invoice_date' }
  const transactionFieldMap = { vendor: 'vendor_name', amount: 'amount', date: 'transaction_date', type: 'type' }

  const filteredInvoices = useMemo(() => {
    const q = invoiceSearch.toLowerCase()
    let items = invoices
    if (q) {
      items = items.filter((inv) => {
        const vendor = (inv.vendor_name || inv.vendorName || '').toLowerCase()
        const num = (inv.invoice_number || inv.invoiceNumber || '').toLowerCase()
        return vendor.includes(q) || num.includes(q)
      })
    }
    return sortItems(items, invoiceSort.column, invoiceSort.dir, invoiceFieldMap)
  }, [invoices, invoiceSearch, invoiceSort, sortItems])

  const filteredTransactions = useMemo(() => {
    const q = transactionSearch.toLowerCase()
    let items = invoiceTransactions
    if (q) {
      items = items.filter((trx) => {
        const vendor = (trx.vendor_name || trx.vendorName || '').toLowerCase()
        const amt = `${trx.chargeAmount ?? trx.charge_amount ?? trx.amount ?? ''}`
        return vendor.includes(q) || amt.includes(q)
      })
    }
    return sortItems(items, transactionSort.column, transactionSort.dir, transactionFieldMap)
  }, [invoiceTransactions, transactionSearch, transactionSort, sortItems])

  const toggleInvoiceSort = useCallback((column) => {
    setInvoiceSort((prev) => prev.column === column ? { column, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { column, dir: 'asc' })
  }, [])

  const toggleTransactionSort = useCallback((column) => {
    setTransactionSort((prev) => prev.column === column ? { column, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { column, dir: 'asc' })
  }, [])

  const selectInvoice = useCallback((id) => {
    setSelectedInvoiceId((prev) => prev === id ? null : id)
  }, [])

  const selectTransaction = useCallback((id) => {
    setSelectedTransactionId((prev) => prev === id ? null : id)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedInvoiceId(null)
    setSelectedTransactionId(null)
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

  const canCreateManualMatch = Boolean(selectedInvoiceId && selectedTransactionId)

  const computeMatchedAmount = useCallback(() => {
    if (manualMatchAmount) return Number(manualMatchAmount)
    if (!selectedInvoice || !selectedTransaction) return 0
    return Math.min(
      Math.abs(Number(selectedInvoice.total_amount ?? selectedInvoice.totalAmount) || 0),
      Math.abs(Number(selectedTransaction.amount) || 0),
    )
  }, [manualMatchAmount, selectedInvoice, selectedTransaction])

  return {
    invoiceSearch, setInvoiceSearch,
    transactionSearch, setTransactionSearch,
    invoiceSort, toggleInvoiceSort,
    transactionSort, toggleTransactionSort,
    selectedInvoiceId, selectInvoice,
    selectedTransactionId, selectTransaction,
    manualMatchAmount, setManualMatchAmount,
    deniedSimplePairs, denySimplePair, undoAllDenied,
    deniedInstallmentPairs, denyInstallmentPair,
    filteredInvoices, filteredTransactions,
    noInvoiceTransactions,
    invoices, transactions, matches,
    simpleSuggestions, quickSuggestions,
    installmentSuggestions,
    regularMatches, installmentMatches, totalMatchedAmount,
    selectedInvoice, selectedTransaction,
    clearSelection,
    canCreateManualMatch, computeMatchedAmount,
  }
}
