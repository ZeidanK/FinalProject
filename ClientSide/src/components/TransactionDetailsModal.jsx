import { Chip, Divider, Grid, Stack, Typography, Button, Paper, Box, Skeleton } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import PropTypes from 'prop-types'
import ModalShell from './ModalShell'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB')
}

function formatNumber(value, digits = 2) {
  const number = Number(value)
  if (Number.isNaN(number)) return '—'
  return number.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function getCurrencySymbol(code) {
  if (!code) return '$'
  const map = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'CA$', AUD: 'A$', CHF: 'Fr', CNY: '¥' }
  return map[code.toUpperCase()] || code
}

function formatCurrency(amount, currencyCode) {
  const formatted = formatNumber(amount)
  if (formatted === '—') return '—'
  return `${getCurrencySymbol(currencyCode)}${formatted}`
}

function formatConfidence(value) {
  if (value == null) return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return '—'
  if (num >= 0 && num <= 1) return `${(num * 100).toFixed(2)}%`
  return `${num.toFixed(2)}%`
}

function chipColorForStatus(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'confirmed' || normalized === 'matched') return 'success'
  if (normalized === 'pending' || normalized === 'review') return 'warning'
  if (normalized === 'duplicate' || normalized === 'rejected') return 'error'
  return 'default'
}

function normalizeTransaction(tx) {
  if (!tx) return null

  return {
    id: tx.id ?? tx.transactionId ?? null,
    companyId: tx.companyId ?? tx.company_id ?? null,
    transactionDate: tx.transactionDate ?? tx.transaction_date ?? null,
    postedDate: tx.postedDate ?? tx.posted_date ?? null,
    description: tx.description ?? '',
    vendorName: tx.vendorName ?? tx.vendor_name ?? null,
    cardLast4: tx.cardLast4 ?? tx.card_last4 ?? null,
    amount: tx.amount ?? 0,
    transactionType: String(tx.transactionType ?? tx.transaction_type ?? 'debit').toLowerCase(),
    category: tx.category ?? '—',
    categoryConfidence: tx.categoryConfidence ?? tx.category_confidence ?? null,
    referenceNumber: tx.referenceNumber ?? tx.reference_number ?? '—',
    chargeAmount: tx.chargeAmount ?? tx.charge_amount ?? null,
    chargeCurrency: tx.chargeCurrency ?? tx.charge_currency ?? null,
    originalCurrency: tx.originalCurrency ?? tx.original_currency ?? null,
    exchangeRate: tx.exchangeRate ?? tx.exchange_rate ?? null,
    isMatched: tx.isMatched ?? tx.is_matched ?? false,
    isAnomaly: tx.isAnomaly ?? tx.is_anomaly ?? false,
    isDuplicate: tx.isDuplicate ?? tx.is_duplicate ?? false,
    status: tx.status ?? 'confirmed',
    createdByUserId: tx.createdByUserId ?? tx.created_by_user_id ?? null,
    createdByName: tx.createdByName ?? tx.created_by_name ?? null,
    createdAt: tx.createdAt ?? tx.created_at ?? null,
    updatedAt: tx.updatedAt ?? tx.updated_at ?? null,
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
          {value ?? '—'}
        </Typography>
      </Stack>
    </Paper>
  )
}

InfoCard.propTypes = {
  label: PropTypes.node.isRequired,
  value: PropTypes.node,
}

function TransactionHero({ data }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(129, 191, 255, 0.08) 0%, rgba(129, 191, 255, 0.02) 100%)',
        borderColor: 'rgba(129, 191, 255, 0.15)',
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.1 }}>
            {formatCurrency(data.amount, data.chargeCurrency)}
          </Typography>
          <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
            <Chip
              label={data.transactionType}
              color={data.transactionType === 'credit' ? 'success' : 'error'}
              size="small"
            />
            <Chip
              label={data.isMatched ? 'Matched' : 'Unmatched'}
              color={data.isMatched ? 'success' : 'default'}
              size="small"
              variant="outlined"
            />
            <Chip
              label={data.isAnomaly ? 'Anomaly' : 'Normal'}
              color={data.isAnomaly ? 'error' : 'default'}
              size="small"
              variant="outlined"
            />
            <Chip
              label={data.isDuplicate ? 'Duplicate' : 'Unique'}
              color={data.isDuplicate ? 'warning' : 'default'}
              size="small"
              variant="outlined"
            />
            <Chip
              label={data.status || 'confirmed'}
              color={chipColorForStatus(data.status)}
              size="small"
            />
          </Stack>
        </Stack>
        <Box>
          <Typography variant="h6" fontWeight={500} sx={{ mb: 0.5 }}>
            {data.description || '—'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {[data.vendorName, data.cardLast4 && `****${data.cardLast4}`].filter(Boolean).join('  •  ') || '—'}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}

TransactionHero.propTypes = {
  data: PropTypes.object.isRequired,
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

function TransactionSkeleton() {
  return (
    <Stack spacing={3} sx={{ mt: 2 }}>
      <Paper
        variant="outlined"
        sx={{ p: 2.5, borderRadius: 3, borderColor: 'divider' }}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Skeleton variant="rounded" width={160} height={40} />
            <Stack direction="row" spacing={0.5}>
              <Skeleton variant="rounded" width={55} height={24} />
              <Skeleton variant="rounded" width={70} height={24} />
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

function TransactionStatusContent({ loading, error, data }) {
  if (loading) {
    return <TransactionSkeleton />
  }

  if (error) {
    return (
      <Stack spacing={2} sx={{ mt: 2 }}>
        <Paper
          variant="outlined"
          sx={{ p: 2, borderRadius: 2, borderColor: 'error.dark', bgcolor: 'rgba(211, 47, 47, 0.06)' }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="body2" color="error.main" sx={{ flex: 1 }}>
              {error}
            </Typography>
          </Stack>
        </Paper>
        {data ? (
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Showing the row data that was already loaded in the list.
          </Typography>
        ) : null}
      </Stack>
    )
  }

  return null
}

TransactionStatusContent.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.string,
  data: PropTypes.object,
}

function TransactionDetailsContent({ data }) {
  const currencyPair =
    data.chargeCurrency && data.originalCurrency
      ? `${data.chargeCurrency}  →  ${data.originalCurrency}`
      : data.chargeCurrency || data.originalCurrency || '—'

  return (
    <Stack spacing={3} sx={{ mt: 2 }}>
      <TransactionHero data={data} />

      <SectionDivider label="Details" />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Transaction Date" value={formatDate(data.transactionDate)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Posted Date" value={formatDate(data.postedDate)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Card" value={data.cardLast4 ? `****${data.cardLast4}` : '—'} />
        </Grid>
      </Grid>

      <SectionDivider label="Financial Breakdown" />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard
            label="Charge Amount"
            value={data.chargeAmount == null ? '—' : formatCurrency(data.chargeAmount, data.chargeCurrency)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Exchange Rate" value={data.exchangeRate == null ? '—' : formatNumber(data.exchangeRate, 4)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Currencies" value={currencyPair} />
        </Grid>
      </Grid>

      <SectionDivider label="Classification" />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Category" value={data.category || '—'} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Confidence" value={formatConfidence(data.categoryConfidence)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Reference Number" value={data.referenceNumber || '—'} />
        </Grid>
      </Grid>

      <SectionDivider label="Audit Trail" />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Created" value={formatDate(data.createdAt)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard label="Updated" value={formatDate(data.updatedAt)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <InfoCard
            label="Created By"
            value={data.createdByName || (data.createdByUserId == null ? '—' : `User #${data.createdByUserId}`)}
          />
        </Grid>
      </Grid>
    </Stack>
  )
}

TransactionDetailsContent.propTypes = {
  data: PropTypes.object.isRequired,
}

export default function TransactionDetailsModal({ open, loading, error, transaction, onClose }) {
  const data = normalizeTransaction(transaction)

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidth="md"
      title={(
        <Stack spacing={0.5}>
          <Typography variant="h6">Saved Transaction</Typography>
          <Typography variant="body2" color="text.secondary">
            Review the exact values that were stored after import.
          </Typography>
        </Stack>
      )}
      headerAction={(
        <Button onClick={onClose} color="inherit" startIcon={<CloseRoundedIcon />}>
          Close
        </Button>
      )}
    >
      <TransactionStatusContent loading={loading} error={error} data={data} />
      {data && !loading && <TransactionDetailsContent data={data} />}
    </ModalShell>
  )
}

TransactionDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  transaction: PropTypes.object,
  onClose: PropTypes.func.isRequired,
}
