import PropTypes from 'prop-types'
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { motion } from 'framer-motion'
import { cardBaseSx } from '../utils/sharedStyles'
import { fmtAmount } from '../utils/formatters'

export default function MatchActionBarEnhanced({
  selectedInvoice,
  selectedTransaction,
  amount,
  onAmountChange,
  onCreateMatch,
  onClear,
  onShowComparison,
  canCreate,
  matchBusy,
}) {
  if (!selectedInvoice && !selectedTransaction) return null

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      elevation={0}
      sx={{ ...cardBaseSx, borderColor: 'primary.main', borderWidth: 2 }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={1.5}>
          <Box sx={{ minWidth: 140 }}>
            <Typography variant="caption" color="text.secondary">Invoice</Typography>
            <Typography variant="body2" fontWeight={700}>
              {selectedInvoice
                ? `${selectedInvoice.invoice_number || selectedInvoice.invoiceNumber || '#' + selectedInvoice.id}`
                : '\u2014 None selected'}
            </Typography>
            {selectedInvoice && (
              <Typography variant="caption" color="primary" fontWeight={600}>
                {fmtAmount(selectedInvoice.total_amount ?? selectedInvoice.totalAmount)}
              </Typography>
            )}
          </Box>

          <CompareArrowsRoundedIcon sx={{ color: 'text.secondary', flexShrink: 0 }} />

          <Box sx={{ minWidth: 140 }}>
            <Typography variant="caption" color="text.secondary">Transaction</Typography>
            <Typography variant="body2" fontWeight={700} noWrap>
              {selectedTransaction
                ? (selectedTransaction.vendor_name || selectedTransaction.vendorName || selectedTransaction.description || `#${selectedTransaction.id}`)
                : '\u2014 None selected'}
            </Typography>
            {selectedTransaction && (
              <Typography variant="caption" color="success.main" fontWeight={600}>
                {fmtAmount(selectedTransaction.chargeAmount ?? selectedTransaction.charge_amount ?? selectedTransaction.amount ?? 0)}
              </Typography>
            )}
          </Box>

          {canCreate && (
            <TextField
              size="small"
              type="number"
              label="Match amount"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              sx={{ width: 140 }}
              slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
            />
          )}

          <Stack direction="row" spacing={1} sx={{ ml: { sm: 'auto' } }}>
            {canCreate && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<VisibilityRoundedIcon />}
                onClick={onShowComparison}
              >
                Compare
              </Button>
            )}
            <Button size="small" variant="text" startIcon={<ClearRoundedIcon />} onClick={onClear}>
              Clear
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<CheckCircleRoundedIcon />}
              disabled={!canCreate || matchBusy}
              onClick={onCreateMatch}
            >
              {matchBusy ? 'Matching...' : 'Create Match'}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

MatchActionBarEnhanced.propTypes = {
  selectedInvoice: PropTypes.object,
  selectedTransaction: PropTypes.object,
  amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onAmountChange: PropTypes.func.isRequired,
  onCreateMatch: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  onShowComparison: PropTypes.func,
  canCreate: PropTypes.bool.isRequired,
  matchBusy: PropTypes.bool,
}
