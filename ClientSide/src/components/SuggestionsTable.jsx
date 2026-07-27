import { useState } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded'
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'
import UndoRoundedIcon from '@mui/icons-material/UndoRounded'
import { motion, AnimatePresence } from 'framer-motion'
import { cardBaseSx } from '../utils/sharedStyles'
import { itemVariants } from '../utils/motionVariants'
import { fmtAmount, fmtDate } from '../utils/formatters'

function SuggestionRow({ suggestion, type, onConfirm, onDeny, matchBusy }) {
  const { invoiceId, transactionId, invoiceNumber, vendorName, invoiceAmount, invoiceDate, transactionDescription, transactionAmount, transactionDate, confidence, reason } = suggestion
  const confPct = confidence != null ? Math.round(confidence * 100) : null

  return (
    <Box
      component={motion.div}
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(88,166,255,0.15)', bgcolor: 'rgba(88,166,255,0.03)' }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={1.5}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {type === 'ai' && <AutoFixHighRoundedIcon sx={{ fontSize: 16, color: '#58a6ff' }} />}
            <Typography variant="body2" fontWeight={600} noWrap>
              {invoiceNumber || `#${invoiceId}`}
            </Typography>
            <CompareArrowsRoundedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Typography variant="body2" fontWeight={600} noWrap>
              {vendorName || transactionDescription || `#${transactionId}`}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5} sx={{ mt: 0.3 }} flexWrap="wrap">
            <Typography variant="caption" color="text.secondary">
              {fmtAmount(invoiceAmount)} ↔ {fmtAmount(transactionAmount)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {fmtDate(invoiceDate)} | {fmtDate(transactionDate)}
            </Typography>
            {confPct != null && (
              <Chip
                label={`${confPct}%`}
                size="small"
                sx={{
                  height: 18, fontSize: 10,
                  bgcolor: confPct >= 80 ? 'rgba(55,214,122,0.15)' : confPct >= 50 ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)',
                  color: confPct >= 80 ? '#37d67a' : confPct >= 50 ? '#fbbf24' : '#f87171',
                }}
              />
            )}
            {reason && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                {reason}
              </Typography>
            )}
          </Stack>
        </Box>
        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
          <Button size="small" variant="outlined" color="error" onClick={onDeny} disabled={matchBusy} sx={{ minWidth: 36, px: 1 }}>
            <CancelRoundedIcon fontSize="small" />
          </Button>
          <Button size="small" variant="contained" color="success" startIcon={<CheckCircleRoundedIcon fontSize="small" />} onClick={onConfirm} disabled={matchBusy}>
            Confirm
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}

SuggestionRow.propTypes = {
  suggestion: PropTypes.object.isRequired,
  type: PropTypes.oneOf(['ai', 'quick', 'installment']),
  onConfirm: PropTypes.func.isRequired,
  onDeny: PropTypes.func.isRequired,
  matchBusy: PropTypes.bool,
}

export default function SuggestionsTable({
  title,
  icon: Icon,
  color,
  suggestions,
  type,
  loading,
  emptyMessage,
  deniedCount,
  onUndoAll,
  onConfirm,
  onDeny,
  matchBusy,
}) {
  const [open, setOpen] = useState(true)

  return (
    <Card component={motion.div} variants={itemVariants} elevation={0} sx={{ ...cardBaseSx, borderColor: `${color}33` }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: open ? 1.5 : 0 }}>
          <IconButton size="small" onClick={() => setOpen((v) => !v)} sx={{ border: '1px solid', borderColor: 'divider' }}>
            {open ? <KeyboardArrowUpRoundedIcon fontSize="small" /> : <KeyboardArrowDownRoundedIcon fontSize="small" />}
          </IconButton>
          {Icon && <Icon sx={{ color, fontSize: 20 }} />}
          <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
          <Chip label={suggestions.length} size="small" sx={{ bgcolor: `${color}1A`, color, fontWeight: 600 }} />
          {deniedCount > 0 && (
            <Button size="small" variant="text" startIcon={<UndoRoundedIcon fontSize="small" />} onClick={onUndoAll} sx={{ ml: 'auto', textTransform: 'none', fontSize: 12 }}>
              Undo {deniedCount} skipped
            </Button>
          )}
        </Stack>
        <Collapse in={open}>
          {loading ? (
            <Stack spacing={1}>
              {[1, 2].map((k) => <Box key={k} sx={{ height: 56, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)' }} />)}
            </Stack>
          ) : suggestions.length === 0 ? (
            <Stack alignItems="center" sx={{ py: 2 }}>
              <InboxRoundedIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 0.5 }} />
              <Typography variant="body2" color="text.secondary">{emptyMessage || 'No suggestions.'}</Typography>
            </Stack>
          ) : (
            <Stack spacing={1}>
              <AnimatePresence>
                {suggestions.map((s, i) => (
                  <SuggestionRow key={`${s.invoiceId}-${s.transactionId}-${i}`} suggestion={s} type={type} onConfirm={() => onConfirm(s)} onDeny={() => onDeny(s)} matchBusy={matchBusy} />
                ))}
              </AnimatePresence>
            </Stack>
          )}
        </Collapse>
      </CardContent>
    </Card>
  )
}

SuggestionsTable.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  color: PropTypes.string.isRequired,
  suggestions: PropTypes.array.isRequired,
  type: PropTypes.oneOf(['ai', 'quick', 'installment']),
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  deniedCount: PropTypes.number,
  onUndoAll: PropTypes.func,
  onConfirm: PropTypes.func.isRequired,
  onDeny: PropTypes.func.isRequired,
  matchBusy: PropTypes.bool,
}
