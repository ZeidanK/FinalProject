import { useState } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { AnimatePresence, motion } from 'framer-motion'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import { itemVariants } from '../utils/motionVariants'

/**
 * Base styling for installment match group cards.
 *
 * @type {import('@mui/material').SxProps}
 */
const cardBaseSx = {
  borderRadius: 3.5,
  border: '1px solid rgba(129, 191, 255, 0.12)',
  background: 'rgba(14, 24, 45, 0.65)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
}

/**
 * Format a numeric value as a localized decimal amount.
 *
 * @param {number|string} v - Raw amount value.
 * @returns {string} Formatted amount with two decimal places.
 */
const fmtAmount = (v) =>
  (Number(v) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

/**
 * Format a date string or timestamp to the current locale's short date.
 *
 * @param {string|number|Date|null|undefined} d - Date input.
 * @returns {string} Localized date or placeholder when missing.
 */
const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
}

/**
 * Format a date string or timestamp to month and year.
 *
 * @param {string|number|Date|null|undefined} d - Date input.
 * @returns {string|null} Localized month-year string or null when invalid.
 */
const fmtMonth = (d) => {
  if (!d) return null
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

// ── Single installment group card ─────────────────────────────────────────

/**
 * Render a single installment group with progress, confirmed matches, and pending suggestions.
 *
 * @param {object} props
 * @param {object} props.group - Installment suggestion group data.
 * @param {Set<string>} props.deniedTxnIds - IDs of transactions that were skipped.
 * @param {function(string, string): void} props.onDeny - Handler for denying a suggested transaction.
 * @param {function(object, object): void} props.onConfirm - Handler for confirming a suggested transaction.
 * @param {function(string): void} props.onRemoveMatch - Handler for removing an existing match.
 * @param {boolean} props.matchBusy - Whether matching actions are currently disabled.
 * @returns {JSX.Element}
 */
function InstallmentGroup({ group, deniedTxnIds, onDeny, onConfirm, onRemoveMatch, matchBusy }) {
  const [historyOpen, setHistoryOpen] = useState(false)

  const visibleSuggestions = group.suggestedTransactions.filter(
    (t) => !deniedTxnIds.has(`${group.invoiceId}-${t.transactionId}`),
  )

  const total = Number(group.totalAmount) || 0
  const matched = Number(group.alreadyMatchedAmount) || 0
  const progressPct = total > 0 ? Math.min((matched / total) * 100, 100) : 0

  const expected = group.expectedInstallments
  const alreadyCount = group.alreadyMatchedCount || 0
  const pendingCount = visibleSuggestions.length

  const plural = alreadyCount === 1 ? '' : 's'
  const progressLabel = expected
    ? `${alreadyCount} of ${expected} installments matched`
    : `${alreadyCount} installment${plural} matched`

  return (
    <Box
      component={motion.div}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Stack
        spacing={1.5}
        sx={{
          p: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'rgba(251,191,36,0.25)',
          bgcolor: 'rgba(251,191,36,0.04)',
        }}
      >
        {/* Invoice header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box>
            <Typography variant="body2" fontWeight={700}>
              {group.invoiceNumber || `#${group.invoiceId}`}
              {group.vendorName ? ` · ${group.vendorName}` : ''}
            </Typography>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
              <CalendarMonthRoundedIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Invoice date: {fmtDate(group.invoiceDate)}
              </Typography>
            </Stack>
          </Box>
          <Stack alignItems="flex-end" spacing={0.25}>
            <Chip
              label="תשלומים"
              size="small"
              sx={{ bgcolor: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontSize: 11 }}
            />
            <Typography variant="caption" color="text.secondary">
              Total: {fmtAmount(total)}
            </Typography>
          </Stack>
        </Stack>

        {/* Progress bar */}
        <Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {progressLabel}
            </Typography>
            <Typography variant="caption" fontWeight={700} sx={{ color: '#fbbf24' }}>
              {fmtAmount(matched)} / {fmtAmount(total)}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progressPct}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.08)',
              '& .MuiLinearProgress-bar': {
                bgcolor: progressPct >= 100 ? '#37d67a' : '#fbbf24',
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Already matched — collapsible */}
        {alreadyCount > 0 && (
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ cursor: 'pointer', width: 'fit-content' }}
              onClick={() => setHistoryOpen((p) => !p)}
            >
              <Typography variant="caption" color="text.secondary">
                {alreadyCount} confirmed installment{alreadyCount === 1 ? '' : 's'}
              </Typography>
              <IconButton size="small" aria-label="Toggle installment history" sx={{ p: 0 }}>
                <ExpandMoreRoundedIcon
                  fontSize="small"
                  sx={{
                    color: 'text.secondary',
                    transform: historyOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                />
              </IconButton>
            </Stack>
            <Collapse in={historyOpen}>
              <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                {group.existingMatches.map((m) => {
                  const matchId = m.id ?? m.Id
                  const desc =
                    m.transaction_description ?? m.transactionDescription ?? `TXN #${m.transaction_id ?? m.transactionId}`
                  const amt = Number(m.matched_amount ?? m.matchedAmount) || 0
                  const note = m.installment_note ?? m.installmentNote
                  return (
                    <Stack
                      key={matchId}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 1.5,
                        bgcolor: 'rgba(55,214,122,0.05)',
                        border: '1px solid rgba(55,214,122,0.15)',
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CheckCircleRoundedIcon sx={{ fontSize: 14, color: 'success.main' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {desc}
                          </Typography>
                          {note && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', opacity: 0.6 }}>
                              {note}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ ml: 1, flexShrink: 0 }}>
                        <Typography variant="caption" fontWeight={600} sx={{ color: '#37d67a' }}>
                          {fmtAmount(amt)}
                        </Typography>
                        <Tooltip title="Remove match">
                          <span>
                            <IconButton
                              size="small"
                              aria-label="Remove match"
                              onClick={() => onRemoveMatch(matchId)}
                              disabled={matchBusy || !matchId}
                              sx={{ color: 'error.main' }}
                            >
                              <LinkOffRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  )
                })}
              </Stack>
            </Collapse>
          </Box>
        )}

        {/* Divider before pending suggestions */}
        {pendingCount > 0 && <Divider sx={{ borderColor: 'rgba(251,191,36,0.15)' }} />}

        {/* Pending installment transactions to confirm */}
        {pendingCount > 0 && (
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Pending installments ({pendingCount})
            </Typography>
            <AnimatePresence>
              {visibleSuggestions.map((txn) => {
                const month = fmtMonth(txn.postedDate ?? txn.posted_date)
                const desc = txn.description || `TXN #${txn.transactionId}`
                const vendor = txn.vendorName ?? txn.vendor_name
                return (
                  <Box
                    key={txn.transactionId}
                    component={motion.div}
                    layout
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      alignItems={{ sm: 'center' }}
                      justifyContent="space-between"
                      spacing={1}
                      sx={{
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(251,191,36,0.12)',
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <PaymentsRoundedIcon sx={{ fontSize: 14, color: '#fbbf24', flexShrink: 0 }} />
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {vendor || desc}
                          </Typography>
                        </Stack>
                        {vendor && (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {desc}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={1} sx={{ mt: 0.25 }} alignItems="center">
                          {month && (
                            <Chip
                              label={month}
                              size="small"
                              sx={{ bgcolor: 'rgba(251,191,36,0.1)', color: '#fbbf24', height: 18, fontSize: 10 }}
                            />
                          )}
                          <Typography variant="caption" color="text.secondary">
                            Charge date: {fmtDate(txn.postedDate ?? txn.posted_date)}
                          </Typography>
                        </Stack>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#fbbf24' }}>
                          {fmtAmount(txn.chargeAmount ?? txn.charge_amount ?? txn.amount)}
                        </Typography>
                        <Tooltip title="Skip this installment for now">
                          <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            onClick={() => onDeny(group.invoiceId, txn.transactionId)}
                            disabled={matchBusy}
                            sx={{ minWidth: 56 }}
                          >
                            Skip
                          </Button>
                        </Tooltip>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<CheckCircleRoundedIcon fontSize="small" />}
                          onClick={() => onConfirm(group, txn)}
                          disabled={matchBusy}
                          sx={{
                            bgcolor: '#fbbf24',
                            color: '#1a1a0e',
                            '&:hover': { bgcolor: '#f59e0b' },
                            minWidth: 88,
                          }}
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

        {/* Waiting state: no pending transactions right now */}
        {pendingCount === 0 && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
            <HourglassEmptyRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {alreadyCount > 0
                ? 'Waiting for next installment to appear in your transactions.'
                : 'No installment transaction found yet. Waiting for first payment to appear in your transactions.'}
            </Typography>
          </Stack>
        )}
      </Stack>
    </Box>
  )
}

InstallmentGroup.propTypes = {
  group: PropTypes.object.isRequired,
  deniedTxnIds: PropTypes.instanceOf(Set).isRequired,
  onDeny: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onRemoveMatch: PropTypes.func.isRequired,
  matchBusy: PropTypes.bool.isRequired,
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Display a list of installment match groups with loading and empty states.
 *
 * @param {object} props
 * @param {object} props.query - Query result object containing installment group data and loading state.
 * @param {Set<string>} props.deniedTxnIds - IDs of transactions that were skipped.
 * @param {function(string, string): void} props.onDeny - Handler for denying a suggested transaction.
 * @param {function(object, object): void} props.onConfirm - Handler for confirming a suggested transaction.
 * @param {function(string): void} props.onRemoveMatch - Handler for removing an existing match.
 * @param {boolean} props.matchBusy - Whether match actions are currently disabled.
 * @returns {JSX.Element}
 */
export default function InstallmentMatchGroups({ query, deniedTxnIds, onDeny, onConfirm, onRemoveMatch, matchBusy }) {
  const rawGroups = Array.isArray(query.data) ? query.data : []

  // Backend now decides which installment invoices should be tracked in this section.
  const groups = rawGroups

  return (
    <Card
      component={motion.div}
      variants={itemVariants}
      elevation={0}
      sx={{
        ...cardBaseSx,
        borderColor: 'rgba(251,191,36,0.35)',
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <PaymentsRoundedIcon sx={{ color: '#fbbf24' }} />
          <Typography variant="subtitle1" fontWeight={700}>
            Installment Plan Suggestions
          </Typography>
          <Chip
            label={groups.length}
            size="small"
            sx={{ bgcolor: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}
          />
          <Typography variant="caption" color="text.secondary">
            תשלומים · partial matches
          </Typography>
        </Stack>

        {query.isLoading && (
          <Stack spacing={1.5}>
            {['is-1', 'is-2'].map((k) => (
              <Skeleton key={k} variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
        )}

        {!query.isLoading && groups.length === 0 && (
          <Stack alignItems="center" sx={{ py: 3 }}>
            <InboxRoundedIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No installment suggestions at this time.
            </Typography>
          </Stack>
        )}

        {!query.isLoading && groups.length > 0 && (
          <Stack spacing={2}>
            <AnimatePresence>
              {groups.map((g) => (
                <InstallmentGroup
                  key={g.invoiceId}
                  group={g}
                  deniedTxnIds={deniedTxnIds}
                  onDeny={onDeny}
                  onConfirm={onConfirm}
                  onRemoveMatch={onRemoveMatch}
                  matchBusy={matchBusy}
                />
              ))}
            </AnimatePresence>
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

InstallmentMatchGroups.propTypes = {
  query: PropTypes.object.isRequired,
  deniedTxnIds: PropTypes.instanceOf(Set).isRequired,
  onDeny: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onRemoveMatch: PropTypes.func.isRequired,
  matchBusy: PropTypes.bool.isRequired,
}
