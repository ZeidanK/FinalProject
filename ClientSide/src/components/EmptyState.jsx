import PropTypes from 'prop-types'
import { Button, Stack, Typography } from '@mui/material'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import { motion } from 'framer-motion'
import GlassCard from './GlassCard'

const PAGE_ICONS = {
  invoices: DescriptionRoundedIcon,
  transactions: AccountBalanceRoundedIcon,
  matches: SearchOffRoundedIcon,
  anomalies: ErrorOutlineRoundedIcon,
  default: InboxRoundedIcon,
}

function EmptyState({ title, description, actionLabel, onAction, secondaryActionLabel, onSecondaryAction, icon, page }) {
  const IconComponent = icon || PAGE_ICONS[page] || PAGE_ICONS.default

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <GlassCard variant="default" sx={{ textAlign: 'center', py: 4 }}>
        <Stack spacing={1.5} alignItems="center">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <IconComponent sx={{ fontSize: 56, color: 'rgba(129, 191, 255, 0.5)' }} />
          </motion.div>
          <Typography variant="h6" fontWeight={700}>{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
            {description}
          </Typography>
          <Stack direction="row" spacing={1.5}>
            {actionLabel && (
              <Button variant="contained" onClick={onAction} size="small">
                {actionLabel}
              </Button>
            )}
            {secondaryActionLabel && (
              <Button variant="outlined" onClick={onSecondaryAction} size="small">
                {secondaryActionLabel}
              </Button>
            )}
          </Stack>
        </Stack>
      </GlassCard>
    </motion.div>
  )
}

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  secondaryActionLabel: PropTypes.string,
  onSecondaryAction: PropTypes.func,
  icon: PropTypes.elementType,
  page: PropTypes.string,
}

export default EmptyState
