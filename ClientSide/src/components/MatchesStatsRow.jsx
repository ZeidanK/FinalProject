import PropTypes from 'prop-types'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { motion } from 'framer-motion'

const statItems = [
  { label: 'Unmatched Invoices', key: 'invoices', color: '#f59e0b', icon: '\uD83D\uDCCB' },
  { label: 'Unmatched Transactions', key: 'transactions', color: '#f59e0b', icon: '\uD83C\uDFE6' },
  { label: 'In Review', key: 'inReview', color: '#58a6ff', icon: '\uD83D\uDD0D' },
  { label: 'Total Matches', key: 'matches', color: '#37d67a', icon: '\u2705' },
  { label: 'Total Matched', key: 'amount', color: '#58a6ff', icon: '\uD83D\uDCB0' },
]

export default function MatchesStatsRow({
  unmatchedInvoices,
  unmatchedTransactions,
  inReviewCount,
  totalMatches,
  totalMatchedFormatted,
}) {
  const values = {
    invoices: unmatchedInvoices,
    transactions: unmatchedTransactions,
    inReview: inReviewCount,
    matches: totalMatches,
    amount: totalMatchedFormatted,
  }

  return (
    <Stack
      component={motion.div}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      direction="row"
      spacing={1.5}
      sx={{ overflowX: 'auto', pb: 0.5 }}
    >
      {statItems.map((stat) => (
        <Paper
          key={stat.key}
          variant="outlined"
          sx={{
            p: 1.5,
            borderRadius: 2.5,
            border: '1px solid rgba(129, 191, 255, 0.1)',
            bgcolor: 'rgba(14, 24, 45, 0.5)',
            backdropFilter: 'blur(8px)',
            minWidth: 140,
            flexShrink: 0,
          }}
        >
          <Stack spacing={0.3}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, letterSpacing: 0.3 }}>
              {stat.icon} {stat.label}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color: stat.color, lineHeight: 1.2 }}>
              {values[stat.key]}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  )
}

MatchesStatsRow.propTypes = {
  unmatchedInvoices: PropTypes.number.isRequired,
  unmatchedTransactions: PropTypes.number.isRequired,
  inReviewCount: PropTypes.number.isRequired,
  totalMatches: PropTypes.number.isRequired,
  totalMatchedFormatted: PropTypes.string.isRequired,
}
