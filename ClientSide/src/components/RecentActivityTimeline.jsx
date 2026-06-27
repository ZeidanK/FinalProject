import PropTypes from 'prop-types'
import { Alert, Box, Chip, Divider, Stack, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import LinkRoundedIcon from '@mui/icons-material/LinkRounded'

const itemShellSx = {
  borderRadius: 3,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'rgba(10,18,34,0.55)',
}

const timelineDotSx = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'rgba(88,166,255,0.09)',
}

const getActivityCategory = (text) => {
  const t = String(text || '').toLowerCase()
  if (t.includes('anomaly') || t.includes('issue detected')) return 'anomaly'
  if (t.includes('match:') || t.includes('match')) return 'match'
  if (t.includes('invoice')) return 'invoice'
  return 'activity'
}

const categoryMeta = {
  invoice: { label: 'Invoice', icon: <LinkRoundedIcon fontSize="small" />, chipColor: 'info' },
  match: { label: 'Match', icon: <CheckCircleRoundedIcon fontSize="small" />, chipColor: 'success' },
  anomaly: { label: 'Anomaly', icon: <ErrorOutlineRoundedIcon fontSize="small" />, chipColor: 'warning' },
  activity: { label: 'Activity', icon: <AccessTimeRoundedIcon fontSize="small" />, chipColor: 'default' },
}

const formatDate = (date) => {
  if (!date) return ''
  try {
    return new Date(date).toLocaleDateString()
  } catch {
    return ''
  }
}

const containerVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.28 } },
}

export default function RecentActivityTimeline({ items, loading }) {
  if (loading) {
    return (
      <Stack spacing={1.5}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              height: 56,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'rgba(255,255,255,0.02)',
            }}
          />
        ))}
      </Stack>
    )
  }

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <Alert severity="info" variant="outlined" icon={<AccessTimeRoundedIcon />}>
        No recent activity to display.
      </Alert>
    )
  }

  return (
    <Stack spacing={1.2}>
      {items.map((item) => {
        const category = getActivityCategory(item.text)
        const meta = categoryMeta[category] || categoryMeta.activity
        const dateLabel = formatDate(item.date)

        return (
          <motion.div key={item.id || `${item.date || ''}-${item.text}`}
            variants={itemVariants}
            initial="hidden"
            animate="show"
          >
            <Box sx={itemShellSx}>
              <Stack direction="row" spacing={1.3} alignItems="flex-start" sx={{ p: 1.3 }}>
                <Box sx={timelineDotSx}>
                  {meta.icon}
                </Box>

                <Stack spacing={0.4} sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                    <Chip label={meta.label} size="small" color={meta.chipColor} variant="outlined" />
                    {dateLabel ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <AccessTimeRoundedIcon fontSize="inherit" />
                        {dateLabel}
                      </Typography>
                    ) : null}
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                    {item.text}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </motion.div>
        )
      })}

      <Divider sx={{ mt: 0.5, opacity: 0.35 }} />
      <Typography variant="caption" color="text.secondary">
        Showing your latest system updates across invoices, matches, and anomalies.
      </Typography>
    </Stack>
  )
}

RecentActivityTimeline.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      date: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      text: PropTypes.string,
    }),
  ),
  loading: PropTypes.bool,
}

RecentActivityTimeline.defaultProps = {
  items: [],
  loading: false,
}

