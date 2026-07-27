import PropTypes from 'prop-types'
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded'
import { motion } from 'framer-motion'
import { cardBaseSx } from '../utils/sharedStyles'
import { itemVariants } from '../utils/motionVariants'
import { fmtAmount } from '../utils/formatters'

const getConfidenceChipColor = (confidence) => {
  if (confidence >= 0.8) return 'success'
  if (confidence >= 0.5) return 'warning'
  return 'default'
}

export default function SuggestionPanel({ suggestions, onSelect }) {
  if (!suggestions || suggestions.length === 0) return null

  return (
    <Card
      component={motion.div}
      variants={itemVariants}
      elevation={0}
      sx={{ ...cardBaseSx, borderColor: 'rgba(88,166,255,0.35)' }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <AutoFixHighRoundedIcon sx={{ color: '#58a6ff' }} />
          <Typography variant="subtitle1" fontWeight={700}>AI Suggestions</Typography>
        </Stack>
        <Stack spacing={1.5}>
          {suggestions.map((s) => {
            const trxId = s.id ?? s.transaction_id ?? s.transactionId
            const rawScore = Number(s.matchScore ?? s.match_score ?? s.match_confidence ?? s.matchConfidence ?? 0)
            const confidence = rawScore > 1 ? rawScore / 100 : rawScore
            const desc = s.description ?? s.transaction_description ?? s.transactionDescription ?? `Transaction #${trxId}`
            const amt = Number(s.amount ?? s.transaction_amount ?? s.transactionAmount ?? 0)
            return (
              <Stack
                key={trxId}
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ sm: 'center' }}
                justifyContent="space-between"
                spacing={1}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1 }}>
                  <Chip
                    label={`${Math.round(confidence * 100)}%`}
                    size="small"
                    color={getConfidenceChipColor(confidence)}
                  />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{desc}</Typography>
                    <Typography variant="caption" color="text.secondary">Amount: {fmtAmount(amt)}</Typography>
                  </Box>
                </Stack>
                <Button size="small" variant="outlined" onClick={() => onSelect(trxId)}>Select</Button>
              </Stack>
            )
          })}
        </Stack>
      </CardContent>
    </Card>
  )
}

SuggestionPanel.propTypes = {
  suggestions: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
}
