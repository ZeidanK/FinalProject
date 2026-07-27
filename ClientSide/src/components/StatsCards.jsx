import PropTypes from 'prop-types'
import { Card, CardContent, Grid, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { cardBaseSx } from '../utils/sharedStyles'
import { itemVariants } from '../utils/motionVariants'

const STAT_DEFS = [
  { label: 'Unmatched Invoices', key: 'unmatchedInvoices', color: '#f59e0b' },
  { label: 'Unmatched Transactions', key: 'unmatchedTransactions', color: '#f59e0b' },
  { label: 'Total Matches', key: 'totalMatches', color: '#37d67a' },
  { label: 'Total Matched', key: 'totalMatched', color: '#58a6ff' },
]

export default function StatsCards({ unmatchedInvoices, unmatchedTransactions, totalMatches, totalMatchedFormatted }) {
  const values = {
    unmatchedInvoices,
    unmatchedTransactions,
    totalMatches,
    totalMatched: totalMatchedFormatted,
  }

  return (
    <Grid container spacing={2} component={motion.div} variants={itemVariants}>
      {STAT_DEFS.map((stat) => (
        <Grid size={{ xs: 6, md: 3 }} key={stat.key}>
          <Card elevation={0} sx={cardBaseSx}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {stat.label}
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ color: stat.color, mt: 0.5 }}>
                {values[stat.key]}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

StatsCards.propTypes = {
  unmatchedInvoices: PropTypes.number.isRequired,
  unmatchedTransactions: PropTypes.number.isRequired,
  totalMatches: PropTypes.number.isRequired,
  totalMatchedFormatted: PropTypes.string.isRequired,
}
