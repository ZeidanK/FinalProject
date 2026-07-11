import PropTypes from 'prop-types'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'
import UndoRoundedIcon from '@mui/icons-material/UndoRounded'
import { AnimatePresence, motion } from 'framer-motion'
import { cardBaseSx } from '../utils/sharedStyles'
import { fmtAmount, fmtCurrency, fmtDate } from '../utils/formatters'
import { itemVariants } from '../utils/motionVariants'

export default function QuickMatchSuggestions({
  query,
  deniedPairs,
  onDeny,
  onConfirm,
  matchBusy,
  invoices,
  transactions,
  onUndoAll,
}) {
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
        borderRadius: 3.5,
        border: '1px solid rgba(55,214,122,0.2)',
        background: 'rgba(14, 24, 45, 0.65)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
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
          {deniedPairs.size > 0 && (
            <Button
              size="small"
              variant="text"
              startIcon={<UndoRoundedIcon fontSize="small" />}
              onClick={onUndoAll}
              sx={{ ml: 'auto', textTransform: 'none' }}
            >
              Undo {deniedPairs.size} skipped
            </Button>
          )}
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
              {deniedPairs.size > 0 ? 'All suggestions skipped. Use Undo to restore.' : 'No current suggestions.'}
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
                const trxCurrency = _trx?.original_currency || _trx?.originalCurrency || invCurrency
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
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Invoice
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {s.invoiceNumber || `#${s.invoiceId}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.vendorName || '\u2014'}
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

                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Transaction
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {(_trx?.vendor_name || _trx?.vendorName || s.transactionDescription) || `#${s.transactionId}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.transactionType || '\u2014'}
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
  onUndoAll: PropTypes.func,
}
