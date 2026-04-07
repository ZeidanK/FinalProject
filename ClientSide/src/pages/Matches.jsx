import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import PropTypes from 'prop-types'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import { motion, AnimatePresence } from 'framer-motion'
import PageSectionLayout from '../components/PageSectionLayout'
import PageHeaderCard from '../components/PageHeaderCard'
import SnackbarAlert from '../components/SnackbarAlert'
import InvoiceVerificationModal from '../components/InvoiceVerificationModal'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import { getInvoiceById, updateInvoice } from '../services/invoices'
import { mapExtractedToForm } from '../utils/invoiceExtraction'
import { itemVariants } from '../utils/motionVariants'
import { invoiceKeys, matchKeys, transactionKeys } from '../queries/queryKeys'
import {
  useAutoMatchOnLoadMutation,
  useCreateMatchMutation,
  useDeleteMatchMutation,
  useMatchSuggestionsQuery,
  useMatchesByCompanyQuery,
  useSimpleSuggestionsQuery,
  useUnmatchedInvoicesQuery,
  useUnmatchedTransactionsQuery,
} from '../hooks/queries/useMatchesQueries'

const cardBaseSx = {
  borderRadius: 3,
  border: '1px solid',
  borderColor: 'divider',
  background: 'linear-gradient(160deg, rgba(14,24,42,0.96), rgba(10,18,34,0.96))',
}

// --------------- helper ---------------
const fmtAmount = (v) =>
  (Number(v) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const fmtCurrency = (v, currency = 'USD') => {
  try {
    return (Number(v) || 0).toLocaleString(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  } catch {
    return `${currency} ${fmtAmount(v)}`
  }
}

const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
}

const toDateInput = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value.includes('T') ? value.split('T')[0] : value.slice(0, 10)
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
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

function SelectionPanel({
  icon,
  title,
  count,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  loading,
  emptyMessage,
  items,
  selectedId,
  onSelect,
  renderPrimary,
  renderSecondary,
  renderAmount,
  renderDate,
  renderActions,
}) {
  const PanelIcon = icon
  let panelContent

  if (loading) {
    panelContent = (
      <Stack spacing={1}>
        {['list-skeleton-1', 'list-skeleton-2', 'list-skeleton-3', 'list-skeleton-4'].map((skeletonKey) => (
          <Skeleton key={skeletonKey} variant="rectangular" height={64} sx={{ borderRadius: 2 }} />
        ))}
      </Stack>
    )
  } else if (items.length === 0) {
    panelContent = (
      <Stack alignItems="center" sx={{ py: 4 }}>
        <InboxRoundedIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
        <Typography color="text.secondary" variant="body2">
          {emptyMessage}
        </Typography>
      </Stack>
    )
  } else {
    panelContent = (
      <Stack spacing={1}>
        <AnimatePresence>
          {items.map((item) => {
            const id = item.id
            const isSelected = id === selectedId
            return (
              <Box
                key={id}
                component={motion.div}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                onClick={() => onSelect(isSelected ? null : id)}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected ? 'rgba(88,166,255,0.08)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: isSelected ? 'primary.main' : 'rgba(88,166,255,0.4)',
                    bgcolor: 'rgba(88,166,255,0.05)',
                  },
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {renderPrimary(item)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {renderSecondary(item)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={700}>
                    {renderAmount(item)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {renderDate(item)}
                </Typography>
                {renderActions ? (
                  <Box sx={{ mt: 1 }}>
                    {renderActions(item)}
                  </Box>
                ) : null}
              </Box>
            )
          })}
        </AnimatePresence>
      </Stack>
    )
  }

  return (
    <Card component={motion.div} variants={itemVariants} elevation={0} sx={cardBaseSx}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <PanelIcon sx={{ color: '#a9d5ff' }} />
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
          <Chip label={count} size="small" />
        </Stack>

        <TextField
          placeholder={searchPlaceholder}
          size="small"
          fullWidth
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2 }}
        />

        <Box sx={{ maxHeight: 380, overflowY: 'auto', pr: 0.5 }}>{panelContent}</Box>
      </CardContent>
    </Card>
  )
}

SelectionPanel.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  searchPlaceholder: PropTypes.string.isRequired,
  searchValue: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  emptyMessage: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  selectedId: PropTypes.number,
  onSelect: PropTypes.func.isRequired,
  renderPrimary: PropTypes.func.isRequired,
  renderSecondary: PropTypes.func.isRequired,
  renderAmount: PropTypes.func.isRequired,
  renderDate: PropTypes.func.isRequired,
  renderActions: PropTypes.func,
}

SelectionPanel.defaultProps = {
  selectedId: null,
  renderActions: null,
}

// ── Quick Match Suggestions component ──────────────────────────────────────

function QuickMatchSuggestions({ query, deniedPairs, onDeny, onConfirm, matchBusy, invoices, transactions }) {
  const rawSuggestions = Array.isArray(query.data) ? query.data : []
  const suggestions = rawSuggestions.filter(
    (s) => !deniedPairs.has(`${s.invoiceId}-${s.transactionId}`),
  )

  return (
    <Card
      component={motion.div}
      variants={itemVariants}
      elevation={0}
      sx={{
        ...cardBaseSx,
        borderColor: 'rgba(55,214,122,0.35)',
        background: 'linear-gradient(135deg, rgba(14,30,22,0.96), rgba(10,20,16,0.96))',
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <CompareArrowsRoundedIcon sx={{ color: '#37d67a' }} />
          <Typography variant="subtitle1" fontWeight={700}>
            Quick Match Suggestions
          </Typography>
          <Chip
            label={suggestions.length}
            size="small"
            sx={{ bgcolor: 'rgba(55,214,122,0.15)', color: '#37d67a' }}
          />
          <Typography variant="caption" color="text.secondary">
            Same date &amp; exact amount
          </Typography>
        </Stack>

        {query.isLoading && (
          <Stack spacing={1}>
            {['qs-1', 'qs-2', 'qs-3'].map((k) => (
              <Skeleton key={k} variant="rectangular" height={72} sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
        )}
        {!query.isLoading && suggestions.length === 0 && (
          <Stack alignItems="center" sx={{ py: 3 }}>
            <InboxRoundedIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No current suggestions.
            </Typography>
          </Stack>
        )}
        {!query.isLoading && suggestions.length > 0 && (
          <Stack spacing={1.5}>
            <AnimatePresence>
              {suggestions.map((s) => {
                const pairKey = `${s.invoiceId}-${s.transactionId}`
                const _inv = invoices.find((i) => i.id === s.invoiceId)
                const _trx = transactions.find((t) => t.id === s.transactionId)
                const invCurrency = _inv?.currency || 'USD'
                const trxCurrency = _trx?.charge_currency || _trx?.chargeCurrency || invCurrency
                return (
                  <Box
                    key={pairKey}
                    component={motion.div}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      alignItems={{ sm: 'center' }}
                      justifyContent="space-between"
                      spacing={2}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'rgba(55,214,122,0.2)',
                        bgcolor: 'rgba(55,214,122,0.04)',
                      }}
                    >
                      {/* Invoice side */}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Invoice
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {s.invoiceNumber || `#${s.invoiceId}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.vendorName || '—'}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {fmtDate(s.invoiceDate)}
                          </Typography>
                          <Typography variant="caption" fontWeight={700} sx={{ color: '#37d67a' }}>
                            {fmtCurrency(s.invoiceAmount, invCurrency)}
                          </Typography>
                        </Stack>
                      </Box>

                      <CompareArrowsRoundedIcon sx={{ color: 'rgba(55,214,122,0.5)', flexShrink: 0 }} />

                      {/* Transaction side */}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Transaction
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {(_trx?.vendor_name || _trx?.vendorName || s.transactionDescription) || `#${s.transactionId}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.transactionType || '—'}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {fmtDate(s.transactionDate)}
                          </Typography>
                          <Typography variant="caption" fontWeight={700} sx={{ color: '#37d67a' }}>
                            {fmtCurrency(s.transactionAmount, trxCurrency)}
                          </Typography>
                        </Stack>
                      </Box>

                      {/* Actions */}
                      <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => onDeny(s.invoiceId, s.transactionId)}
                          disabled={matchBusy}
                        >
                          Deny
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleRoundedIcon fontSize="small" />}
                          onClick={() => onConfirm(s)}
                          disabled={matchBusy}
                        >
                          Confirm
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                )
              })}
            </AnimatePresence>
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

QuickMatchSuggestions.propTypes = {
  query: PropTypes.object.isRequired,
  deniedPairs: PropTypes.instanceOf(Set).isRequired,
  onDeny: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  matchBusy: PropTypes.bool.isRequired,
  invoices: PropTypes.array.isRequired,
  transactions: PropTypes.array.isRequired,
}

function MatchesPage() {
  const { token } = useAuth()
  const { activeCompanyId } = useCompany()
  const queryClient = useQueryClient()

  // ----- Data state -----
  const [invoices, setInvoices] = useState([])
  const [transactions, setTransactions] = useState([])
  const [matches, setMatches] = useState([])
  const [suggestions, setSuggestions] = useState([])

  // ----- Selection state -----
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null)
  const [selectedTransactionId, setSelectedTransactionId] = useState(null)

  // ----- Search state -----
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [transactionSearch, setTransactionSearch] = useState('')

  // ----- Loading / Error / Snack -----
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [matchBusy, setMatchBusy] = useState(false)
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' })
  const [invoiceModal, setInvoiceModal] = useState({ open: false, file: null })
  const [invoiceSaving, setInvoiceSaving] = useState(false)
  const [reopeningInvoiceId, setReopeningInvoiceId] = useState(null)

  // ----- Unmatch confirmation dialog -----
  const [unmatchDialog, setUnmatchDialog] = useState({ open: false, matchId: null })

  // ----- Simple suggestions denied pairs (session-only) -----
  const [deniedPairs, setDeniedPairs] = useState(new Set())

  // ----- Prevent double auto-match in StrictMode -----
  const autoMatchRanRef = useRef(false)

  const matchesQuery = useMatchesByCompanyQuery({ companyId: activeCompanyId, token })
  const invoicesQuery = useUnmatchedInvoicesQuery({ companyId: activeCompanyId, token })
  const transactionsQuery = useUnmatchedTransactionsQuery({ companyId: activeCompanyId, token })
  const createMatchMutation = useCreateMatchMutation({ companyId: activeCompanyId, token })
  const deleteMatchMutation = useDeleteMatchMutation({ companyId: activeCompanyId, token })
  const autoMatchMutation = useAutoMatchOnLoadMutation({ companyId: activeCompanyId, token })
  const suggestionsQuery = useMatchSuggestionsQuery({
    invoiceId: selectedInvoiceId,
    token,
    enabled: Boolean(selectedInvoiceId),
  })
  const simpleSuggestionsQuery = useSimpleSuggestionsQuery({ companyId: activeCompanyId, token })

  const getConfidenceChipColor = (confidence) => {
    if (confidence >= 0.8) return 'success'
    if (confidence >= 0.5) return 'warning'
    return 'default'
  }

  // ===================== Data Fetching =====================

  const loadData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: matchKeys.all }),
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all }),
      queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
    ])
  }, [queryClient])

  useEffect(() => {
    setInvoices(Array.isArray(invoicesQuery.data) ? invoicesQuery.data : [])
  }, [invoicesQuery.data])

  useEffect(() => {
    setTransactions(Array.isArray(transactionsQuery.data) ? transactionsQuery.data : [])
  }, [transactionsQuery.data])

  useEffect(() => {
    setMatches(Array.isArray(matchesQuery.data) ? matchesQuery.data : [])
  }, [matchesQuery.data])

  useEffect(() => {
    const nextError =
      matchesQuery.error?.message ||
      invoicesQuery.error?.message ||
      transactionsQuery.error?.message ||
      ''

    setError(nextError)
    setLoading(
      matchesQuery.isLoading ||
      invoicesQuery.isLoading ||
      transactionsQuery.isLoading,
    )
  }, [
    invoicesQuery.error,
    invoicesQuery.isLoading,
    matchesQuery.error,
    matchesQuery.isLoading,
    transactionsQuery.error,
    transactionsQuery.isLoading,
  ])

  // Auto-match once on mount
  useEffect(() => {
    if (autoMatchRanRef.current) return
    autoMatchRanRef.current = true

    const runAutoMatch = async () => {
      try {
        const matchResult = await autoMatchMutation.mutateAsync({ minConfidence: 70 })
        if (matchResult?.successfulMatches > 0) {
          setSnack({
            open: true,
            message: `✓ ${matchResult.successfulMatches} automatic match(es) found`,
            severity: 'success',
          })
        }
      } catch (matchErr) {
        console.warn('[MATCH] Auto-match on load failed:', matchErr)
      }
    }
    runAutoMatch()
  }, [autoMatchMutation, loadData])

  useEffect(() => {
    setSuggestions(Array.isArray(suggestionsQuery.data) ? suggestionsQuery.data : [])
  }, [suggestionsQuery.data])

  // ===================== Handlers =====================

  const handleCreateMatch = useCallback(async () => {
    if (!selectedInvoiceId || !selectedTransactionId) return
    const inv = invoices.find((i) => i.id === selectedInvoiceId)
    const trx = transactions.find((t) => t.id === selectedTransactionId)
    if (!inv || !trx) return

    setMatchBusy(true)
    try {
      await createMatchMutation.mutateAsync({
        invoiceId: inv.id,
        transactionId: trx.id,
        matchedAmount: Math.min(
          Math.abs(Number(inv.total_amount ?? inv.totalAmount) || 0),
          Math.abs(Number(trx.amount) || 0),
        ),
        matchMethod: 'manual',
        matchType: 'full',
        matchConfidence: 1,
      })
      setSelectedInvoiceId(null)
      setSelectedTransactionId(null)
      setSuggestions([])
      setSnack({ open: true, message: 'Match created successfully!', severity: 'success' })
    } catch (err) {
      setSnack({ open: true, message: err.message || 'Failed to create match.', severity: 'error' })
    } finally {
      setMatchBusy(false)
    }
  }, [selectedInvoiceId, selectedTransactionId, invoices, transactions, createMatchMutation])

  const confirmUnmatch = useCallback((matchId) => {
    setUnmatchDialog({ open: true, matchId })
  }, [])

  const handleUnmatch = useCallback(async () => {
    const matchId = unmatchDialog.matchId
    setUnmatchDialog({ open: false, matchId: null })
    if (!matchId) return
    try {
      await deleteMatchMutation.mutateAsync(matchId)
      setSnack({ open: true, message: 'Match removed.', severity: 'success' })
    } catch (err) {
      setSnack({ open: true, message: err.message || 'Failed to remove match.', severity: 'error' })
    }
  }, [unmatchDialog.matchId, deleteMatchMutation])

  const handleAcceptSuggestion = useCallback((transactionId) => {
    setSelectedTransactionId(transactionId)
  }, [])

  const openInvoiceForEditing = useCallback(
    async (invoiceId) => {
      if (!invoiceId) return
      setReopeningInvoiceId(invoiceId)
      try {
        const invoice = await getInvoiceById(invoiceId, token)
        const extractedData = mapSavedInvoiceToForm(invoice)
        setInvoiceModal({
          open: true,
          file: {
            id: `saved-${invoice.id}`,
            name:
              invoice.fileOriginalName ||
              invoice.file_original_name ||
              `Invoice ${invoice.invoiceNumber || invoice.invoice_number || invoice.id}`,
            extractedData,
            existingInvoiceId: invoice.id,
            sourceInvoice: invoice,
          },
        })
      } catch (err) {
        setSnack({
          open: true,
          message: err.message || 'Failed to open invoice for editing.',
          severity: 'error',
        })
      } finally {
        setReopeningInvoiceId(null)
      }
    },
    [token],
  )

  const handleSaveInvoiceVerification = useCallback(
    async (formData) => {
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
          paymentPlanTotalInstallments:
            sourceInvoice.paymentPlanTotalInstallments ||
            sourceInvoice.payment_plan_total_installments ||
            null,
          paymentPlanInstallmentAmount:
            sourceInvoice.paymentPlanInstallmentAmount ||
            sourceInvoice.payment_plan_installment_amount ||
            null,
          paymentPlanFrequency:
            sourceInvoice.paymentPlanFrequency || sourceInvoice.payment_plan_frequency || null,
          paymentPlanDescription:
            sourceInvoice.paymentPlanDescription ||
            sourceInvoice.payment_plan_description ||
            null,
          fileOriginalName: sourceInvoice.fileOriginalName || sourceInvoice.file_original_name || null,
          filePath: sourceInvoice.filePath || sourceInvoice.file_path || null,
          fileType: sourceInvoice.fileType || sourceInvoice.file_type || null,
          fileSize: sourceInvoice.fileSize || sourceInvoice.file_size || null,
          aiExtractionConfidence:
            sourceInvoice.aiExtractionConfidence || sourceInvoice.ai_extraction_confidence || null,
          lineItems: (formData.lineItems || []).map((li, idx) => ({
            description: li.description || 'Item',
            unitPrice: Number.parseFloat(li.unitPrice) || 0,
            totalAmount: Number.parseFloat(li.totalAmount) || 0,
            lineNumber: idx + 1,
            quantity: Number.parseFloat(li.quantity) || 1,
            vatRate: Number.parseFloat(formData.vatRate?.value) || null,
            aiConfidenceScore: li.confidence ?? null,
          })),
        }

        await updateInvoice(editingInvoiceId, payload, token)
        setInvoiceModal({ open: false, file: null })
        setSnack({ open: true, message: 'Invoice updated successfully!', severity: 'success' })

        setSelectedInvoiceId(null)
        setSelectedTransactionId(null)
        setSuggestions([])
        await loadData()
      } catch (err) {
        setSnack({
          open: true,
          message: err.message || 'Failed to save invoice.',
          severity: 'error',
        })
      } finally {
        setInvoiceSaving(false)
      }
    },
    [invoiceModal.file, activeCompanyId, token, loadData],
  )

  // ===================== Filtered lists =====================

  const filteredInvoices = invoices.filter((inv) => {
    const q = invoiceSearch.toLowerCase()
    if (!q) return true
    const vendor = (inv.vendor_name || inv.vendorName || '').toLowerCase()
    const num = (inv.invoice_number || inv.invoiceNumber || '').toLowerCase()
    return vendor.includes(q) || num.includes(q)
  })

  const filteredTransactions = transactions.filter((trx) => {
    const q = transactionSearch.toLowerCase()
    if (!q) return true
    return (trx.description || '').toLowerCase().includes(q)
  })

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId)
  const selectedTransaction = transactions.find((t) => t.id === selectedTransactionId)

  let matchedItemsContent
  if (loading) {
    matchedItemsContent = (
      <Stack spacing={1}>
        {['match-skeleton-1', 'match-skeleton-2', 'match-skeleton-3'].map((skeletonKey) => (
          <Skeleton key={skeletonKey} variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
        ))}
      </Stack>
    )
  } else if (matches.length === 0) {
    matchedItemsContent = (
      <Stack alignItems="center" sx={{ py: 5 }}>
        <CompareArrowsRoundedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography color="text.secondary">
          No matches yet. Select an invoice and a transaction above to create one.
        </Typography>
      </Stack>
    )
  } else {
    matchedItemsContent = (
      <Stack spacing={1}>
        <AnimatePresence>
          {matches.map((m) => {
            const id = m.id
            const invLabel =
              m.invoice_number || m.invoiceNumber || `Invoice #${m.invoice_id ?? m.invoiceId ?? '?'}`
            const trxLabel =
              m.transaction_vendor_name ||
              m.transactionVendorName ||
              m.transaction_description ||
              m.transactionDescription ||
              `Transaction #${m.transaction_id ?? m.transactionId ?? '?'}`
            const amount = Number(m.matched_amount ?? m.matchedAmount) || 0
            const method = m.match_method || m.matchMethod || '—'
            const confidence = Number(m.match_confidence ?? m.matchConfidence ?? 0)

            return (
              <Stack
                key={id}
                component={motion.div}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ sm: 'center' }}
                justifyContent="space-between"
                spacing={1}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(55,214,122,0.05)',
                  border: '1px solid',
                  borderColor: 'rgba(55,214,122,0.25)',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1 }}>
                  <CheckCircleRoundedIcon sx={{ color: 'success.main' }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {invLabel} ↔ {trxLabel}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.3 }}>
                      <Typography variant="caption" color="text.secondary">
                        Amount: {fmtAmount(amount)}
                      </Typography>
                      <Chip label={method} size="small" variant="outlined" />
                      {confidence > 0 && (
                        <Chip
                          label={`${Math.round(confidence * 100)}%`}
                          size="small"
                          color={confidence >= 0.8 ? 'success' : 'warning'}
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Box>
                </Stack>
                <Tooltip title="Remove match">
                  <IconButton
                    size="small"
                    onClick={() => confirmUnmatch(id)}
                    sx={{ color: 'error.main' }}
                  >
                    <LinkOffRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            )
          })}
        </AnimatePresence>
      </Stack>
    )
  }

  // ===================== Render =====================

  return (
    <>
      <PageSectionLayout>
          <PageHeaderCard
            title="Matches"
            description="Match invoices to bank transactions for reconciliation."
            onRefresh={loadData}
            refreshDisabled={loading}
            variants={itemVariants}
          />

          {/* ---- Stats Cards ---- */}
          <Grid
            container
            spacing={2}
            component={motion.div}
            variants={itemVariants}
          >
            {[
              { label: 'Unmatched Invoices', value: invoices.length, color: '#f59e0b' },
              { label: 'Unmatched Transactions', value: transactions.length, color: '#f59e0b' },
              { label: 'Total Matches', value: matches.length, color: '#37d67a' },
              {
                label: 'Total Matched',
                value: fmtAmount(
                  matches.reduce(
                    (sum, m) => sum + (Number(m.matched_amount ?? m.matchedAmount) || 0),
                    0,
                  ),
                ),
                color: '#58a6ff',
                prefix: '$',
              },
            ].map((stat) => (
              <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
                <Card elevation={0} sx={cardBaseSx}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {stat.label}
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      sx={{ color: stat.color, mt: 0.5 }}
                    >
                      {stat.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* ---- Error Alert ---- */}
          {error && (
            <Alert
              severity="error"
              variant="outlined"
              onClose={() => setError('')}
              action={
                <Button color="inherit" size="small" onClick={loadData}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          {/* ---- AI Suggestions ---- */}
          {suggestions.length > 0 && (
            <Card
              component={motion.div}
              variants={itemVariants}
              elevation={0}
              sx={{
                ...cardBaseSx,
                borderColor: 'rgba(88,166,255,0.35)',
                background:
                  'linear-gradient(135deg, rgba(20,35,65,0.96), rgba(12,22,42,0.96))',
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <AutoFixHighRoundedIcon sx={{ color: '#58a6ff' }} />
                  <Typography variant="subtitle1" fontWeight={700}>
                    AI Suggestions
                  </Typography>
                </Stack>
                <Stack spacing={1.5}>
                  {suggestions.map((s) => {
                    const trxId = s.id ?? s.transaction_id ?? s.transactionId
                    const rawScore = Number(s.matchScore ?? s.match_score ?? s.match_confidence ?? s.matchConfidence ?? 0)
                    // matchScore from backend is 0-100 (Gemini similarity %)
                    const confidence = rawScore > 1 ? rawScore / 100 : rawScore
                    const desc = s.description ?? s.transaction_description ?? s.transactionDescription ?? `Transaction #${trxId}`
                    const amt = Number(s.amount ?? s.transaction_amount ?? s.transactionAmount ?? 0)
                    return (
                      <Stack
                        key={trxId}
                        direction={{ xs: 'column', sm: 'row' }}
                        alignItems={{ sm: 'center' }}
                        justifyContent="space-between"
                        spacing={1}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'rgba(255,255,255,0.03)',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1 }}>
                          <Chip
                            label={`${Math.round(confidence * 100)}%`}
                            size="small"
                            color={getConfidenceChipColor(confidence)}
                          />
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {desc}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Amount: {fmtAmount(amt)}
                            </Typography>
                          </Box>
                        </Stack>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleAcceptSuggestion(trxId)}
                        >
                          Select
                        </Button>
                      </Stack>
                    )
                  })}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* ---- Two-Panel Matching Interface ---- */}
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SelectionPanel
                icon={ReceiptLongRoundedIcon}
                title="Unmatched Invoices"
                count={filteredInvoices.length}
                searchPlaceholder="Search by vendor or invoice #…"
                searchValue={invoiceSearch}
                onSearchChange={setInvoiceSearch}
                loading={loading}
                emptyMessage={invoiceSearch ? 'No invoices match your search.' : 'All invoices are matched!'}
                items={filteredInvoices}
                selectedId={selectedInvoiceId}
                onSelect={setSelectedInvoiceId}
                renderPrimary={(inv) => inv.invoice_number || inv.invoiceNumber || '—'}
                renderSecondary={(inv) => inv.vendor_name || inv.vendorName || '—'}
                renderAmount={(inv) => fmtAmount(inv.total_amount ?? inv.totalAmount)}
                renderDate={(inv) => fmtDate(inv.invoice_date || inv.invoiceDate)}
                renderActions={(inv) => (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={
                      reopeningInvoiceId === inv.id ? <CheckCircleRoundedIcon fontSize="small" /> : <EditRoundedIcon fontSize="small" />
                    }
                    onClick={(event) => {
                      event.stopPropagation()
                      openInvoiceForEditing(inv.id)
                    }}
                    disabled={reopeningInvoiceId === inv.id}
                  >
                    {reopeningInvoiceId === inv.id ? 'Opening...' : 'Reopen'}
                  </Button>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <SelectionPanel
                icon={AccountBalanceRoundedIcon}
                title="Unmatched Transactions"
                count={filteredTransactions.length}
                searchPlaceholder="Search by description…"
                searchValue={transactionSearch}
                onSearchChange={setTransactionSearch}
                loading={loading}
                emptyMessage={
                  transactionSearch
                    ? 'No transactions match your search.'
                    : 'All transactions are matched!'
                }
                items={filteredTransactions}
                selectedId={selectedTransactionId}
                onSelect={setSelectedTransactionId}
                renderPrimary={(trx) => trx.vendor_name || trx.vendorName || trx.description || '—'}
                renderSecondary={(trx) => trx.type || trx.transaction_type || ''}
                renderAmount={(trx) => fmtAmount(trx.amount)}
                renderDate={(trx) => fmtDate(trx.transaction_date || trx.transactionDate)}
              />
            </Grid>
          </Grid>

          {/* ---- Match Action Bar ---- */}
          {(selectedInvoiceId || selectedTransactionId) && (
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              elevation={0}
              sx={{
                ...cardBaseSx,
                borderColor: 'primary.main',
                background:
                  'linear-gradient(135deg, rgba(20,35,65,0.97), rgba(12,22,42,0.97))',
              }}
            >
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ sm: 'center' }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
                    <Box sx={{ textAlign: 'center', minWidth: 100 }}>
                      <Typography variant="caption" color="text.secondary">
                        Invoice
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedInvoice
                          ? selectedInvoice.invoice_number || selectedInvoice.invoiceNumber || '—'
                          : 'None'}
                      </Typography>
                    </Box>
                    <CompareArrowsRoundedIcon sx={{ color: 'text.secondary' }} />
                    <Box sx={{ textAlign: 'center', minWidth: 100 }}>
                      <Typography variant="caption" color="text.secondary">
                        Transaction
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedTransaction
                          ? selectedTransaction.vendor_name || selectedTransaction.vendorName || selectedTransaction.description || `#${selectedTransaction.id}`
                          : 'None'}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1.5}>
                    <Button
                      variant="text"
                      onClick={() => {
                        setSelectedInvoiceId(null)
                        setSelectedTransactionId(null)
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<CheckCircleRoundedIcon />}
                      disabled={!selectedInvoiceId || !selectedTransactionId || matchBusy}
                      onClick={handleCreateMatch}
                    >
                      {matchBusy ? 'Matching…' : 'Create Match'}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* ---- Matched Items ---- */}
          <Card
            component={motion.div}
            variants={itemVariants}
            elevation={0}
            sx={cardBaseSx}
          >
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Matched Items ({matches.length})
              </Typography>

              {matchedItemsContent}
            </CardContent>
          </Card>

          {/* ---- Quick Match Suggestions ---- */}
          <QuickMatchSuggestions
            query={simpleSuggestionsQuery}
            deniedPairs={deniedPairs}
            invoices={invoices}
            transactions={transactions}
            onDeny={(invoiceId, transactionId) =>
              setDeniedPairs((prev) => new Set([...prev, `${invoiceId}-${transactionId}`]))
            }
            onConfirm={async (suggestion) => {
              setMatchBusy(true)
              try {
                await createMatchMutation.mutateAsync({
                  invoiceId: suggestion.invoiceId,
                  transactionId: suggestion.transactionId,
                  matchedAmount: suggestion.invoiceAmount,
                  matchMethod: 'simple',
                  matchType: 'full',
                  matchConfidence: 1,
                })
                setSnack({ open: true, message: 'Match confirmed!', severity: 'success' })
              } catch (err) {
                setSnack({ open: true, message: err.message || 'Failed to create match.', severity: 'error' })
              } finally {
                setMatchBusy(false)
              }
            }}
            matchBusy={matchBusy}
          />
      </PageSectionLayout>

      {/* ---- Unmatch Confirmation Dialog ---- */}
      <Dialog
        open={unmatchDialog.open}
        onClose={() => setUnmatchDialog({ open: false, matchId: null })}
      >
        <DialogTitle>Remove Match</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to unmatch these items? Both the invoice and
            transaction will return to the unmatched lists.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnmatchDialog({ open: false, matchId: null })}>
            Cancel
          </Button>
          <Button onClick={handleUnmatch} color="error" variant="contained">
            Unmatch
          </Button>
        </DialogActions>
      </Dialog>

      <InvoiceVerificationModal
        key={invoiceModal.file?.id || 'empty'}
        open={invoiceModal.open}
        onClose={() => setInvoiceModal({ open: false, file: null })}
        onSave={handleSaveInvoiceVerification}
        initialData={invoiceModal.file?.extractedData}
        fileName={invoiceModal.file?.name}
        extractionMethod={null}
        saving={invoiceSaving}
      />

      {/* ---- Snackbar ---- */}
      <SnackbarAlert
        open={snack.open}
        message={snack.message}
        severity={snack.severity}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      />
    </>
  )
}

export default MatchesPage
