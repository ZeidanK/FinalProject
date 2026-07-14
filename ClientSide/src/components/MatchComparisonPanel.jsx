import PropTypes from 'prop-types'
import {
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded'
import { fmtAmount, fmtCurrency, fmtDate } from '../utils/formatters'

function FieldRow({ label, invValue, trxValue, format }) {
  const formattedInv = format ? format(invValue) : (invValue ?? '\u2014')
  const formattedTrx = format ? format(trxValue) : (trxValue ?? '\u2014')
  const match = String(formattedInv) === String(formattedTrx)

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{
        py: 0.8,
        px: 1.5,
        borderRadius: 1,
        bgcolor: match ? 'rgba(55,214,122,0.04)' : 'rgba(248,113,113,0.04)',
      }}
    >
      <Typography variant="caption" sx={{ minWidth: 100, color: 'text.secondary', fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ flex: 1, color: match ? 'success.main' : 'inherit', fontWeight: match ? 600 : 400 }}
      >
        {formattedInv}
      </Typography>
      <CompareArrowsRoundedIcon sx={{ fontSize: 14, color: match ? 'success.main' : 'text.disabled' }} />
      <Typography
        variant="body2"
        sx={{ flex: 1, color: match ? 'success.main' : 'inherit', fontWeight: match ? 600 : 400 }}
      >
        {formattedTrx}
      </Typography>
      <Chip
        label={match ? 'Match' : 'Differs'}
        size="small"
        color={match ? 'success' : 'error'}
        variant="outlined"
        sx={{ height: 20, fontSize: 10 }}
      />
    </Stack>
  )
}

FieldRow.propTypes = {
  label: PropTypes.string.isRequired,
  invValue: PropTypes.any,
  trxValue: PropTypes.any,
  format: PropTypes.func,
}

const readField = (obj, snake, camel) => (obj ? (obj[snake] ?? obj[camel] ?? undefined) : undefined)

export default function MatchComparisonPanel({ invoice, transaction, sx }) {
  if (!invoice || !transaction) return null

  const invCurrency = readField(invoice, 'currency', 'currency') || 'USD'
  const fields = [
    { label: 'Vendor', invKey: 'vendor_name', invAlt: 'vendorName', trxKey: 'vendor_name', trxAlt: 'vendorName' },
    { label: 'Amount', invKey: 'total_amount', invAlt: 'totalAmount', trxKey: 'charge_amount', trxAlt: 'chargeAmount', format: (v) => fmtCurrency(v, invCurrency) },
    { label: 'Currency', invKey: 'currency', invAlt: 'currency', trxKey: 'charge_currency', trxAlt: 'chargeCurrency' },
    { label: 'Date', invKey: 'invoice_date', invAlt: 'invoiceDate', trxKey: 'transaction_date', trxAlt: 'transactionDate', format: fmtDate },
    { label: 'Card', invKey: 'last_four_digits_card', invAlt: 'lastFourDigitsCard', trxKey: 'card_last4', trxAlt: 'cardLast4' },
  ]

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2.5,
        borderColor: 'rgba(88,166,255,0.15)',
        bgcolor: 'rgba(88,166,255,0.02)',
        ...sx,
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Field Comparison
          </Typography>
          <Stack direction="row" spacing={1}>
            <Typography variant="caption" color="primary" fontWeight={600}>Invoice</Typography>
            <Typography variant="caption" color="text.secondary">vs</Typography>
            <Typography variant="caption" color="success.main" fontWeight={600}>Transaction</Typography>
          </Stack>
        </Stack>
        <Divider sx={{ borderColor: 'rgba(88,166,255,0.08)' }} />
        <Stack spacing={0.5}>
          {fields.map((f) => (
            <FieldRow
              key={f.label}
              label={f.label}
              invValue={readField(invoice, f.invKey, f.invAlt)}
              trxValue={readField(transaction, f.trxKey, f.trxAlt)}
              format={f.format}
            />
          ))}
        </Stack>
      </Stack>
    </Paper>
  )
}

MatchComparisonPanel.propTypes = {
  invoice: PropTypes.object,
  transaction: PropTypes.object,
  sx: PropTypes.object,
}
