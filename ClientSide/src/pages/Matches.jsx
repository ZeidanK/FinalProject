import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { getInvoicesByCompany } from '../services/invoices'
import { getTransactionsByCompany } from '../services/transactions'
import {
  getMatchesByCompany,
  getMatchSuggestions,
  createMatch,
  deleteMatch,
  autoMatchOnLoad,
} from '../services/matches'

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', staggerChildren: 0.09 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

const DEFAULT_COMPANY_ID = 1

const cardBaseSx = {
  borderRadius: 3,
  border: '1px solid',
  borderColor: 'divider',
  background: 'linear-gradient(160deg, rgba(14,24,42,0.96), rgba(10,18,34,0.96))',
}

// --------------- helper ---------------
const fmtAmount = (v) =>
  (Number(v) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
}

function MatchesPage() {
  const { user, token } = useAuth()
  const companyId = user?.companyId || DEFAULT_COMPANY_ID

  // ----- Data state -----
  const [invoices, setInvoices] = useState([])
  const [transactions, setTransactions] = useState([])
  const [matches, setMatches] = useState([])
  const [suggestions, setSuggestions] = useState([])

  // ----- Selection state -----
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null)
  const [selectedTransactionId, setSelectedTransactionId] = useState(null)

  // ----- Search state -----
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [transactionSearch, setTransactionSearch] = useState('')

  // ----- Loading / Error / Snack -----
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [matchBusy, setMatchBusy] = useState(false)
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' })

  // ----- Unmatch confirmation dialog -----
  const [unmatchDialog, setUnmatchDialog] = useState({ open: false, matchId: null })

  // ----- Prevent double auto-match in StrictMode -----
  const autoMatchRanRef = useRef(false)

  // ===================== Data Fetching =====================

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      console.log('[MATCH] Loading data for companyId:', companyId)
      const [inv, trx, mat] = await Promise.all([
        getInvoicesByCompany(companyId, { isMatched: false }, token),
        getTransactionsByCompany(companyId, { isMatched: false }, token),
        getMatchesByCompany(companyId, token),
      ])
      console.log(`[MATCH] Loaded: ${Array.isArray(inv) ? inv.length : 0} invoices, ${Array.isArray(trx) ? trx.length : 0} transactions, ${Array.isArray(mat) ? mat.length : 0} matches`)
      setInvoices(Array.isArray(inv) ? inv : [])
      setTransactions(Array.isArray(trx) ? trx : [])
      setMatches(Array.isArray(mat) ? mat : [])
    } catch (err) {
      console.error('[MATCH] Failed to load data:', err)
      setError(err.message || 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }, [companyId, token])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-match once on mount
  useEffect(() => {
    if (autoMatchRanRef.current) return
    autoMatchRanRef.current = true

    const runAutoMatch = async () => {
      try {
        console.log('[MATCH] Starting auto-match on load...')
        const matchResult = await autoMatchOnLoad(companyId, 70, token)
        console.log('[MATCH] Auto-match result:', matchResult)
        if (matchResult?.successfulMatches > 0) {
          setSnack({
            open: true,
            message: `✓ ${matchResult.successfulMatches} automatic match(es) found`,
            severity: 'success',
          })
          await loadData()
        }
      } catch (matchErr) {
        console.warn('[MATCH] Auto-match on load failed:', matchErr)
      }
    }
    runAutoMatch()
  }, [companyId, token, loadData])

  // ---- Fetch suggestions when an invoice is selected ----
  useEffect(() => {
    if (!selectedInvoiceId) {
      setSuggestions([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        console.log('[MATCH] Fetching suggestions for invoiceId:', selectedInvoiceId)
        const data = await getMatchSuggestions(selectedInvoiceId, token)
        console.log('[MATCH] Raw suggestions response:', JSON.stringify(data, null, 2))
        console.log('[MATCH] Suggestions count:', Array.isArray(data) ? data.length : 'not an array')
        if (Array.isArray(data) && data.length > 0) {
          console.log('[MATCH] First suggestion fields:', Object.keys(data[0]))
          console.log('[MATCH] First suggestion:', data[0])
        }
        if (!cancelled) setSuggestions(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('[MATCH] Suggestions fetch error:', err)
        if (!cancelled) setSuggestions([])
      }
    })()
    return () => { cancelled = true }
  }, [selectedInvoiceId, token])

  // ===================== Handlers =====================

  const handleCreateMatch = useCallback(async () => {
    if (!selectedInvoiceId || !selectedTransactionId) return
    const inv = invoices.find((i) => i.id === selectedInvoiceId)
    const trx = transactions.find((t) => t.id === selectedTransactionId)
    if (!inv || !trx) return

    setMatchBusy(true)
    try {
      await createMatch(
        {
          invoiceId: inv.id,
          transactionId: trx.id,
          matchedAmount: Math.min(
            Math.abs(Number(inv.total_amount ?? inv.totalAmount) || 0),
            Math.abs(Number(trx.amount) || 0),
          ),
          matchMethod: 'manual',
          matchType: 'full',
          matchConfidence: 1.0,
        },
        token,
      )
      setSelectedInvoiceId(null)
      setSelectedTransactionId(null)
      setSuggestions([])
      setSnack({ open: true, message: 'Match created successfully!', severity: 'success' })
      await loadData()
    } catch (err) {
      setSnack({ open: true, message: err.message || 'Failed to create match.', severity: 'error' })
    } finally {
      setMatchBusy(false)
    }
  }, [selectedInvoiceId, selectedTransactionId, invoices, transactions, token, loadData])

  const confirmUnmatch = useCallback((matchId) => {
    setUnmatchDialog({ open: true, matchId })
  }, [])

  const handleUnmatch = useCallback(async () => {
    const matchId = unmatchDialog.matchId
    setUnmatchDialog({ open: false, matchId: null })
    if (!matchId) return
    try {
      await deleteMatch(matchId, token)
      setSnack({ open: true, message: 'Match removed.', severity: 'success' })
      await loadData()
    } catch (err) {
      setSnack({ open: true, message: err.message || 'Failed to remove match.', severity: 'error' })
    }
  }, [unmatchDialog.matchId, token, loadData])

  const handleAcceptSuggestion = useCallback((transactionId) => {
    setSelectedTransactionId(transactionId)
  }, [])

  // ===================== Filtered lists =====================

  const filteredInvoices = invoices.filter((inv) => {
    const q = invoiceSearch.toLowerCase()
    if (!q) return true
    const vendor = (inv.vendor_name || inv.vendorName || '').toLowerCase()
    const num = (inv.invoice_number || inv.invoiceNumber || '').toLowerCase()
    return vendor.includes(q) || num.includes(q)
  })

  const filteredTransactions = transactions.filter((trx) => {
    const q = transactionSearch.toLowerCase()
    if (!q) return true
    return (trx.description || '').toLowerCase().includes(q)
  })

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId)
  const selectedTransaction = transactions.find((t) => t.id === selectedTransactionId)

  // ===================== Render =====================

  return (
    <Box
      sx={{
        py: { xs: 4, md: 6 },
        background:
          'radial-gradient(circle at 0% 5%, rgba(88,166,255,0.25), transparent 34%), radial-gradient(circle at 100% 0%, rgba(66,130,255,0.16), transparent 28%), linear-gradient(180deg, #070b14 0%, #091021 62%, #0b1324 100%)',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          component={motion.div}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          spacing={3}
        >
          {/* ---- Page Header ---- */}
          <Card
            component={motion.div}
            variants={itemVariants}
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              background:
                'linear-gradient(135deg, rgba(14,25,45,0.98), rgba(9,17,33,0.97))',
              boxShadow: '0 24px 54px rgba(0,0,0,0.42)',
            }}
          >
            <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                alignItems={{ xs: 'flex-start', md: 'center' }}
                justifyContent="space-between"
                spacing={2}
              >
                <Stack spacing={0.5}>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '1.9rem' } }}>
                    Matches
                  </Typography>
                  <Typography color="text.secondary">
                    Match invoices to bank transactions for reconciliation.
                  </Typography>
                </Stack>
                <Button
                  variant="outlined"
                  startIcon={<RefreshRoundedIcon />}
                  onClick={loadData}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* ---- Stats Cards ---- */}
          <Grid
            container
            spacing={2}
            component={motion.div}
            variants={itemVariants}
          >
            {[
              { label: 'Unmatched Invoices', value: invoices.length, color: '#f59e0b' },
              { label: 'Unmatched Transactions', value: transactions.length, color: '#f59e0b' },
              { label: 'Total Matches', value: matches.length, color: '#37d67a' },
              {
                label: 'Total Matched',
                value: fmtAmount(
                  matches.reduce(
                    (sum, m) => sum + (Number(m.matched_amount ?? m.matchedAmount) || 0),
                    0,
                  ),
                ),
                color: '#58a6ff',
                prefix: '$',
              },
            ].map((stat) => (
              <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
                <Card elevation={0} sx={cardBaseSx}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {stat.label}
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      sx={{ color: stat.color, mt: 0.5 }}
                    >
                      {stat.prefix && stat.value !== '0.00' ? '' : ''}
                      {stat.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* ---- Error Alert ---- */}
          {error && (
            <Alert
              severity="error"
              variant="outlined"
              onClose={() => setError('')}
              action={
                <Button color="inherit" size="small" onClick={loadData}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          {/* ---- AI Suggestions ---- */}
          {suggestions.length > 0 && (
            <Card
              component={motion.div}
              variants={itemVariants}
              elevation={0}
              sx={{
                ...cardBaseSx,
                borderColor: 'rgba(88,166,255,0.35)',
                background:
                  'linear-gradient(135deg, rgba(20,35,65,0.96), rgba(12,22,42,0.96))',
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <AutoFixHighRoundedIcon sx={{ color: '#58a6ff' }} />
                  <Typography variant="subtitle1" fontWeight={700}>
                    AI Suggestions
                  </Typography>
                </Stack>
                <Stack spacing={1.5}>
                  {suggestions.map((s) => {
                    const trxId = s.id ?? s.transaction_id ?? s.transactionId
                    const rawScore = Number(s.matchScore ?? s.match_score ?? s.match_confidence ?? s.matchConfidence ?? 0)
                    // matchScore from backend is 0-100 (Gemini similarity %)
                    const confidence = rawScore > 1 ? rawScore / 100 : rawScore
                    const desc = s.description ?? s.transaction_description ?? s.transactionDescription ?? `Transaction #${trxId}`
                    const amt = Number(s.amount ?? s.transaction_amount ?? s.transactionAmount ?? 0)
                    const reasons = s.matchReasons ?? s.match_reasons ?? []
                    console.log(`[MATCH] Rendering suggestion: trxId=${trxId} confidence=${confidence} desc="${desc}" amount=${amt} reasons=`, reasons)
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
                            color={confidence >= 0.8 ? 'success' : confidence >= 0.5 ? 'warning' : 'default'}
                          />
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {desc}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Amount: {fmtAmount(amt)}
                            </Typography>
                          </Box>
                        </Stack>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleAcceptSuggestion(trxId)}
                        >
                          Select
                        </Button>
                      </Stack>
                    )
                  })}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* ---- Two-Panel Matching Interface ---- */}
          <Grid container spacing={2.5}>
            {/* -- Invoices Panel -- */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                component={motion.div}
                variants={itemVariants}
                elevation={0}
                sx={cardBaseSx}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <ReceiptLongRoundedIcon sx={{ color: '#a9d5ff' }} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Unmatched Invoices
                    </Typography>
                    <Chip label={filteredInvoices.length} size="small" />
                  </Stack>
                  <TextField
                    placeholder="Search by vendor or invoice #…"
                    size="small"
                    fullWidth
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchRoundedIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ maxHeight: 380, overflowY: 'auto', pr: 0.5 }}>
                    {loading ? (
                      <Stack spacing={1}>
                        {[...Array(4)].map((_, i) => (
                          <Skeleton key={i} variant="rectangular" height={64} sx={{ borderRadius: 2 }} />
                        ))}
                      </Stack>
                    ) : filteredInvoices.length === 0 ? (
                      <Stack alignItems="center" sx={{ py: 4 }}>
                        <InboxRoundedIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                        <Typography color="text.secondary" variant="body2">
                          {invoiceSearch ? 'No invoices match your search.' : 'All invoices are matched!'}
                        </Typography>
                      </Stack>
                    ) : (
                      <Stack spacing={1}>
                        <AnimatePresence>
                          {filteredInvoices.map((inv) => {
                            const id = inv.id
                            const isSelected = id === selectedInvoiceId
                            return (
                              <Box
                                key={id}
                                component={motion.div}
                                layout
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                onClick={() => setSelectedInvoiceId(isSelected ? null : id)}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 2,
                                  cursor: 'pointer',
                                  border: '2px solid',
                                  borderColor: isSelected ? 'primary.main' : 'divider',
                                  bgcolor: isSelected ? 'rgba(88,166,255,0.08)' : 'rgba(255,255,255,0.02)',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    borderColor: isSelected ? 'primary.main' : 'rgba(88,166,255,0.4)',
                                    bgcolor: 'rgba(88,166,255,0.05)',
                                  },
                                }}
                              >
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="flex-start"
                                >
                                  <Box>
                                    <Typography variant="body2" fontWeight={600}>
                                      {inv.invoice_number || inv.invoiceNumber || '—'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {inv.vendor_name || inv.vendorName || '—'}
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" fontWeight={700}>
                                    {fmtAmount(inv.total_amount ?? inv.totalAmount)}
                                  </Typography>
                                </Stack>
                                <Typography variant="caption" color="text.secondary">
                                  {fmtDate(inv.invoice_date || inv.invoiceDate)}
                                </Typography>
                              </Box>
                            )
                          })}
                        </AnimatePresence>
                      </Stack>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* -- Transactions Panel -- */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                component={motion.div}
                variants={itemVariants}
                elevation={0}
                sx={cardBaseSx}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <AccountBalanceRoundedIcon sx={{ color: '#a9d5ff' }} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Unmatched Transactions
                    </Typography>
                    <Chip label={filteredTransactions.length} size="small" />
                  </Stack>
                  <TextField
                    placeholder="Search by description…"
                    size="small"
                    fullWidth
                    value={transactionSearch}
                    onChange={(e) => setTransactionSearch(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchRoundedIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ maxHeight: 380, overflowY: 'auto', pr: 0.5 }}>
                    {loading ? (
                      <Stack spacing={1}>
                        {[...Array(4)].map((_, i) => (
                          <Skeleton key={i} variant="rectangular" height={64} sx={{ borderRadius: 2 }} />
                        ))}
                      </Stack>
                    ) : filteredTransactions.length === 0 ? (
                      <Stack alignItems="center" sx={{ py: 4 }}>
                        <InboxRoundedIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                        <Typography color="text.secondary" variant="body2">
                          {transactionSearch
                            ? 'No transactions match your search.'
                            : 'All transactions are matched!'}
                        </Typography>
                      </Stack>
                    ) : (
                      <Stack spacing={1}>
                        <AnimatePresence>
                          {filteredTransactions.map((trx) => {
                            const id = trx.id
                            const isSelected = id === selectedTransactionId
                            return (
                              <Box
                                key={id}
                                component={motion.div}
                                layout
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                onClick={() => setSelectedTransactionId(isSelected ? null : id)}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 2,
                                  cursor: 'pointer',
                                  border: '2px solid',
                                  borderColor: isSelected ? 'primary.main' : 'divider',
                                  bgcolor: isSelected ? 'rgba(88,166,255,0.08)' : 'rgba(255,255,255,0.02)',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    borderColor: isSelected ? 'primary.main' : 'rgba(88,166,255,0.4)',
                                    bgcolor: 'rgba(88,166,255,0.05)',
                                  },
                                }}
                              >
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="flex-start"
                                >
                                  <Box>
                                    <Typography variant="body2" fontWeight={600}>
                                      {trx.description || '—'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {trx.type || trx.transaction_type || ''}
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" fontWeight={700}>
                                    {fmtAmount(trx.amount)}
                                  </Typography>
                                </Stack>
                                <Typography variant="caption" color="text.secondary">
                                  {fmtDate(trx.transaction_date || trx.transactionDate)}
                                </Typography>
                              </Box>
                            )
                          })}
                        </AnimatePresence>
                      </Stack>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ---- Match Action Bar ---- */}
          {(selectedInvoiceId || selectedTransactionId) && (
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              elevation={0}
              sx={{
                ...cardBaseSx,
                borderColor: 'primary.main',
                background:
                  'linear-gradient(135deg, rgba(20,35,65,0.97), rgba(12,22,42,0.97))',
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
                      <Typography variant="caption" color="text.secondary">
                        Invoice
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedInvoice
                          ? selectedInvoice.invoice_number || selectedInvoice.invoiceNumber || '—'
                          : 'None'}
                      </Typography>
                    </Box>
                    <CompareArrowsRoundedIcon sx={{ color: 'text.secondary' }} />
                    <Box sx={{ textAlign: 'center', minWidth: 100 }}>
                      <Typography variant="caption" color="text.secondary">
                        Transaction
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedTransaction
                          ? selectedTransaction.description || `#${selectedTransaction.id}`
                          : 'None'}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1.5}>
                    <Button
                      variant="text"
                      onClick={() => {
                        setSelectedInvoiceId(null)
                        setSelectedTransactionId(null)
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<CheckCircleRoundedIcon />}
                      disabled={!selectedInvoiceId || !selectedTransactionId || matchBusy}
                      onClick={handleCreateMatch}
                    >
                      {matchBusy ? 'Matching…' : 'Create Match'}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* ---- Matched Items ---- */}
          <Card
            component={motion.div}
            variants={itemVariants}
            elevation={0}
            sx={cardBaseSx}
          >
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Matched Items ({matches.length})
              </Typography>

              {loading ? (
                <Stack spacing={1}>
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
                  ))}
                </Stack>
              ) : matches.length === 0 ? (
                <Stack alignItems="center" sx={{ py: 5 }}>
                  <CompareArrowsRoundedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary">
                    No matches yet. Select an invoice and a transaction above to create one.
                  </Typography>
                </Stack>
              ) : (
                <Stack spacing={1}>
                  <AnimatePresence>
                    {matches.map((m) => {
                      const id = m.id
                      const invLabel =
                        m.invoice_number || m.invoiceNumber || `Invoice #${m.invoice_id ?? m.invoiceId ?? '?'}`
                      const trxLabel =
                        m.transaction_description ||
                        m.transactionDescription ||
                        `Transaction #${m.transaction_id ?? m.transactionId ?? '?'}`
                      const amount = Number(m.matched_amount ?? m.matchedAmount) || 0
                      const method = m.match_method || m.matchMethod || '—'
                      const confidence = Number(m.match_confidence ?? m.matchConfidence ?? 0)

                      return (
                        <Stack
                          key={id}
                          component={motion.div}
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          direction={{ xs: 'column', sm: 'row' }}
                          alignItems={{ sm: 'center' }}
                          justifyContent="space-between"
                          spacing={1}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: 'rgba(55,214,122,0.05)',
                            border: '1px solid',
                            borderColor: 'rgba(55,214,122,0.25)',
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1 }}>
                            <CheckCircleRoundedIcon sx={{ color: 'success.main' }} />
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {invLabel} ↔ {trxLabel}
                              </Typography>
                              <Stack direction="row" spacing={1} sx={{ mt: 0.3 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Amount: {fmtAmount(amount)}
                                </Typography>
                                <Chip label={method} size="small" variant="outlined" />
                                {confidence > 0 && (
                                  <Chip
                                    label={`${Math.round(confidence * 100)}%`}
                                    size="small"
                                    color={confidence >= 0.8 ? 'success' : 'warning'}
                                    variant="outlined"
                                  />
                                )}
                              </Stack>
                            </Box>
                          </Stack>
                          <Tooltip title="Remove match">
                            <IconButton
                              size="small"
                              onClick={() => confirmUnmatch(id)}
                              sx={{ color: 'error.main' }}
                            >
                              <LinkOffRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )
                    })}
                  </AnimatePresence>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Container>

      {/* ---- Unmatch Confirmation Dialog ---- */}
      <Dialog
        open={unmatchDialog.open}
        onClose={() => setUnmatchDialog({ open: false, matchId: null })}
      >
        <DialogTitle>Remove Match</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to unmatch these items? Both the invoice and
            transaction will return to the unmatched lists.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnmatchDialog({ open: false, matchId: null })}>
            Cancel
          </Button>
          <Button onClick={handleUnmatch} color="error" variant="contained">
            Unmatch
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- Snackbar ---- */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default MatchesPage
