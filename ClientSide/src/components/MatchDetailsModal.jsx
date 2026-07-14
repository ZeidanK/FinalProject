import { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import ModalShell from './ModalShell'
import { fmtAmount, fmtDate } from '../utils/formatters'

const dash = '\u2014'

const formatConfidence = (value) => {
  if (value == null || value === '') return dash
  const num = Number(value)
  if (Number.isNaN(num)) return dash
  return `${Math.round(num <= 1 ? num * 100 : num)}%`
}

const showAmount = (value) => (value == null || value === '' ? dash : fmtAmount(value))

const displayValue = (value) => (value == null || value === '' ? dash : String(value))

const readField = (source, snakeKey, camelKey) => {
  if (!source) return undefined
  return source[snakeKey] ?? source[camelKey] ?? undefined
}

const readFields = (source, keys) => {
  if (!source) return undefined
  for (const key of keys) {
    const v = source[key]
    if (v !== undefined && v !== null && v !== '') return v
  }
  return undefined
}

function normalizeMatchData(match, invoice, transaction) {
  if (!match) return null

  const inv = invoice || match
  const trx = transaction || match

  return {
    matchId: readField(match, 'id', 'id'),
    matchMethod: readField(match, 'match_method', 'matchMethod'),
    matchType: readField(match, 'match_type', 'matchType'),
    matchConfidence: readField(match, 'match_confidence', 'matchConfidence'),
    matchReason: readField(match, 'match_reason', 'matchReason'),
    matchedAmount: readField(match, 'matched_amount', 'matchedAmount'),
    matchedBy: readField(match, 'matched_by_name', 'matchedByName'),
    matchedByUserId: readField(match, 'matched_by_user_id', 'matchedByUserId'),
    installmentNumber: readField(match, 'installment_number', 'installmentNumber'),
    installmentNote: readField(match, 'installment_note', 'installmentNote'),
    createdAt: readField(match, 'created_at', 'createdAt'),
    updatedAt: readField(match, 'updated_at', 'updatedAt'),

    invoiceId: readField(inv, 'id', 'id') ?? readField(match, 'invoice_id', 'invoiceId'),
    invoiceNumber:
      readField(inv, 'invoice_number', 'invoiceNumber') ?? readField(match, 'invoice_number', 'invoiceNumber'),
    invoiceVendor:
      readField(inv, 'vendor_name', 'vendorName') ?? readField(match, 'vendor_name', 'vendorName'),
    invoiceAmount:
      readFields(inv, ['total_amount', 'totalAmount', 'invoice_amount', 'invoiceAmount']) ??
      readField(match, 'invoice_amount', 'invoiceAmount'),
    invoiceDate: readField(inv, 'invoice_date', 'invoiceDate') ?? readField(match, 'invoice_date', 'invoiceDate'),
    invoiceDueDate: readField(invoice, 'due_date', 'dueDate'),
    invoiceStatus: readField(invoice, 'status', 'status'),
    invoiceCurrency: readField(invoice, 'currency', 'currency'),
    invoiceCardLast4: readField(invoice, 'last_four_digits_card', 'lastFourDigitsCard'),

    transactionId:
      readField(trx, 'id', 'id') ?? readField(match, 'transaction_id', 'transactionId'),
    transactionVendor:
      readField(trx, 'vendor_name', 'vendorName') ??
      readField(match, 'transaction_vendor_name', 'transactionVendorName'),
    transactionDescription:
      readField(trx, 'description', 'description') ??
      readField(match, 'transaction_description', 'transactionDescription'),
    transactionDate:
      readField(trx, 'transaction_date', 'transactionDate') ?? readField(match, 'transaction_date', 'transactionDate'),
    transactionAmount:
      readField(trx, 'amount', 'amount') ?? readField(match, 'transaction_amount', 'transactionAmount'),
    transactionType:
      readField(trx, 'transaction_type', 'transactionType') ?? readField(match, 'transaction_type', 'transactionType'),
    transactionPostedDate: readField(transaction, 'posted_date', 'postedDate'),
    transactionChargeAmount: readField(transaction, 'charge_amount', 'chargeAmount'),
    transactionReference: readField(transaction, 'reference_number', 'referenceNumber'),
    transactionCategory: readField(transaction, 'category', 'category'),
    transactionCardLast4: readField(transaction, 'card_last4', 'cardLast4'),
  }
}

function InfoCard({ label, value }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: 'rgba(255,255,255,0.02)',
        borderColor: 'divider',
        height: '100%',
      }}
    >
      <Stack spacing={0.5}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ letterSpacing: 0.3, textTransform: 'uppercase', fontSize: '0.7rem' }}
        >
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
          {value ?? dash}
        </Typography>
      </Stack>
    </Paper>
  )
}

InfoCard.propTypes = {
  label: PropTypes.node.isRequired,
  value: PropTypes.node,
}

function SectionDivider({ label }) {
  return (
    <Divider sx={{ '&::before, &::after': { borderColor: 'rgba(129, 191, 255, 0.08)' } }}>
      <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {label}
      </Typography>
    </Divider>
  )
}

SectionDivider.propTypes = {
  label: PropTypes.string.isRequired,
}

function MatchHero({ data }) {
  const methodColor =
    data.matchMethod === 'manual' ? 'info' : data.matchMethod === 'auto' ? 'success' : 'default'
  const typeColor = data.matchType === 'full' ? 'success' : data.matchType === 'partial' ? 'warning' : 'default'
  const confValue = Number(data.matchConfidence)
  const confColor = confValue >= 0.8 ? 'success' : confValue >= 0.5 ? 'warning' : 'default'

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.08) 0%, rgba(88, 166, 255, 0.02) 100%)',
        borderColor: 'rgba(88, 166, 255, 0.15)',
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.3, textTransform: 'uppercase' }}>
              Matched Amount
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.1 }}>
              {showAmount(data.matchedAmount)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
            <Chip label={data.matchMethod || dash} size="small" variant="outlined" color={methodColor} />
            <Chip label={data.matchType || dash} size="small" variant="outlined" color={typeColor} />
            <Chip label={formatConfidence(data.matchConfidence)} size="small" color={confColor} variant="outlined" />
          </Stack>
        </Stack>
        <Box>
          <Typography variant="h6" fontWeight={500}>
            {data.invoiceVendor || data.transactionVendor || dash}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.invoiceNumber ? `Invoice #${data.invoiceNumber}` : `Invoice #${data.invoiceId || '?'}`}
            {' ↔ '}
            {data.transactionVendor || data.transactionDescription || `Transaction #${data.transactionId || '?'}`}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}

MatchHero.propTypes = {
  data: PropTypes.object.isRequired,
}

function MatchSkeleton() {
  return (
    <Stack spacing={3} sx={{ mt: 2 }}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: 'divider' }}>
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Skeleton variant="rounded" width={160} height={40} />
            <Stack direction="row" spacing={0.5}>
              <Skeleton variant="rounded" width={70} height={24} />
              <Skeleton variant="rounded" width={80} height={24} />
            </Stack>
          </Stack>
          <Skeleton variant="rounded" width="65%" height={28} />
          <Skeleton variant="rounded" width="40%" height={20} />
        </Stack>
      </Paper>
      {[0, 1, 2].map((section) => (
        <Grid container spacing={2} key={section}>
          {[0, 1, 2].map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item}>
              <Skeleton variant="rounded" height={64} />
            </Grid>
          ))}
        </Grid>
      ))}
    </Stack>
  )
}

function MatchDetailsContent({ data }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(String(text))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard not available
    }
  }, [])

  const installmentText = data.installmentNumber
    ? `${data.installmentNumber}${data.installmentNote ? ` - ${data.installmentNote}` : ''}`
    : dash

  return (
    <Stack spacing={3} sx={{ mt: 2 }}>
      <MatchHero data={data} />

      <SectionDivider label="Match" />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard
            label="Match ID"
            value={(
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="body2" fontWeight={600} component="span" sx={{ wordBreak: 'break-word' }}>
                  {displayValue(data.matchId)}
                </Typography>
                <Tooltip title={copied ? 'Copied!' : 'Copy ID'} placement="top">
                  <IconButton
                    size="small"
                    onClick={() => handleCopy(data.matchId)}
                    sx={{ opacity: 0.5, '&:hover': { opacity: 1 }, color: 'text.secondary' }}
                    aria-label="Copy match ID"
                  >
                    <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Matched Amount" value={showAmount(data.matchedAmount)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard
            label="Matched By"
            value={data.matchedBy || (data.matchedByUserId ? `User #${data.matchedByUserId}` : dash)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Created" value={fmtDate(data.createdAt)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Updated" value={fmtDate(data.updatedAt)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Installment" value={installmentText} />
        </Grid>
      </Grid>

      <SectionDivider label="Invoice" />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Invoice ID" value={displayValue(data.invoiceId)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Invoice Number" value={displayValue(data.invoiceNumber)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Vendor" value={displayValue(data.invoiceVendor)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Invoice Date" value={fmtDate(data.invoiceDate)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Invoice Amount" value={showAmount(data.invoiceAmount)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Due Date" value={fmtDate(data.invoiceDueDate)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Status" value={displayValue(data.invoiceStatus)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Currency" value={displayValue(data.invoiceCurrency)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Card" value={data.invoiceCardLast4 ? `**** ${data.invoiceCardLast4}` : dash} />
        </Grid>
      </Grid>

      <SectionDivider label="Transaction" />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Transaction ID" value={displayValue(data.transactionId)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Vendor" value={displayValue(data.transactionVendor)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Type" value={displayValue(data.transactionType)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Transaction Date" value={fmtDate(data.transactionDate)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Transaction Amount" value={showAmount(data.transactionAmount)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Posted Date" value={fmtDate(data.transactionPostedDate)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Charge Amount" value={showAmount(data.transactionChargeAmount)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Reference" value={displayValue(data.transactionReference)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Category" value={displayValue(data.transactionCategory)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Card" value={data.transactionCardLast4 ? `**** ${data.transactionCardLast4}` : dash} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <InfoCard label="Description" value={displayValue(data.transactionDescription)} />
        </Grid>
      </Grid>

      {data.matchReason ? (
        <>
          <SectionDivider label="Reason" />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <InfoCard label="Match Reason" value={data.matchReason} />
            </Grid>
          </Grid>
        </>
      ) : null}
    </Stack>
  )
}

MatchDetailsContent.propTypes = {
  data: PropTypes.object.isRequired,
}

export default function MatchDetailsModal({ open, match, invoice, transaction, loading, error, onClose }) {
  const data = normalizeMatchData(match, invoice, transaction)

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidth="md"
      title={(
        <Stack spacing={0.5}>
          <Typography variant="h6">Match Details</Typography>
          {data && !loading ? (
            <Typography variant="body2" color="text.secondary">
              {data.invoiceVendor || data.transactionVendor || `Match #${data.matchId}`}
            </Typography>
          ) : null}
        </Stack>
      )}
      headerAction={(
        <Button onClick={onClose} color="inherit" startIcon={<CloseRoundedIcon />}>
          Close
        </Button>
      )}
      contentSx={{ py: 1.5 }}
    >
      {loading ? (
        <>
          <LinearProgress sx={{ mb: 1 }} aria-label="Loading match details" />
          <MatchSkeleton />
        </>
      ) : null}

      {error && !loading ? (
        <Alert severity="warning" sx={{ mt: 2 }} role="status">
          {error}
        </Alert>
      ) : null}

      {!data && !loading && !error ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No match selected.
        </Alert>
      ) : null}

      {data && !loading ? <MatchDetailsContent data={data} /> : null}
    </ModalShell>
  )
}

MatchDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  match: PropTypes.object,
  invoice: PropTypes.object,
  transaction: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onClose: PropTypes.func.isRequired,
}

MatchDetailsModal.defaultProps = {
  match: null,
  invoice: null,
  transaction: null,
  loading: false,
  error: '',
}
