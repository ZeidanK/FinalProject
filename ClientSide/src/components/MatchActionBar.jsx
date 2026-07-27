import PropTypes from 'prop-types'
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { motion } from 'framer-motion'
import { cardBaseSx } from '../utils/sharedStyles'

export default function MatchActionBar({
  selectedInvoice,
  selectedTransaction,
  onClear,
  onCreateMatch,
  matchBusy,
  canCreate,
}) {
  if (!selectedInvoice && !selectedTransaction) return null

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      elevation={0}
      sx={{
        ...cardBaseSx,
        borderColor: 'primary.main',
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
              <Typography variant="caption" color="text.secondary">Invoice</Typography>
              <Typography variant="body2" fontWeight={600}>
                {selectedInvoice
                  ? selectedInvoice.invoice_number || selectedInvoice.invoiceNumber || '—'
                  : 'None'}
              </Typography>
            </Box>
            <CompareArrowsRoundedIcon sx={{ color: 'text.secondary' }} />
            <Box sx={{ textAlign: 'center', minWidth: 100 }}>
              <Typography variant="caption" color="text.secondary">Transaction</Typography>
              <Typography variant="body2" fontWeight={600}>
                {selectedTransaction
                  ? selectedTransaction.vendor_name || selectedTransaction.vendorName || selectedTransaction.description || `#${selectedTransaction.id}`
                  : 'None'}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <Button variant="text" onClick={onClear}>Clear</Button>
            <Button
              variant="contained"
              startIcon={<CheckCircleRoundedIcon />}
              disabled={!canCreate || matchBusy}
              onClick={onCreateMatch}
            >
              {matchBusy ? 'Matching\u2026' : 'Create Match'}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

MatchActionBar.propTypes = {
  selectedInvoice: PropTypes.object,
  selectedTransaction: PropTypes.object,
  onClear: PropTypes.func.isRequired,
  onCreateMatch: PropTypes.func.isRequired,
  matchBusy: PropTypes.bool.isRequired,
  canCreate: PropTypes.bool.isRequired,
}
