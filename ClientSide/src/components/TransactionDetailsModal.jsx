import { Chip, Divider, Grid, Stack, Typography, Button } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import PropTypes from 'prop-types'
import ModalShell from './ModalShell'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

function formatNumber(value, digits = 2) {
  const number = Number(value)
  if (Number.isNaN(number)) return '—'
  return number.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
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
    amount: tx.amount ?? 0,
    balanceAfter: tx.balanceAfter ?? tx.balance_after ?? null,
    transactionType: String(tx.transactionType ?? tx.transaction_type ?? 'debit').toLowerCase(),
    category: tx.category ?? '—',
    referenceNumber: tx.referenceNumber ?? tx.reference_number ?? '—',
    isMatched: tx.isMatched ?? tx.is_matched ?? false,
    isDuplicate: tx.isDuplicate ?? tx.is_duplicate ?? false,
    status: tx.status ?? 'confirmed',
    createdByUserId: tx.createdByUserId ?? tx.created_by_user_id ?? null,
    createdAt: tx.createdAt ?? tx.created_at ?? null,
    updatedAt: tx.updatedAt ?? tx.updated_at ?? null,
  }
}

function DetailRow({ label, value }) {
  return (
    <Stack spacing={0.5} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid', borderColor: 'divider', minHeight: 86 }}>
      <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.2, textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Stack>
  )
}

DetailRow.propTypes = {
  label: PropTypes.node.isRequired,
  value: PropTypes.node,
}

function TransactionStatusContent({ loading, error, data }) {
  if (loading) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading transaction details…
      </Typography>
    )
  }

  if (error) {
    return (
      <Stack spacing={2}>
        <Typography variant="body2" color="error.main">
          {error}
        </Typography>
        {data ? (
          <Typography variant="body2" color="text.secondary">
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
  return (
    <Stack spacing={3} sx={{ mt: 2 }}>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Chip label={data.transactionType} color={data.transactionType === 'credit' ? 'success' : 'error'} variant="outlined" />
        <Chip label={data.isMatched ? 'Matched' : 'Unmatched'} color={data.isMatched ? 'success' : 'default'} variant="outlined" />
        <Chip label={data.isDuplicate ? 'Duplicate' : 'Unique'} color={data.isDuplicate ? 'warning' : 'default'} variant="outlined" />
        <Chip label={data.status || 'confirmed'} color={chipColorForStatus(data.status)} variant="outlined" />
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailRow label="Transaction Date" value={formatDate(data.transactionDate)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailRow label="Posted Date" value={formatDate(data.postedDate)} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <DetailRow label="Description" value={data.description || '—'} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <DetailRow label="Amount" value={formatNumber(data.amount)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <DetailRow label="Balance After" value={data.balanceAfter == null ? '—' : formatNumber(data.balanceAfter)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailRow label="Category" value={data.category || '—'} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailRow label="Reference Number" value={data.referenceNumber || '—'} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailRow label="Created At" value={formatDate(data.createdAt)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailRow label="Updated At" value={formatDate(data.updatedAt)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailRow label="Created By User" value={data.createdByUserId == null ? '—' : String(data.createdByUserId)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DetailRow label="Transaction Id" value={data.id == null ? '—' : String(data.id)} />
        </Grid>
      </Grid>

      <Divider />

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Typography variant="body2" color="text.secondary">
          This view is read-only and uses the saved transaction record for reference.
        </Typography>
      </Stack>
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
      actions={(
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      )}
    >
        <TransactionStatusContent loading={loading} error={error} data={data} />
        {data && <TransactionDetailsContent data={data} />}
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
