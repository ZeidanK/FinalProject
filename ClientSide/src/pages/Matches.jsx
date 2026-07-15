import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded'
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import DataSaverOnRoundedIcon from '@mui/icons-material/DataSaverOnRounded'
import { AnimatePresence, motion } from 'framer-motion'
import AnimatedBackground from '../components/AnimatedBackground'
import RevealOnScroll from '../components/RevealOnScroll'
import DataTable from '../components/DataTable'
import SuggestionsTable from '../components/SuggestionsTable'
import MatchActionBarEnhanced from '../components/MatchActionBarEnhanced'
import MatchDetailsModal from '../components/MatchDetailsModal'
import UndoSnackbar from '../components/UndoSnackbar'
import AutoMatchPreviewModal from '../components/AutoMatchPreviewModal'
import MatchComparisonPanel from '../components/MatchComparisonPanel'
import StatsCards from '../components/StatsCards'
import CollapsibleSection from '../components/CollapsibleSection'
import MatchActionBar from '../components/MatchActionBar'
import SuggestionPanel from '../components/SuggestionPanel'
import QuickMatchSuggestions from '../components/QuickMatchSuggestions'
import InstallmentMatchGroups from '../components/InstallmentMatchGroups'
import InvoiceVerificationModal from '../components/InvoiceVerificationModal'
import { useNotification } from '../context/useNotification'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import { getInvoiceById, updateInvoice } from '../services/invoices'
import { getTransactionById } from '../services/transactions'
import { mapExtractedToForm } from '../utils/invoiceExtraction'
import { fmtAmount, fmtDate, toDateInput } from '../utils/formatters'
import { getInstallmentSuggestionAmount } from '../utils/matchAmounts'
import { containerVariants, itemVariants } from '../utils/motionVariants'
import { invoiceKeys, matchKeys, transactionKeys } from '../queries/queryKeys'
import { exportMatchesCSV } from '../utils/csvExport'
import {
  useAutoMatchOnLoadMutation,
  useCreateMatchMutation,
  useDeleteMatchMutation,
  useInstallmentSuggestionsQuery,
  useMatchSuggestionsQuery,
  useMatchesByCompanyQuery,
  useSimpleSuggestionsQuery,
  useUnmatchedInvoicesQuery,
  useUnmatchedTransactionsQuery,
} from '../hooks/queries/useMatchesQueries'
import { useMatchesTable } from '../hooks/useMatchesTable'
import { useUndoManager } from '../hooks/useUndoManager'

const readField = (source, snakeKey, camelKey) => {
  if (!source) return undefined
  return source[snakeKey] ?? source[camelKey] ?? undefined
}

const mapSavedInvoiceToForm = (invoice) => {
  const confidence = invoice?.ai_extraction_confidence ?? invoice?.aiExtractionConfidence ?? null
  const lineItems = invoice?.lineItems || invoice?.line_items || []
  return mapExtractedToForm(
    {
      vendorName: invoice?.vendor_name ?? invoice?.vendorName ?? '',
      invoiceNumber: invoice?.invoice_number ?? invoice?.invoiceNumber ?? '',
      invoiceDate: toDateInput(invoice?.invoice_date ?? invoice?.invoiceDate),
      dueDate: toDateInput(invoice?.due_date ?? invoice?.dueDate),
      totalAmount: invoice?.total_amount ?? invoice?.totalAmount ?? 0,
      subtotal: invoice?.subtotal ?? 0,
      vatRate: invoice?.vat_rate ?? invoice?.vatRate ?? null,
      vatAmount: invoice?.vat_amount ?? invoice?.vatAmount ?? null,
      currency: invoice?.currency ?? 'USD',
      vendorTaxId: invoice?.vendor_tax_id ?? invoice?.vendorTaxId ?? '',
      lastFourDigitsCard: invoice?.last_four_digits_card ?? invoice?.lastFourDigitsCard ?? '',
      paymentPlan: {
        totalInstallments: invoice?.paymentPlanTotalInstallments ?? invoice?.payment_plan_total_installments ?? null,
        installmentAmount: invoice?.paymentPlanInstallmentAmount ?? invoice?.payment_plan_installment_amount ?? null,
        frequency: invoice?.paymentPlanFrequency ?? invoice?.payment_plan_frequency ?? null,
        currentInstallment: invoice?.paymentPlanCurrentInstallment ?? invoice?.payment_plan_current_installment ?? null,
        description: invoice?.paymentPlanDescription ?? invoice?.payment_plan_description ?? null,
      },
      lineItems: lineItems.map((li, idx) => ({
        description: li?.description || '',
        quantity: li?.quantity ?? 1,
        unitPrice: li?.unit_price ?? li?.unitPrice ?? 0,
        totalAmount: li?.total_amount ?? li?.totalAmount ?? 0,
        aiConfidenceScore: li?.ai_confidence_score ?? li?.aiConfidenceScore ?? null,
        lineNumber: li?.line_number ?? li?.lineNumber ?? idx + 1,
      })),
      extractionConfidence: confidence,
    },
    confidence,
  )
}

const INV_COLUMNS = [
  { key: 'invoice', label: 'Invoice', sortable: true, render: (r) => r.invoice_number || r.invoiceNumber || `#${r.id}`, minWidth: 100 },
  { key: 'vendor', label: 'Vendor', sortable: true, render: (r) => r.vendor_name || r.vendorName || '\u2014', minWidth: 120 },
  { key: 'amount', label: 'Amount', sortable: true, render: (r) => fmtAmount(r.total_amount ?? r.totalAmount), minWidth: 90 },
  { key: 'date', label: 'Date', sortable: true, render: (r) => fmtDate(r.invoice_date || r.invoiceDate), minWidth: 90 },
]

const TRX_COLUMNS = [
  { key: 'vendor', label: 'Vendor', sortable: true, render: (r) => r.vendor_name || r.vendorName || r.description || `#${r.id}`, minWidth: 120 },
  { key: 'amount', label: 'Amount', sortable: true, render: (r) => fmtAmount(r.chargeAmount ?? r.charge_amount ?? r.amount ?? 0), minWidth: 90 },
  { key: 'date', label: 'Date', sortable: true, render: (r) => fmtDate(r.transaction_date || r.transactionDate), minWidth: 90 },
  { key: 'type', label: 'Type', sortable: true, render: (r) => r.type || r.transaction_type || r.transactionType || '\u2014', minWidth: 70 },
]

function MatchesPage() {
  const { token } = useAuth()
  const { activeCompanyId } = useCompany()
  const queryClient = useQueryClient()
  const { notify } = useNotification()
  const setSnack = useCallback(({ message, severity }) => { notify({ message, severity }) }, [notify])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [matchBusy, setMatchBusy] = useState(false)
  const [invoiceModal, setInvoiceModal] = useState({ open: false, file: null })
  const [invoiceSaving, setInvoiceSaving] = useState(false)
  const [reopeningInvoiceId, setReopeningInvoiceId] = useState(null)
  const [unmatchDialog, setUnmatchDialog] = useState({ open: false, matchId: null })
  const [matchDetailsDialog, setMatchDetailsDialog] = useState({ open: false, match: null, invoice: null, transaction: null, loading: false, error: '' })
  const [autoPreviewOpen, setAutoPreviewOpen] = useState(false)
  const [autoPreviewData, setAutoPreviewData] = useState(null)
  const [autoPreviewLoading, setAutoPreviewLoading] = useState(false)
  const [comparisonInvoice, setComparisonInvoice] = useState(null)
  const [comparisonTransaction, setComparisonTransaction] = useState(null)

  const undoManager = useUndoManager(5000)

  const matchesQuery = useMatchesByCompanyQuery({ companyId: activeCompanyId, token })
  const invoicesQuery = useUnmatchedInvoicesQuery({ companyId: activeCompanyId, token })
  const transactionsQuery = useUnmatchedTransactionsQuery({ companyId: activeCompanyId, token })
  const createMatchMutation = useCreateMatchMutation({ companyId: activeCompanyId, token })
  const deleteMatchMutation = useDeleteMatchMutation({ companyId: activeCompanyId, token })
  const autoMatchMutation = useAutoMatchOnLoadMutation({ companyId: activeCompanyId, token })
  const simpleSuggestionsQuery = useSimpleSuggestionsQuery({ companyId: activeCompanyId, token })
  const installmentSuggestionsQuery = useInstallmentSuggestionsQuery({ companyId: activeCompanyId, token })

  const invoices = useMemo(() => Array.isArray(invoicesQuery.data) ? invoicesQuery.data : [], [invoicesQuery.data])
  const rawTransactions = useMemo(() => transactionsQuery.data?.items ?? [], [transactionsQuery.data])
  const matches = useMemo(() => Array.isArray(matchesQuery.data) ? matchesQuery.data : [], [matchesQuery.data])

  const table = useMatchesTable({
    invoices,
    transactions: rawTransactions,
    matches,
    simpleSuggestions: simpleSuggestionsQuery.data,
    installmentSuggestions: installmentSuggestionsQuery.data,
  })

  useEffect(() => {
    const nextError = matchesQuery.error?.message || invoicesQuery.error?.message || transactionsQuery.error?.message || ''
    setError(nextError)
    setLoading(matchesQuery.isLoading || invoicesQuery.isLoading || transactionsQuery.isLoading)
  }, [invoicesQuery.error, invoicesQuery.isLoading, matchesQuery.error, matchesQuery.isLoading, transactionsQuery.error, transactionsQuery.isLoading])

  const loadData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: matchKeys.all }),
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all }),
      queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
    ])
  }, [queryClient])

  const handleCreateMatch = useCallback(async () => {
    if (!table.selectedInvoice || !table.selectedTransaction) return
    setMatchBusy(true)
    try {
      const amount = table.computeMatchedAmount()
      const result = await createMatchMutation.mutateAsync({
        invoiceId: table.selectedInvoice.id,
        transactionId: table.selectedTransaction.id,
        matchedAmount: amount,
        matchMethod: 'manual',
        matchType: 'full',
        matchConfidence: 1,
      })
      undoManager.push({ message: 'Manual match created', matchId: result?.id ?? result?.matchId ?? null })
      table.clearSelection()
      setSnack({ message: 'Match created!', severity: 'success' })
    } catch (err) {
      setSnack({ message: err.message || 'Failed to create match.', severity: 'error' })
    } finally {
      setMatchBusy(false)
    }
  }, [table.selectedInvoice, table.selectedTransaction, table.clearSelection, table.computeMatchedAmount, createMatchMutation])

  const handleConfirmSuggestion = useCallback(async (suggestion, source) => {
    setMatchBusy(true)
    try {
      const result = await createMatchMutation.mutateAsync({
        invoiceId: suggestion.invoiceId,
        transactionId: suggestion.transactionId,
        matchedAmount: suggestion.invoiceAmount ?? 0,
        matchMethod: source === 'ai' ? 'auto' : 'simple',
        matchType: 'full',
        matchConfidence: suggestion.confidence ?? 1,
      })
      undoManager.push({ message: `${source === 'ai' ? 'AI' : 'Quick'} match confirmed`, matchId: result?.id ?? result?.matchId ?? null })
      setSnack({ message: 'Match confirmed!', severity: 'success' })
    } catch (err) {
      setSnack({ message: err.message || 'Failed to confirm.', severity: 'error' })
    } finally {
      setMatchBusy(false)
    }
  }, [createMatchMutation])

  const handleConfirmInstallment = useCallback(async (group, txn) => {
    setMatchBusy(true)
    try {
      const installmentNumber = (group.alreadyMatchedCount || 0) + 1
      const expected = group.expectedInstallments
      const totalAmount = Number(group.totalAmount) || 0
      const alreadyMatchedAmount = Number(group.alreadyMatchedAmount) || 0
      const remainingAmount = Math.max(totalAmount - alreadyMatchedAmount, 0)
      const suggestedAmount = getInstallmentSuggestionAmount(txn)
      const effectiveAmount = Math.min(suggestedAmount, remainingAmount)
      if (suggestedAmount <= 0) throw new Error('Installment amount is missing.')
      if (effectiveAmount <= 0) throw new Error('No remaining balance to match.')

      const result = await createMatchMutation.mutateAsync({
        invoiceId: group.invoiceId,
        transactionId: txn.transactionId,
        matchedAmount: effectiveAmount,
        matchMethod: 'installment_simple',
        matchType: effectiveAmount >= remainingAmount ? 'full' : 'partial',
        matchConfidence: 1,
        installmentNumber,
        installmentNote: `Installment ${installmentNumber}${expected ? ` of ${expected}` : ''}`,
      })
      undoManager.push({ message: `Installment ${installmentNumber} confirmed`, matchId: result?.id ?? result?.matchId ?? null })
      setSnack({ message: `Installment ${installmentNumber} confirmed!`, severity: 'success' })
    } catch (err) {
      setSnack({ message: err.message || 'Failed to confirm installment.', severity: 'error' })
    } finally {
      setMatchBusy(false)
    }
  }, [createMatchMutation])

  const handleUndo = useCallback(async () => {
    const action = undoManager.undo()
    if (!action?.matchId) return
    try {
      await deleteMatchMutation.mutateAsync(action.matchId)
      setSnack({ message: 'Match undone.', severity: 'info' })
    } catch (err) {
      setSnack({ message: err.message || 'Failed to undo.', severity: 'error' })
    }
  }, [undoManager, deleteMatchMutation])

  const confirmUnmatch = useCallback((matchId) => setUnmatchDialog({ open: true, matchId }), [])

  const handleUnmatch = useCallback(async () => {
    const matchId = unmatchDialog.matchId
    setUnmatchDialog({ open: false, matchId: null })
    if (!matchId) return
    try {
      await deleteMatchMutation.mutateAsync(matchId)
      setSnack({ message: 'Match removed.', severity: 'success' })
    } catch (err) {
      setSnack({ message: err.message || 'Failed to remove match.', severity: 'error' })
    }
  }, [unmatchDialog.matchId, deleteMatchMutation])

  const openMatchDetails = useCallback(async (match) => {
    const invoiceId = readField(match, 'invoice_id', 'invoiceId')
    const transactionId = readField(match, 'transaction_id', 'transactionId')
    const hasDetails = Boolean(invoiceId || transactionId)
    setMatchDetailsDialog({ open: true, match, invoice: null, transaction: null, loading: hasDetails, error: '' })
    if (!hasDetails) return
    const [invResult, trxResult] = await Promise.allSettled([
      invoiceId ? getInvoiceById(invoiceId, token) : Promise.resolve(null),
      transactionId ? getTransactionById(transactionId, token) : Promise.resolve(null),
    ])
    const matchKey = readField(match, 'id', 'id') ?? match
    setMatchDetailsDialog((cur) => {
      if (!cur.open || (readField(cur.match, 'id', 'id') ?? cur.match) !== matchKey) return cur
      return { ...cur, invoice: invResult.status === 'fulfilled' ? invResult.value : null, transaction: trxResult.status === 'fulfilled' ? trxResult.value : null, loading: false, error: invResult.status === 'rejected' || trxResult.status === 'rejected' ? 'Some details could not be loaded.' : '' }
    })
  }, [token])

  const closeMatchDetails = useCallback(() => setMatchDetailsDialog({ open: false, match: null, invoice: null, transaction: null, loading: false, error: '' }), [])

  const openInvoiceForEditing = useCallback(async (invoiceId) => {
    if (!invoiceId) return
    setReopeningInvoiceId(invoiceId)
    try {
      const invoice = await getInvoiceById(invoiceId, token)
      const extractedData = mapSavedInvoiceToForm(invoice)
      setInvoiceModal({
        open: true,
        file: { id: `saved-${invoice.id}`, name: invoice.fileOriginalName || invoice.file_original_name || `Invoice ${invoice.invoiceNumber || invoice.invoice_number || invoice.id}`, extractedData, existingInvoiceId: invoice.id, sourceInvoice: invoice },
      })
    } catch (err) { setSnack({ message: err.message || 'Failed to open invoice.', severity: 'error' }) }
    finally { setReopeningInvoiceId(null) }
  }, [token])

  const handleSaveInvoiceVerification = useCallback(async (formData) => {
    const editingInvoiceId = invoiceModal.file?.existingInvoiceId
    if (!editingInvoiceId) return
    const sourceInvoice = invoiceModal.file?.sourceInvoice || {}
    setInvoiceSaving(true)
    try {
      const payload = {
        companyId: sourceInvoice.companyId || sourceInvoice.company_id || activeCompanyId,
        invoiceNumber: formData.invoiceNumber?.value || '',
        vendorName: formData.vendorName?.value || '',
        invoiceDate: formData.invoiceDate?.value || new Date().toISOString(),
        totalAmount: Number.parseFloat(formData.totalAmount?.value) || 0,
        subtotal: Number.parseFloat(formData.subtotal?.value) || 0,
        vatRate: Number.parseFloat(formData.vatRate?.value) || null,
        vatAmount: Number.parseFloat(formData.vatAmount?.value) || null,
        currency: formData.currency?.value || 'USD',
        vendorTaxId: formData.vendorTaxId?.value || null,
        lastFourDigitsCard: formData.lastFourDigitsCard?.value || null,
        dueDate: formData.dueDate?.value || null,
        paymentDate: sourceInvoice.paymentDate || sourceInvoice.payment_date || null,
        itemCount: sourceInvoice.itemCount || sourceInvoice.item_count || null,
        paymentPlanTotalInstallments: formData.paymentPlan?.totalInstallments?.value ?? sourceInvoice.paymentPlanTotalInstallments ?? sourceInvoice.payment_plan_total_installments ?? null,
        paymentPlanInstallmentAmount: formData.paymentPlan?.installmentAmount?.value ?? sourceInvoice.paymentPlanInstallmentAmount ?? sourceInvoice.payment_plan_installment_amount ?? null,
        paymentPlanFrequency: formData.paymentPlan?.frequency?.value ?? sourceInvoice.paymentPlanFrequency ?? sourceInvoice.payment_plan_frequency ?? null,
        paymentPlanCurrentInstallment: formData.paymentPlan?.currentInstallment?.value ?? sourceInvoice.paymentPlanCurrentInstallment ?? sourceInvoice.payment_plan_current_installment ?? null,
        paymentPlanDescription: formData.paymentPlan?.description?.value ?? sourceInvoice.paymentPlanDescription ?? sourceInvoice.payment_plan_description ?? null,
        fileOriginalName: sourceInvoice.fileOriginalName || sourceInvoice.file_original_name || null,
        filePath: sourceInvoice.filePath || sourceInvoice.file_path || null,
        fileType: sourceInvoice.fileType || sourceInvoice.file_type || null,
        fileSize: sourceInvoice.fileSize || sourceInvoice.file_size || null,
        aiExtractionConfidence: sourceInvoice.aiExtractionConfidence || sourceInvoice.ai_extraction_confidence || null,
        lineItems: (formData.lineItems || []).map((li, idx) => ({
          description: li.description || 'Item', unitPrice: Number.parseFloat(li.unitPrice) || 0, totalAmount: Number.parseFloat(li.totalAmount) || 0, lineNumber: idx + 1, quantity: Number.parseFloat(li.quantity) || 1, vatRate: Number.parseFloat(formData.vatRate?.value) || null, aiConfidenceScore: li.confidence ?? null,
        })),
      }
      await updateInvoice(editingInvoiceId, payload, token)
      setInvoiceModal({ open: false, file: null })
      setSnack({ message: 'Invoice updated!', severity: 'success' })
      table.clearSelection()
      await loadData()
    } catch (err) { setSnack({ message: err.message || 'Failed to save.', severity: 'error' }) }
    finally { setInvoiceSaving(false) }
  }, [invoiceModal.file, activeCompanyId, token, loadData])

  const handleAutoPreview = useCallback(async () => {
    setAutoPreviewLoading(true)
    setAutoPreviewOpen(true)
    try {
      const result = await autoMatchMutation.mutateAsync({ minConfidence: 70 })
      const items = result?.matchDetails || result?.suggestionsForReview || []
      setAutoPreviewData(Array.isArray(items) ? items.map((item) => ({
        invoice: { id: item.invoiceId, invoice_number: item.invoiceNumber, total_amount: item.invoiceAmount, invoice_date: item.invoiceDate },
        transaction: { id: item.transactionId, description: item.transactionDescription, amount: item.transactionAmount, transaction_date: item.transactionDate },
        confidence: item.matchScore ?? item.matchConfidence ?? 0.7,
        amount: item.matchedAmount ?? item.invoiceAmount,
      })) : [])
    } catch { setAutoPreviewData([]) }
    finally { setAutoPreviewLoading(false) }
  }, [autoMatchMutation])

  const handleAutoConfirm = useCallback(async (selectedItems) => {
    setAutoPreviewOpen(false)
    setMatchBusy(true)
    let count = 0
    try {
      for (const item of selectedItems) {
        await createMatchMutation.mutateAsync({ invoiceId: item.invoice.id, transactionId: item.transaction.id, matchedAmount: item.amount || item.invoice?.total_amount || 0, matchMethod: 'auto', matchType: 'full', matchConfidence: item.confidence ?? 0.7 })
        count++
      }
      setSnack({ message: `${count} auto-match(es) created!`, severity: 'success' })
    } catch (err) { setSnack({ message: err.message || 'Auto-match failed.', severity: 'error' }) }
    finally { setMatchBusy(false) }
  }, [createMatchMutation])

  const handleExport = useCallback(() => {
    exportMatchesCSV(table.regularMatches)
    setSnack({ message: 'Matches exported as CSV.', severity: 'info' })
  }, [table.regularMatches])

  const handleShowComparison = useCallback(() => {
    setComparisonInvoice(table.selectedInvoice)
    setComparisonTransaction(table.selectedTransaction)
  }, [table.selectedInvoice, table.selectedTransaction])

  const inReviewCount = table.quickSuggestions.length + table.installmentSuggestions.reduce((sum, g) => {
    const suggested = Array.isArray(g?.suggested_transactions ?? g?.suggestedTransactions) ? (g?.suggested_transactions ?? g?.suggestedTransactions) : []
    return sum + suggested.filter((t) => !table.deniedInstallmentPairs.has(`${g.invoiceId}-${(t.transaction_id ?? t.transactionId)}`)).length
  }, 0)

  const isInstallmentMatch = (r) => (r.match_method || r.matchMethod) === 'installment_simple'

  const matchColumns = [
    { key: 'invoice', label: 'Invoice', render: (r) => r.invoice_number || r.invoiceNumber || `#${r.invoice_id ?? r.invoiceId}`, minWidth: 100 },
    { key: 'transaction', label: 'Transaction', render: (r) => r.transaction_vendor_name || r.transactionVendorName || r.transaction_description || r.transactionDescription || `#${r.transaction_id ?? r.transactionId}`, minWidth: 120 },
    { key: 'amount', label: 'Amount', render: (r) => fmtAmount(r.matched_amount ?? r.matchedAmount), minWidth: 90 },
    {
      key: 'installment',
      label: 'Installment',
      render: (r) => {
        if (!isInstallmentMatch(r)) return '\u2014'
        const num = r.installment_number ?? r.installmentNumber
        const note = r.installment_note ?? r.installmentNote
        return note || (num ? `#${num}` : '\u2713')
      },
      minWidth: 80,
    },
    {
      key: 'method',
      label: 'Method',
      render: (r) => {
        const method = r.match_method || r.matchMethod || '\u2014'
        return isInstallmentMatch(r) ? 'installment' : method
      },
      minWidth: 70,
    },
  ]

  return (
    <>
      <Box sx={{ py: { xs: 3, md: 4 }, position: 'relative', overflow: 'hidden' }} role="region" aria-label="Matches page">
        <AnimatedBackground density="low" />
        <Container maxWidth={false} disableGutters sx={{ px: { xs: 2, sm: 3, md: 4, xl: 5 }, width: '100%', position: 'relative', zIndex: 1 }}>
          <Stack component={motion.div} variants={containerVariants} initial="hidden" animate="show" spacing={3}>
            <Stack component={motion.div} variants={itemVariants} direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Stack spacing={0.5}>
                <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '1.9rem' } }}>Matches</Typography>
                <Typography color="text.secondary">Match invoices to bank transactions for reconciliation. Select one invoice and one transaction, then create a match.</Typography>
              </Stack>
              <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={loadData} disabled={loading}>Refresh</Button>
            </Stack>

            <StatsCards
              unmatchedInvoices={invoices.length}
              unmatchedTransactions={table.filteredTransactions.length}
              totalMatches={matches.length}
              totalMatchedFormatted={fmtAmount(table.totalMatchedAmount)}
            />

            {error && <Alert severity="error" variant="outlined" onClose={() => setError('')} action={<Button color="inherit" size="small" onClick={loadData}>Retry</Button>}>{error}</Alert>}

            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" spacing={1}>
              <Typography variant="caption" color="text.secondary">
                Select one invoice and one transaction below to create a match. Use suggestions for faster matching.
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" startIcon={<AutoFixHighRoundedIcon />} onClick={handleAutoPreview} disabled={matchBusy}>Auto-Match</Button>
                <Button size="small" variant="outlined" startIcon={<FileDownloadRoundedIcon />} onClick={handleExport} disabled={table.regularMatches.length === 0}>Export CSV</Button>
              </Stack>
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <DataTable
                  title="Unmatched Invoices"
                  icon={ReceiptLongRoundedIcon}
                  color="#58a6ff"
                  count={table.filteredInvoices.length}
                  searchValue={table.invoiceSearch}
                  onSearchChange={table.setInvoiceSearch}
                  searchPlaceholder="Search by vendor or invoice #..."
                  loading={loading}
                  emptyMessage="All invoices matched!"
                  columns={INV_COLUMNS}
                  rows={table.filteredInvoices}
                  selectedId={table.selectedInvoiceId}
                  onSelect={table.selectInvoice}
                  onSort={table.toggleInvoiceSort}
                  sortColumn={table.invoiceSort.column}
                  sortDirection={table.invoiceSort.dir}
                  renderActions={(row) => (
                    <Tooltip title="Edit invoice">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); openInvoiceForEditing(row.id) }} disabled={reopeningInvoiceId === row.id} sx={{ color: 'text.secondary' }}>
                        <DataSaverOnRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DataTable
                  title="Unmatched Transactions"
                  icon={AccountBalanceRoundedIcon}
                  color="#37d67a"
                  count={table.filteredTransactions.length}
                  searchValue={table.transactionSearch}
                  onSearchChange={table.setTransactionSearch}
                  searchPlaceholder="Search by vendor or amount..."
                  loading={loading}
                  emptyMessage="All transactions matched!"
                  columns={TRX_COLUMNS}
                  rows={table.filteredTransactions}
                  selectedId={table.selectedTransactionId}
                  onSelect={table.selectTransaction}
                  onSort={table.toggleTransactionSort}
                  sortColumn={table.transactionSort.column}
                  sortDirection={table.transactionSort.dir}
                />
              </Grid>
            </Grid>

            <AnimatePresence>
              <MatchActionBarEnhanced
                selectedInvoice={table.selectedInvoice}
                selectedTransaction={table.selectedTransaction}
                amount={table.manualMatchAmount}
                onAmountChange={table.setManualMatchAmount}
                onCreateMatch={handleCreateMatch}
                onClear={table.clearSelection}
                onShowComparison={handleShowComparison}
                canCreate={table.canCreateManualMatch}
                matchBusy={matchBusy}
              />
            </AnimatePresence>

            {table.selectedInvoice && table.selectedTransaction && (comparisonInvoice || comparisonTransaction) && (
              <MatchComparisonPanel invoice={comparisonInvoice || table.selectedInvoice} transaction={comparisonTransaction || table.selectedTransaction} />
            )}

            <SuggestionsTable
              title="Quick Match Suggestions"
              icon={CheckCircleRoundedIcon}
              color="#37d67a"
              suggestions={table.quickSuggestions}
              type="quick"
              loading={simpleSuggestionsQuery.isLoading}
              emptyMessage="No quick match suggestions."
              deniedCount={table.deniedSimplePairs.size}
              onUndoAll={table.undoAllDenied}
              onConfirm={(s) => handleConfirmSuggestion(s, 'quick')}
              onDeny={(s) => table.denySimplePair(s.invoiceId, s.transactionId)}
              matchBusy={matchBusy}
            />

            {table.installmentSuggestions.length > 0 && (
              <InstallmentMatchGroups
                query={installmentSuggestionsQuery}
                deniedTxnIds={table.deniedInstallmentPairs}
                onDeny={(invoiceId, transactionId) => table.denyInstallmentPair(invoiceId, transactionId)}
                onConfirm={handleConfirmInstallment}
                onRemoveMatch={confirmUnmatch}
                matchBusy={matchBusy}
              />
            )}

            {matches.length > 0 && (
              <DataTable
                title="Matched Items"
                icon={CheckCircleRoundedIcon}
                color="#37d67a"
                count={table.filteredMatches.length}
                searchValue={table.matchSearch}
                onSearchChange={table.setMatchSearch}
                searchPlaceholder="Search by invoice, transaction, amount, method, or date..."
                loading={loading}
                emptyMessage="No matches yet."
                columns={matchColumns}
                rows={table.filteredMatches}
                getRowStyle={(row) => isInstallmentMatch(row) ? { borderLeft: '3px solid #fbbf24', bgcolor: 'rgba(251,191,36,0.04)' } : {}}
                renderActions={(row) => (
                  <Stack direction="row" spacing={0.3}>
                    <Tooltip title="View details">
                      <IconButton size="small" aria-label="View details" onClick={(e) => { e.stopPropagation(); openMatchDetails(row) }} sx={{ color: 'primary.main' }}>
                        <DataSaverOnRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Unmatch">
                      <IconButton size="small" aria-label="Unmatch" onClick={(e) => { e.stopPropagation(); confirmUnmatch(row.id) }} sx={{ color: 'error.main' }}>
                        <LinkOffRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                )}
              />
            )}
          </Stack>
        </Container>
      </Box>

      {table.noInvoiceTransactions.length > 0 && (
        <Box sx={{ px: { xs: 2, sm: 3, md: 4, xl: 5 }, pb: 3, maxWidth: 1600, mx: 'auto' }}>
          <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.6 }}>
            {table.noInvoiceTransactions.length} transaction(s) with no invoice expected
          </Typography>
        </Box>
      )}

      <MatchDetailsModal open={matchDetailsDialog.open} match={matchDetailsDialog.match} invoice={matchDetailsDialog.invoice} transaction={matchDetailsDialog.transaction} loading={matchDetailsDialog.loading} error={matchDetailsDialog.error} onClose={closeMatchDetails} />

      <Dialog open={unmatchDialog.open} onClose={() => setUnmatchDialog({ open: false, matchId: null })}>
        <DialogTitle>Remove Match</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to unmatch these items?</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setUnmatchDialog({ open: false, matchId: null })}>Cancel</Button>
          <Button onClick={handleUnmatch} color="error" variant="contained">Unmatch</Button>
        </DialogActions>
      </Dialog>

      <InvoiceVerificationModal key={invoiceModal.file?.id || 'empty'} open={invoiceModal.open} onClose={() => setInvoiceModal({ open: false, file: null })} onSave={handleSaveInvoiceVerification} initialData={invoiceModal.file?.extractedData} fileName={invoiceModal.file?.name} fileType={invoiceModal.file?.sourceInvoice?.fileType || invoiceModal.file?.sourceInvoice?.file_type || null} invoiceId={invoiceModal.file?.existingInvoiceId || null} token={token} localFile={invoiceModal.file?.file || null} extractionMethod={invoiceModal.file?.serverResponse?.extractedData?.extractionMethod} saving={invoiceSaving} />

      <UndoSnackbar pending={undoManager.pending} onUndo={handleUndo} onDismiss={undoManager.dismiss} />

      <AutoMatchPreviewModal open={autoPreviewOpen} onClose={() => setAutoPreviewOpen(false)} onConfirm={handleAutoConfirm} previewData={autoPreviewData} loading={autoPreviewLoading} />
    </>
  )
}

export default MatchesPage
