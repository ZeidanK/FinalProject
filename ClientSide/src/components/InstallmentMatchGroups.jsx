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
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded'
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import { itemVariants } from '../utils/motionVariants'
import { cardBaseSx } from '../utils/sharedStyles'
import { fmtAmount, fmtDate, fmtMonth } from '../utils/formatters'
import { getInstallmentSuggestionAmount } from '../utils/matchAmounts'

const readFields = (source, keys) => {
  if (!source) return null
  for (const key of keys) {
    const value = source[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return null
}

const readField = (source, snakeKey, camelKey) =>
  readFields(source, [snakeKey, camelKey])

const readArrayField = (source, snakeKey, camelKey) => {
  const value = readField(source, snakeKey, camelKey)
  return Array.isArray(value) ? value : []
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
  const invoiceId = readField(group, 'invoice_id', 'invoiceId')
  const invoiceNumber = readField(group, 'invoice_number', 'invoiceNumber')
  const vendorName = readField(group, 'vendor_name', 'vendorName')
  const invoiceDate = readField(group, 'invoice_date', 'invoiceDate')
  const suggestedTransactions = readArrayField(group, 'suggested_transactions', 'suggestedTransactions')
  const existingMatches = readArrayField(group, 'existing_matches', 'existingMatches')
  const total = Number(readField(group, 'total_amount', 'totalAmount')) || 0
  const matched = Number(readField(group, 'already_matched_amount', 'alreadyMatchedAmount')) || 0
  const expected = readField(group, 'expected_installments', 'expectedInstallments')
  const alreadyCount = Number(readField(group, 'already_matched_count', 'alreadyMatchedCount')) || 0
  const normalizedGroup = {
    ...group,
    invoiceId,
    totalAmount: total,
    alreadyMatchedAmount: matched,
    expectedInstallments: expected,
    alreadyMatchedCount: alreadyCount,
  }

  const visibleSuggestions = suggestedTransactions.filter(
    (t) => !deniedTxnIds.has(`${invoiceId}-${readField(t, 'transaction_id', 'transactionId')}`),
  )

  const progressPct = total > 0 ? Math.min((matched / total) * 100, 100) : 0
  const isFullyMatched = total > 0 && matched >= total - 0.01

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
        spacing={1.1}
        sx={{
          p: 1.35,
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'rgba(251,191,36,0.25)',
          bgcolor: 'rgba(251,191,36,0.04)',
        }}
      >
        {/* Invoice header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box>
            <Typography variant="body2" fontWeight={700}>
              {invoiceNumber || `#${invoiceId}`}
              {vendorName ? ` · ${vendorName}` : ''}
            </Typography>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
              <CalendarMonthRoundedIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Invoice date: {fmtDate(invoiceDate)}
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
                {existingMatches.map((m) => {
                  const matchId = readFields(m, ['id', 'Id', 'match_id', 'matchId'])
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
                        py: 0.55,
                        borderRadius: 1,
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
          <Stack spacing={0.75}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Pending installments ({pendingCount})
            </Typography>
            <AnimatePresence>
              {visibleSuggestions.map((txn) => {
                const transactionId = readField(txn, 'transaction_id', 'transactionId')
                const postedDate = readField(txn, 'posted_date', 'postedDate')
                const month = fmtMonth(postedDate)
                const desc = txn.description || `TXN #${transactionId}`
                const vendor = readField(txn, 'vendor_name', 'vendorName')
                return (
                  <Box
                    key={transactionId}
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
                      spacing={0.85}
                      sx={{
                        px: 1.2,
                        py: 0.75,
                        borderRadius: 1.25,
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
                            Charge date: {fmtDate(postedDate)}
                          </Typography>
                        </Stack>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#fbbf24' }}>
                          {fmtAmount(getInstallmentSuggestionAmount(txn))}
                        </Typography>
                        <Tooltip title="Skip this installment for now">
                          <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            onClick={() => onDeny(invoiceId, transactionId)}
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
                          onClick={() => onConfirm(normalizedGroup, { ...txn, transactionId })}
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
            {isFullyMatched ? (
              <CheckCircleRoundedIcon sx={{ fontSize: 16, color: 'success.main' }} />
            ) : (
              <HourglassEmptyRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            )}
            <Typography variant="caption" color="text.secondary">
              {isFullyMatched
                ? 'Installment invoice fully matched.'
                : alreadyCount > 0
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
  const [open, setOpen] = useState(true)
  const [fullyMatchedOpen, setFullyMatchedOpen] = useState(false)
  const rawGroups = Array.isArray(query.data) ? query.data : []

  const isFullyMatchedGroup = (group) => {
    const total = Number(readField(group, 'total_amount', 'totalAmount')) || 0
    const matched = Number(readField(group, 'already_matched_amount', 'alreadyMatchedAmount')) || 0
    const remainingRaw = readField(group, 'remaining_amount', 'remainingAmount')
    const remaining = remainingRaw == null ? NaN : Number(remainingRaw)
    return total > 0 && (matched >= total - 0.01 || (matched > 0 && Number.isFinite(remaining) && remaining <= 0.01))
  }

  const hasVisiblePending = (group) => {
    const invoiceId = readField(group, 'invoice_id', 'invoiceId')
    return readArrayField(group, 'suggested_transactions', 'suggestedTransactions')
      .some((t) => !deniedTxnIds.has(`${invoiceId}-${readField(t, 'transaction_id', 'transactionId')}`))
  }

  const groups = rawGroups
    .map((group, index) => ({ group, index, hasPending: hasVisiblePending(group) }))
    .sort((a, b) => {
      if (a.hasPending !== b.hasPending) return a.hasPending ? -1 : 1
      return a.index - b.index
    })
    .map(({ group }) => group)
  const activeGroups = groups.filter((group) => !isFullyMatchedGroup(group))
  const fullyMatchedGroups = groups.filter(isFullyMatchedGroup)

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
      <CardContent sx={{ pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: open ? 2 : 0 }}>
          <IconButton
            size="small"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Collapse Installment Plan Suggestions' : 'Expand Installment Plan Suggestions'}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'rgba(255,255,255,0.02)',
            }}
          >
            {open ? (
              <KeyboardArrowUpRoundedIcon fontSize="small" />
            ) : (
              <KeyboardArrowDownRoundedIcon fontSize="small" />
            )}
          </IconButton>
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

        <Collapse in={open} timeout="auto" unmountOnExit>
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

          {!query.isLoading && activeGroups.length > 0 && (
            <Stack spacing={1.25}>
              <AnimatePresence>
                {activeGroups.map((g) => (
                  <InstallmentGroup
                    key={readField(g, 'invoice_id', 'invoiceId')}
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

          {!query.isLoading && fullyMatchedGroups.length > 0 && (
            <Box sx={{ mt: activeGroups.length > 0 ? 2 : 0 }}>
              {activeGroups.length > 0 && <Divider sx={{ borderColor: 'rgba(55,214,122,0.15)', mb: 1.25 }} />}
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton
                  size="small"
                  onClick={() => setFullyMatchedOpen((value) => !value)}
                  aria-label={
                    fullyMatchedOpen
                      ? 'Collapse fully matched installment invoices'
                      : 'Expand fully matched installment invoices'
                  }
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'rgba(255,255,255,0.02)',
                  }}
                >
                  {fullyMatchedOpen ? (
                    <KeyboardArrowUpRoundedIcon fontSize="small" />
                  ) : (
                    <KeyboardArrowDownRoundedIcon fontSize="small" />
                  )}
                </IconButton>
                <CheckCircleRoundedIcon sx={{ fontSize: 18, color: 'success.main' }} />
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  Fully matched installment invoices
                </Typography>
                <Chip
                  label={fullyMatchedGroups.length}
                  size="small"
                  sx={{ bgcolor: 'rgba(55,214,122,0.12)', color: 'success.main' }}
                />
              </Stack>
              <Collapse in={fullyMatchedOpen} timeout="auto" unmountOnExit>
                <Stack spacing={1.25} sx={{ mt: 1 }}>
                  {fullyMatchedGroups.map((g) => (
                    <InstallmentGroup
                      key={readField(g, 'invoice_id', 'invoiceId')}
                      group={g}
                      deniedTxnIds={deniedTxnIds}
                      onDeny={onDeny}
                      onConfirm={onConfirm}
                      onRemoveMatch={onRemoveMatch}
                      matchBusy={matchBusy}
                    />
                  ))}
                </Stack>
              </Collapse>
            </Box>
          )}
        </Collapse>
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
