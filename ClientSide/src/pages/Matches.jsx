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
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Pagination,
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
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import MoneyOffRoundedIcon from '@mui/icons-material/MoneyOffRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { AnimatePresence, motion } from 'framer-motion'
import AnimatedBackground from '../components/AnimatedBackground'
import RevealOnScroll from '../components/RevealOnScroll'
import PageHeaderCard from '../components/PageHeaderCard'
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
import { cardBaseSx } from '../utils/sharedStyles'
import { fmtAmount, fmtDate, toDateInput } from '../utils/formatters'
import { getInstallmentSuggestionAmount } from '../utils/matchAmounts'
import { containerVariants, itemVariants } from '../utils/motionVariants'
import { invoiceKeys, matchKeys, transactionKeys } from '../queries/queryKeys'
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

const ROWS_PER_PAGE = 10

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
        totalInstallments:
          invoice?.paymentPlanTotalInstallments ?? invoice?.payment_plan_total_installments ?? null,
        installmentAmount:
          invoice?.paymentPlanInstallmentAmount ?? invoice?.payment_plan_installment_amount ?? null,
        frequency: invoice?.paymentPlanFrequency ?? invoice?.payment_plan_frequency ?? null,
        currentInstallment:
          invoice?.paymentPlanCurrentInstallment ?? invoice?.payment_plan_current_installment ?? null,
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
  const [page, setPage] = useState(0)

  useEffect(() => { setPage(0) }, [items.length])

  const pageCount = Math.max(1, Math.ceil(items.length / ROWS_PER_PAGE))
  const paginatedItems = items.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE)

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
          {paginatedItems.map((item) => {
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(isSelected ? null : id)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
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
                  '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: 2,
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
        {items.length > ROWS_PER_PAGE && (
          <Stack direction="row" justifyContent="center" sx={{ pt: 1 }}>
            <Pagination
              count={pageCount}
              page={page + 1}
              onChange={(_, p) => setPage(p - 1)}
              size="small"
              siblingCount={0}
            />
          </Stack>
        )}
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

        <Box sx={{ maxHeight: 380, overflowY: 'auto', pr: 0.5 }} aria-live="polite" aria-label={`${title} list`}>
          {panelContent}
        </Box>
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

const dash = '\u2014'

const readFields = (source, keys) => {
  if (!source) return null
  for (const key of keys) {
    const value = source[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return null
}

const readField = (source, snakeKey, camelKey) =>
  readFields(source, [snakeKey, camelKey])

const displayText = (value) => {
  if (value === 0) return '0'
  return value == null || value === '' ? dash : String(value)
}

const formatMatchConfidence = (value) => {
  if (value == null || value === '') return dash
  const number = Number(value)
  if (Number.isNaN(number)) return dash
  return `${Math.round(number <= 1 ? number * 100 : number)}%`
}

const formatOptionalAmount = (value) =>
  value == null || value === '' ? dash : fmtAmount(value)

function DetailField({ label, value }) {
  return (
    <Box
      sx={{
        px: 1,
        py: 0.7,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'rgba(255,255,255,0.02)',
        minHeight: 0,
        display: 'flex',
        alignItems: 'baseline',
        gap: 1,
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: 'uppercase', fontSize: 10, minWidth: 86, flexShrink: 0, lineHeight: 1.25 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-word', lineHeight: 1.35 }}>
        {value}
      </Typography>
    </Box>
  )
}

DetailField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
}

function DetailSection({ title, children }) {
  return (
    <Card elevation={0} sx={{ bgcolor: 'rgba(255,255,255,0.025)', border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.9 }}>
          {title}
        </Typography>
        <Grid container spacing={0.75}>
          {children}
        </Grid>
      </CardContent>
    </Card>
  )
}

DetailSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

function MatchDetailsDialog({ open, match, invoice, transaction, loading, error, onClose }) {
  const invoiceId = readField(invoice, 'id', 'id') ?? readField(match, 'invoice_id', 'invoiceId')
  const invoiceNumber = readField(invoice, 'invoice_number', 'invoiceNumber') ?? readField(match, 'invoice_number', 'invoiceNumber')
  const invoiceVendor = readField(invoice, 'vendor_name', 'vendorName') ?? readField(match, 'vendor_name', 'vendorName')
  const invoiceAmount =
    readFields(invoice, ['total_amount', 'totalAmount', 'invoice_amount', 'invoiceAmount']) ??
    readField(match, 'invoice_amount', 'invoiceAmount')
  const invoiceDate = readField(invoice, 'invoice_date', 'invoiceDate') ?? readField(match, 'invoice_date', 'invoiceDate')
  const invoiceDueDate = readField(invoice, 'due_date', 'dueDate')
  const invoiceStatus = readField(invoice, 'status', 'status')
  const invoiceCurrency = readField(invoice, 'currency', 'currency')
  const invoiceCardLast4 = readField(invoice, 'last_four_digits_card', 'lastFourDigitsCard')
  const transactionId = readField(transaction, 'id', 'id') ?? readField(match, 'transaction_id', 'transactionId')
  const transactionVendor =
    readField(transaction, 'vendor_name', 'vendorName') ??
    readField(match, 'transaction_vendor_name', 'transactionVendorName')
  const transactionDescription =
    readField(transaction, 'description', 'description') ??
    readField(match, 'transaction_description', 'transactionDescription')
  const transactionDate =
    readField(transaction, 'transaction_date', 'transactionDate') ??
    readField(match, 'transaction_date', 'transactionDate')
  const transactionAmount =
    readField(transaction, 'amount', 'amount') ??
    readField(match, 'transaction_amount', 'transactionAmount')
  const transactionType =
    readField(transaction, 'transaction_type', 'transactionType') ??
    readField(match, 'transaction_type', 'transactionType')
  const transactionPostedDate = readField(transaction, 'posted_date', 'postedDate')
  const transactionChargeAmount = readField(transaction, 'charge_amount', 'chargeAmount')
  const transactionReference = readField(transaction, 'reference_number', 'referenceNumber')
  const transactionCategory = readField(transaction, 'category', 'category')
  const transactionCardLast4 = readField(transaction, 'card_last4', 'cardLast4')
  const matchedAmount = readField(match, 'matched_amount', 'matchedAmount')
  const matchType = readField(match, 'match_type', 'matchType')
  const matchMethod = readField(match, 'match_method', 'matchMethod')
  const matchConfidence = readField(match, 'match_confidence', 'matchConfidence')
  const matchReason = readField(match, 'match_reason', 'matchReason')
  const matchedBy = readField(match, 'matched_by_name', 'matchedByName')
  const matchedByUserId = readField(match, 'matched_by_user_id', 'matchedByUserId')
  const installmentNumber = readField(match, 'installment_number', 'installmentNumber')
  const installmentNote = readField(match, 'installment_note', 'installmentNote')
  const createdAt = readField(match, 'created_at', 'createdAt')
  const updatedAt = readField(match, 'updated_at', 'updatedAt')

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Match Details</DialogTitle>
      <DialogContent dividers sx={{ py: 1.5 }}>
        {!match ? (
          <Typography color="text.secondary">No match selected.</Typography>
        ) : (
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip label={displayText(matchMethod)} size="small" variant="outlined" />
              <Chip label={displayText(matchType)} size="small" variant="outlined" />
              <Chip label={formatMatchConfidence(matchConfidence)} size="small" color="success" variant="outlined" />
              {loading ? <Chip label="Loading details..." size="small" color="info" variant="outlined" /> : null}
            </Stack>
            {error ? <Alert severity="warning" sx={{ py: 0 }}>{error}</Alert> : null}

            <DetailSection title="Match">
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Match ID" value={displayText(match.id)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Matched Amount" value={formatOptionalAmount(matchedAmount)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Matched By" value={matchedBy || (matchedByUserId ? `User #${matchedByUserId}` : dash)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Created" value={fmtDate(createdAt)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Updated" value={fmtDate(updatedAt)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField
                  label="Installment"
                  value={installmentNumber ? `${installmentNumber}${installmentNote ? ` - ${installmentNote}` : ''}` : dash}
                />
              </Grid>
            </DetailSection>

            <DetailSection title="Invoice">
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Invoice ID" value={displayText(invoiceId)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Invoice Number" value={displayText(invoiceNumber)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Vendor" value={displayText(invoiceVendor)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Invoice Date" value={fmtDate(invoiceDate)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Invoice Amount" value={formatOptionalAmount(invoiceAmount)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Due Date" value={fmtDate(invoiceDueDate)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Status" value={displayText(invoiceStatus)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Currency" value={displayText(invoiceCurrency)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Card" value={invoiceCardLast4 ? `**** ${invoiceCardLast4}` : dash} />
              </Grid>
            </DetailSection>

            <DetailSection title="Transaction">
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Transaction ID" value={displayText(transactionId)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Vendor" value={displayText(transactionVendor)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Type" value={displayText(transactionType)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Transaction Date" value={fmtDate(transactionDate)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Transaction Amount" value={formatOptionalAmount(transactionAmount)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Posted Date" value={fmtDate(transactionPostedDate)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Charge Amount" value={formatOptionalAmount(transactionChargeAmount)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Reference" value={displayText(transactionReference)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Category" value={displayText(transactionCategory)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <DetailField label="Card" value={transactionCardLast4 ? `**** ${transactionCardLast4}` : dash} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <DetailField label="Description" value={displayText(transactionDescription)} />
              </Grid>
            </DetailSection>

            {matchReason ? (
              <DetailSection title="Reason">
                <Grid size={{ xs: 12 }}>
                  <DetailField label="Match Reason" value={matchReason} />
                </Grid>
              </DetailSection>
            ) : null}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

MatchDetailsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  match: PropTypes.object,
  invoice: PropTypes.object,
  transaction: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onClose: PropTypes.func.isRequired,
}

function MatchesPage() {
  const { token } = useAuth()
  const { activeCompanyId } = useCompany()
  const queryClient = useQueryClient()

  const [invoices, setInvoices] = useState([])
  const [transactions, setTransactions] = useState([])
  const [matches, setMatches] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [suggestionsInvoiceId, setSuggestionsInvoiceId] = useState(null)

  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null)
  const [selectedTransactionId, setSelectedTransactionId] = useState(null)

  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [transactionSearch, setTransactionSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [matchBusy, setMatchBusy] = useState(false)
  const { notify } = useNotification()
  const setSnack = useCallback(({ message, severity }) => { notify({ message, severity }) }, [notify])
  const [invoiceModal, setInvoiceModal] = useState({ open: false, file: null })
  const [invoiceSaving, setInvoiceSaving] = useState(false)
  const [reopeningInvoiceId, setReopeningInvoiceId] = useState(null)

  const [unmatchDialog, setUnmatchDialog] = useState({ open: false, matchId: null })
  const [matchDetailsDialog, setMatchDetailsDialog] = useState({
    open: false,
    match: null,
    invoice: null,
    transaction: null,
    loading: false,
    error: '',
  })

  const [deniedPairs, setDeniedPairs] = useState(new Set())

  const [deniedInstallmentPairs, setDeniedInstallmentPairs] = useState(new Set())

  const [noInvoiceOpen, setNoInvoiceOpen] = useState(false)

  const [matchedItemsOpen, setMatchedItemsOpen] = useState(false)

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
  const installmentSuggestionsQuery = useInstallmentSuggestionsQuery({ companyId: activeCompanyId, token })

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
    setTransactions(transactionsQuery.data?.items ?? [])
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

  useEffect(() => {
    if (autoMatchRanRef.current) return
    autoMatchRanRef.current = true

    const runAutoMatch = async () => {
      try {
        const matchResult = await autoMatchMutation.mutateAsync({ minConfidence: 70 })
        if (matchResult?.successfulMatches > 0) {
          setSnack({
            message: `\u2713 ${matchResult.successfulMatches} automatic match(es) found`,
            severity: 'success',
          })
        }
      } catch {
        setSnack({
          message: 'Auto-match completed with no matches found.',
          severity: 'info',
        })
      }
    }
    runAutoMatch()
  }, [autoMatchMutation, loadData])

  useEffect(() => {
    const data = Array.isArray(suggestionsQuery.data) ? suggestionsQuery.data : []
    setSuggestions(data)
    if (!suggestionsQuery.isFetching && data.length > 0) {
      setSuggestionsInvoiceId(selectedInvoiceId)
    } else if (!suggestionsQuery.isFetching) {
      setSuggestionsInvoiceId(null)
    }
  }, [suggestionsQuery.data, suggestionsQuery.isFetching, selectedInvoiceId])

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
      setSuggestionsInvoiceId(null)
      setSnack({ message: 'Match created successfully!', severity: 'success' })
    } catch (err) {
      setSnack({ message: err.message || 'Failed to create match.', severity: 'error' })
    } finally {
      setMatchBusy(false)
    }
  }, [selectedInvoiceId, selectedTransactionId, invoices, transactions, createMatchMutation])

  const confirmUnmatch = useCallback((matchId) => {
    setUnmatchDialog({ open: true, matchId })
  }, [])

  const openMatchDetails = useCallback(async (match) => {
    const invoiceId = readField(match, 'invoice_id', 'invoiceId')
    const transactionId = readField(match, 'transaction_id', 'transactionId')
    const hasDetailsToLoad = Boolean(invoiceId || transactionId)

    setMatchDetailsDialog({
      open: true,
      match,
      invoice: null,
      transaction: null,
      loading: hasDetailsToLoad,
      error: '',
    })

    if (!hasDetailsToLoad) return

    const [invoiceResult, transactionResult] = await Promise.allSettled([
      invoiceId ? getInvoiceById(invoiceId, token) : Promise.resolve(null),
      transactionId ? getTransactionById(transactionId, token) : Promise.resolve(null),
    ])

    const selectedMatchKey = readField(match, 'id', 'id') ?? match
    const invoice = invoiceResult.status === 'fulfilled' ? invoiceResult.value : null
    const transaction = transactionResult.status === 'fulfilled' ? transactionResult.value : null
    const failed = invoiceResult.status === 'rejected' || transactionResult.status === 'rejected'

    setMatchDetailsDialog((current) => {
      const currentMatchKey = readField(current.match, 'id', 'id') ?? current.match
      if (!current.open || currentMatchKey !== selectedMatchKey) return current
      return {
        ...current,
        invoice,
        transaction,
        loading: false,
        error: failed ? 'Some full item details could not be loaded. Showing available match data.' : '',
      }
    })
  }, [token])

  const closeMatchDetails = useCallback(() => {
    setMatchDetailsDialog({
      open: false,
      match: null,
      invoice: null,
      transaction: null,
      loading: false,
      error: '',
    })
  }, [])

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
        const paymentPlanTotalInstallmentsInput = formData.paymentPlan?.totalInstallments?.value
        const paymentPlanInstallmentAmountInput = formData.paymentPlan?.installmentAmount?.value
        const paymentPlanCurrentInstallmentInput = formData.paymentPlan?.currentInstallment?.value

        const paymentPlanTotalInstallments =
          paymentPlanTotalInstallmentsInput === '' || paymentPlanTotalInstallmentsInput == null
            ? sourceInvoice.paymentPlanTotalInstallments ??
              sourceInvoice.payment_plan_total_installments ??
              null
            : Number.parseInt(paymentPlanTotalInstallmentsInput, 10) || 0

        const paymentPlanInstallmentAmount =
          paymentPlanInstallmentAmountInput === '' || paymentPlanInstallmentAmountInput == null
            ? sourceInvoice.paymentPlanInstallmentAmount ??
              sourceInvoice.payment_plan_installment_amount ??
              null
            : Number.parseFloat(paymentPlanInstallmentAmountInput) || 0

        const paymentPlanCurrentInstallment =
          paymentPlanCurrentInstallmentInput === '' || paymentPlanCurrentInstallmentInput == null
            ? sourceInvoice.paymentPlanCurrentInstallment ??
              sourceInvoice.payment_plan_current_installment ??
              null
            : Number.parseInt(paymentPlanCurrentInstallmentInput, 10) || 0

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
          paymentPlanTotalInstallments,
          paymentPlanInstallmentAmount,
          paymentPlanFrequency:
            formData.paymentPlan?.frequency?.value ||
            sourceInvoice.paymentPlanFrequency ||
            sourceInvoice.payment_plan_frequency ||
            null,
          paymentPlanCurrentInstallment,
          paymentPlanDescription:
            formData.paymentPlan?.description?.value ||
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
        setSnack({ message: 'Invoice updated successfully!', severity: 'success' })

        setSelectedInvoiceId(null)
        setSelectedTransactionId(null)
        setSuggestions([])
        setSuggestionsInvoiceId(null)
        await loadData()
      } catch (err) {
        setSnack({
          message: err.message || 'Failed to save invoice.',
          severity: 'error',
        })
      } finally {
        setInvoiceSaving(false)
      }
    },
    [invoiceModal.file, activeCompanyId, token, loadData],
  )

  const filteredInvoices = invoices.filter((inv) => {
    const q = invoiceSearch.toLowerCase()
    if (!q) return true
    const vendor = (inv.vendor_name || inv.vendorName || '').toLowerCase()
    const num = (inv.invoice_number || inv.invoiceNumber || '').toLowerCase()
    const invoiceDate = fmtDate(inv.invoice_date || inv.invoiceDate).toLowerCase()
    return vendor.includes(q) || num.includes(q) || invoiceDate.includes(q)
  })

  const filteredTransactions = transactions.filter((trx) => {
    const q = transactionSearch.toLowerCase()
    if (!q) return true
    const vendorName = (trx.vendor_name || trx.vendorName || '').toLowerCase()
    const chargeAmountRaw = trx.chargeAmount ?? trx.charge_amount ?? trx.amount ?? ''
    const chargeAmountText = `${chargeAmountRaw} ${fmtAmount(chargeAmountRaw)}`.toLowerCase()
    const transactionDate = fmtDate(trx.transaction_date || trx.transactionDate).toLowerCase()
    return transactionDate.includes(q) || vendorName.includes(q) || chargeAmountText.includes(q)
  })

  const invoiceTransactions = filteredTransactions.filter(
    (t) => t.requiresInvoice !== false,
  )
  const noInvoiceTransactions = filteredTransactions.filter(
    (t) => t.requiresInvoice === false,
  )

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId)
  const selectedTransaction = transactions.find((t) => t.id === selectedTransactionId)

  const validSuggestions =
    suggestionsInvoiceId === selectedInvoiceId ? suggestions : []

  const regularMatches = matches.filter(
    (m) => (m.match_method || m.matchMethod) !== 'installment_simple' && (m.installment_number ?? m.installmentNumber) == null,
  )

  const totalMatchedAmount = regularMatches.reduce(
    (sum, m) => sum + (Number(m.matched_amount ?? m.matchedAmount) || 0),
    0,
  )

  let matchedItemsContent
  if (loading) {
    matchedItemsContent = (
      <Stack spacing={1}>
        {['match-skeleton-1', 'match-skeleton-2', 'match-skeleton-3'].map((skeletonKey) => (
          <Skeleton key={skeletonKey} variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
        ))}
      </Stack>
    )
  } else if (regularMatches.length === 0) {
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
          {regularMatches.map((m) => {
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
            const method = m.match_method || m.matchMethod || '\u2014'
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
                      {invLabel} \u2194 {trxLabel}
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
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Tooltip title="View match details">
                    <IconButton
                      size="small"
                      aria-label="View match details"
                      onClick={() => openMatchDetails(m)}
                      sx={{ color: 'primary.main' }}
                    >
                      <VisibilityRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove match">
                    <IconButton
                      size="small"
                      aria-label="Remove match"
                      onClick={() => confirmUnmatch(id)}
                      sx={{ color: 'error.main' }}
                    >
                      <LinkOffRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            )
          })}
        </AnimatePresence>
      </Stack>
    )
  }

  return (
    <>
      <Box sx={{ py: { xs: 4, md: 6 }, position: 'relative', overflow: 'hidden' }} role="region" aria-label="Matches page">
        <AnimatedBackground density="low" />
        <Container maxWidth={false} disableGutters sx={{ px: { xs: 2, sm: 3, md: 4, xl: 5 }, width: '100%', position: 'relative', zIndex: 1 }}>
          <Stack component={motion.div} variants={containerVariants} initial="hidden" animate="show" spacing={3}>
            <PageHeaderCard
              title="Matches"
              description="Match invoices to bank transactions for reconciliation."
              onRefresh={loadData}
              refreshDisabled={loading}
              variants={itemVariants}
            />

            <StatsCards
              unmatchedInvoices={invoices.length}
              unmatchedTransactions={invoiceTransactions.length}
              totalMatches={matches.length}
              totalMatchedFormatted={fmtAmount(totalMatchedAmount)}
            />

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

            <SuggestionPanel suggestions={validSuggestions} onSelect={handleAcceptSuggestion} />

            <RevealOnScroll>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <SelectionPanel
                    icon={ReceiptLongRoundedIcon}
                    title="Unmatched Invoices"
                    count={filteredInvoices.length}
                    searchPlaceholder="Search by date, vendor, or invoice #\u2026"
                    searchValue={invoiceSearch}
                    onSearchChange={setInvoiceSearch}
                    loading={loading}
                    emptyMessage={invoiceSearch ? 'No invoices match your search.' : 'All invoices are matched!'}
                    items={filteredInvoices}
                    selectedId={selectedInvoiceId}
                    onSelect={setSelectedInvoiceId}
                    renderPrimary={(inv) => inv.invoice_number || inv.invoiceNumber || '\u2014'}
                    renderSecondary={(inv) => inv.vendor_name || inv.vendorName || '\u2014'}
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
                        {reopeningInvoiceId === inv.id ? 'Opening\u2026' : 'Edit'}
                      </Button>
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <SelectionPanel
                    icon={AccountBalanceRoundedIcon}
                    title="Unmatched Transactions"
                    count={invoiceTransactions.length}
                    searchPlaceholder="Search by date, vendor, or amount\u2026"
                    searchValue={transactionSearch}
                    onSearchChange={setTransactionSearch}
                    loading={loading}
                    emptyMessage={
                      transactionSearch
                        ? 'No transactions match your search.'
                        : 'All transactions requiring invoices are matched!'
                    }
                    items={invoiceTransactions}
                    selectedId={selectedTransactionId}
                    onSelect={setSelectedTransactionId}
                    renderPrimary={(trx) => trx.vendor_name || trx.vendorName || trx.description || '\u2014'}
                    renderSecondary={(trx) => trx.type || trx.transaction_type || ''}
                    renderAmount={(trx) => fmtAmount(trx.chargeAmount ?? trx.charge_amount ?? trx.amount ?? 0)}
                    renderDate={(trx) => fmtDate(trx.transaction_date || trx.transactionDate)}
                  />
                </Grid>
              </Grid>
            </RevealOnScroll>

            {noInvoiceTransactions.length > 0 && (
              <RevealOnScroll>
                <Card elevation={0} sx={cardBaseSx}>
                  <CardContent sx={{ p: 0 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      onClick={() => setNoInvoiceOpen((prev) => !prev)}
                      sx={{ p: 2, cursor: 'pointer' }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <MoneyOffRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                          No Invoice Expected ({noInvoiceTransactions.length})
                        </Typography>
                      </Stack>
                      <IconButton size="small">
                        {noInvoiceOpen ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}
                      </IconButton>
                    </Stack>
                    <Collapse in={noInvoiceOpen}>
                      <Stack spacing={0.5} sx={{ px: 2, pb: 2 }}>
                        {noInvoiceTransactions.map((trx) => (
                          <Stack
                            key={trx.id}
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{
                              p: 1,
                              borderRadius: 1.5,
                              bgcolor: 'rgba(255,255,255,0.02)',
                              border: '1px solid',
                              borderColor: 'divider',
                              opacity: 0.7,
                            }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={500}>
                                {trx.vendor_name || trx.vendorName || trx.description || '\u2014'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {fmtDate(trx.transaction_date || trx.transactionDate)} &middot; {fmtAmount(trx.chargeAmount ?? trx.charge_amount ?? trx.amount ?? 0)}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              No invoice needed
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Collapse>
                  </CardContent>
                </Card>
              </RevealOnScroll>
            )}

            <MatchActionBar
              selectedInvoice={selectedInvoice}
              selectedTransaction={selectedTransaction}
              onClear={() => {
                setSelectedInvoiceId(null)
                setSelectedTransactionId(null)
              }}
              onCreateMatch={handleCreateMatch}
              matchBusy={matchBusy}
              canCreate={Boolean(selectedInvoiceId && selectedTransactionId)}
            />

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
                  setSnack({ message: 'Match confirmed!', severity: 'success' })
                } catch (err) {
                  setSnack({
                    message: err.message || 'Failed to create match.',
                    severity: 'error',
                  })
                } finally {
                  setMatchBusy(false)
                }
              }}
              matchBusy={matchBusy}
              onUndoAll={() => setDeniedPairs(new Set())}
            />

            <InstallmentMatchGroups
              query={installmentSuggestionsQuery}
              deniedTxnIds={deniedInstallmentPairs}
              onDeny={(invoiceId, transactionId) =>
                setDeniedInstallmentPairs((prev) => new Set([...prev, `${invoiceId}-${transactionId}`]))
              }
              onConfirm={async (group, txn) => {
                setMatchBusy(true)
                try {
                  const installmentNumber = (group.alreadyMatchedCount || 0) + 1
                  const expected = group.expectedInstallments
                  const suffix = expected ? ` of ${expected}` : ''
                  const totalAmount = Number(group.totalAmount) || 0
                  const alreadyMatchedAmount = Number(group.alreadyMatchedAmount) || 0
                  const remainingAmount = Math.max(totalAmount - alreadyMatchedAmount, 0)
                  const suggestedAmount = getInstallmentSuggestionAmount(txn)
                  const effectiveAmount = Math.min(suggestedAmount, remainingAmount)

                  if (suggestedAmount <= 0) {
                    throw new Error('Installment amount is missing for this suggestion.')
                  }

                  if (effectiveAmount <= 0) {
                    throw new Error('No remaining balance to match for this invoice.')
                  }

                  await createMatchMutation.mutateAsync({
                    invoiceId: group.invoiceId,
                    transactionId: txn.transactionId,
                    matchedAmount: effectiveAmount,
                    matchMethod: 'installment_simple',
                    matchType: effectiveAmount >= remainingAmount ? 'full' : 'partial',
                    matchConfidence: 1,
                    installmentNumber,
                    installmentNote: `Installment ${installmentNumber}${suffix}`,
                  })
                  setSnack({
                    message: `Installment ${installmentNumber} confirmed!`,
                    severity: 'success',
                  })
                } catch (err) {
                  setSnack({
                    message: err.message || 'Failed to confirm installment.',
                    severity: 'error',
                  })
                } finally {
                  setMatchBusy(false)
                }
              }}
              onRemoveMatch={confirmUnmatch}
              matchBusy={matchBusy}
            />

            <CollapsibleSection
              title="Matched Items"
              count={regularMatches.length}
              open={matchedItemsOpen}
              onToggle={() => setMatchedItemsOpen((v) => !v)}
            >
              {matchedItemsContent}
            </CollapsibleSection>
          </Stack>
        </Container>
      </Box>

      <MatchDetailsDialog
        open={matchDetailsDialog.open}
        match={matchDetailsDialog.match}
        invoice={matchDetailsDialog.invoice}
        transaction={matchDetailsDialog.transaction}
        loading={matchDetailsDialog.loading}
        error={matchDetailsDialog.error}
        onClose={closeMatchDetails}
      />

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
        fileType={
          invoiceModal.file?.sourceInvoice?.fileType ||
          invoiceModal.file?.sourceInvoice?.file_type ||
          invoiceModal.file?.file?.type ||
          null
        }
        invoiceId={invoiceModal.file?.existingInvoiceId || null}
        token={token}
        localFile={invoiceModal.file?.file || null}
        extractionMethod={invoiceModal.file?.serverResponse?.extractedData?.extractionMethod}
        saving={invoiceSaving}
      />
    </>
  )
}

export default MatchesPage
