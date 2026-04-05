import { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'
import { motion } from 'framer-motion'
import PageHeaderCard from '../components/PageHeaderCard'
import PageSectionLayout from '../components/PageSectionLayout'
import SnackbarAlert from '../components/SnackbarAlert'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import {
  getAnomaliesByCompany,
  getAnomalyById,
  getAnomalyStats,
  resolveAnomaly,
} from '../services/anomalies'
import { itemVariants } from '../utils/motionVariants'

const severityColors = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  critical: 'error',
}

const statusColors = {
  open: 'warning',
  resolved: 'success',
  dismissed: 'default',
  false_positive: 'info',
}

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'false_positive', label: 'False Positive' },
]

const severityOptions = [
  { value: '', label: 'All severities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const typeOptions = [
  { value: '', label: 'All types' },
  { value: 'amount_mismatch', label: 'Amount Mismatch' },
  { value: 'date_gap', label: 'Date Gap' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'missing_link', label: 'Missing Link' },
  { value: 'manual', label: 'Manual' },
]

const fmtAmount = (value) => {
  if (value === null || value === undefined) return '—'
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const fmtDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

const toLabel = (value) => {
  if (!value) return '—'
  return String(value)
    .replaceAll('_', ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getListContent({ listLoading, listError, anomalies, onOpenDetails }) {
  if (listLoading) {
    return (
      <Stack spacing={1}>
        {['rows-1', 'rows-2', 'rows-3', 'rows-4', 'rows-5'].map((key) => (
          <Skeleton key={key} variant="rectangular" height={64} sx={{ borderRadius: 2 }} />
        ))}
      </Stack>
    )
  }

  if (listError) {
    return <Alert severity="error">{listError}</Alert>
  }

  if (anomalies.length === 0) {
    return (
      <Stack alignItems="center" spacing={1} sx={{ py: 6 }}>
        <InboxRoundedIcon sx={{ fontSize: 42, color: 'text.secondary' }} />
        <Typography variant="h6">No anomalies found</Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Try adjusting your filters or search query.
        </Typography>
      </Stack>
    )
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Severity</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {anomalies.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>{toLabel(item.anomalyType)}</TableCell>
              <TableCell>
                <Stack spacing={0.2}>
                  <Typography variant="body2" fontWeight={600}>
                    {item.title || 'Untitled anomaly'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {item.description || 'No description'}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={toLabel(item.severity)}
                  color={severityColors[item.severity] || 'default'}
                />
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={toLabel(item.status)}
                  color={statusColors[item.status] || 'default'}
                />
              </TableCell>
              <TableCell align="right">{fmtAmount(item.amount)}</TableCell>
              <TableCell>{fmtDate(item.createdAt)}</TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  variant="text"
                  startIcon={<VisibilityRoundedIcon fontSize="small" />}
                  onClick={() => onOpenDetails(item.id)}
                >
                  Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function getDetailsContent({ detailsLoading, detailsError, selectedAnomaly, resolutionNotes, setResolutionNotes }) {
  if (detailsLoading) {
    return (
      <Stack spacing={1.2}>
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="rectangular" height={90} sx={{ borderRadius: 2 }} />
      </Stack>
    )
  }

  if (detailsError) {
    return <Alert severity="error">{detailsError}</Alert>
  }

  if (!selectedAnomaly) {
    return <Alert severity="info">No anomaly details available.</Alert>
  }

  const isOpen = selectedAnomaly.status === 'open'
  const confidence =
    selectedAnomaly.detectionConfidence !== null && selectedAnomaly.detectionConfidence !== undefined
      ? ` (${Math.round(Number(selectedAnomaly.detectionConfidence) * 100)}%)`
      : ''

  return (
    <Stack spacing={1.2}>
      <Typography variant="h6">{selectedAnomaly.title || 'Untitled anomaly'}</Typography>
      <Stack direction="row" spacing={1}>
        <Chip
          size="small"
          label={toLabel(selectedAnomaly.severity)}
          color={severityColors[selectedAnomaly.severity] || 'default'}
        />
        <Chip
          size="small"
          label={toLabel(selectedAnomaly.status)}
          color={statusColors[selectedAnomaly.status] || 'default'}
        />
      </Stack>

      <Typography variant="body2" color="text.secondary">
        {selectedAnomaly.description || 'No description was provided for this anomaly.'}
      </Typography>

      <Typography variant="body2">
        <strong>Type:</strong> {toLabel(selectedAnomaly.anomalyType)}
      </Typography>
      <Typography variant="body2">
        <strong>Suggested Action:</strong> {selectedAnomaly.suggestedAction || '—'}
      </Typography>
      <Typography variant="body2">
        <strong>Detection:</strong> {toLabel(selectedAnomaly.detectionMethod)}
        {confidence}
      </Typography>

      <Typography variant="body2">
        <strong>Related IDs:</strong>
        {' '}
        Invoice #{selectedAnomaly.relatedInvoiceId || '—'}
        {' | '}
        Transaction #{selectedAnomaly.relatedTransactionId || '—'}
        {' | '}
        Match #{selectedAnomaly.relatedMatchId || '—'}
      </Typography>

      <Typography variant="body2">
        <strong>Created:</strong> {fmtDate(selectedAnomaly.createdAt)}
      </Typography>

      {isOpen ? (
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Resolution Notes"
          value={resolutionNotes}
          onChange={(event) => setResolutionNotes(event.target.value)}
        />
      ) : (
        <>
          <Typography variant="body2">
            <strong>Resolved At:</strong> {fmtDate(selectedAnomaly.resolvedAt)}
          </Typography>
          <Typography variant="body2">
            <strong>Resolution Notes:</strong> {selectedAnomaly.resolutionNotes || '—'}
          </Typography>
        </>
      )}
    </Stack>
  )
}

function StatsCard({ title, value, hint, icon, color }) {
  return (
    <Card
      component={motion.div}
      variants={itemVariants}
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(160deg, rgba(14,24,42,0.96), rgba(10,18,34,0.96))',
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Box sx={{ color }}>{icon}</Box>
        </Stack>
        <Typography variant="h5" fontWeight={700}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      </CardContent>
    </Card>
  )
}

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  hint: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.string.isRequired,
}

function AnomaliesPage() {
  const { token } = useAuth()
  const { activeCompanyId } = useCompany()

  const [anomalies, setAnomalies] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState('')
  const [stats, setStats] = useState({ byStatus: {}, bySeverity: {} })

  const [status, setStatus] = useState('')
  const [severity, setSeverity] = useState('')
  const [type, setType] = useState('')
  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')

  const [selectedAnomaly, setSelectedAnomaly] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [resolveBusy, setResolveBusy] = useState(false)

  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' })

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => setQuery(queryInput.trim()), 350)
    return () => globalThis.clearTimeout(timeoutId)
  }, [queryInput])

  const loadAnomalies = useCallback(async () => {
    setListLoading(true)
    setListError('')

    try {
      const data = await getAnomaliesByCompany(
        activeCompanyId,
        {
          status,
          severity,
          type,
        },
        token,
      )

      setAnomalies(Array.isArray(data) ? data : [])
    } catch (err) {
      setListError(err.message || 'Failed to load anomalies.')
      setAnomalies([])
    } finally {
      setListLoading(false)
    }
  }, [activeCompanyId, severity, status, token, type])

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    setStatsError('')

    try {
      const data = await getAnomalyStats(activeCompanyId, token)
      setStats({
        byStatus: data?.byStatus || {},
        bySeverity: data?.bySeverity || {},
      })
    } catch (err) {
      setStatsError(err.message || 'Failed to load anomaly statistics.')
      setStats({ byStatus: {}, bySeverity: {} })
    } finally {
      setStatsLoading(false)
    }
  }, [activeCompanyId, token])

  useEffect(() => {
    loadAnomalies()
  }, [loadAnomalies])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const filteredAnomalies = useMemo(() => {
    if (!query) return anomalies

    const q = query.toLowerCase()
    return anomalies.filter((item) => {
      const titleText = item?.title?.toLowerCase() || ''
      const descriptionText = item?.description?.toLowerCase() || ''
      return titleText.includes(q) || descriptionText.includes(q)
    })
  }, [anomalies, query])

  const totalAnomalies = useMemo(
    () => Object.values(stats.byStatus || {}).reduce((sum, entry) => sum + Number(entry || 0), 0),
    [stats.byStatus],
  )

  const openCount = Number(stats.byStatus?.open || 0)
  const resolvedCount = Number(stats.byStatus?.resolved || 0)
  const criticalCount = Number(stats.bySeverity?.critical || 0)

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadAnomalies(), loadStats()])
  }, [loadAnomalies, loadStats])

  const handleOpenDetails = useCallback(
    async (anomalyId) => {
      setDetailsOpen(true)
      setDetailsLoading(true)
      setDetailsError('')
      setResolutionNotes('')

      try {
        const details = await getAnomalyById(anomalyId, token)
        setSelectedAnomaly(details)
        setResolutionNotes(details?.resolutionNotes || '')
      } catch (err) {
        setDetailsError(err.message || 'Failed to load anomaly details.')
        setSelectedAnomaly(null)
      } finally {
        setDetailsLoading(false)
      }
    },
    [token],
  )

  const closeDetails = useCallback(() => {
    setDetailsOpen(false)
    setSelectedAnomaly(null)
    setDetailsError('')
    setResolutionNotes('')
    setResolveBusy(false)
  }, [])

  const handleResolve = useCallback(async () => {
    if (!selectedAnomaly?.id) return

    setResolveBusy(true)
    try {
      await resolveAnomaly(
        selectedAnomaly.id,
        {
          status: 'resolved',
          resolutionNotes: resolutionNotes.trim() || null,
        },
        token,
      )

      setSnack({
        open: true,
        severity: 'success',
        message: 'Anomaly resolved successfully.',
      })

      closeDetails()
      await Promise.all([loadAnomalies(), loadStats()])
    } catch (err) {
      setSnack({
        open: true,
        severity: 'error',
        message: err.message || 'Failed to resolve anomaly.',
      })
    } finally {
      setResolveBusy(false)
    }
  }, [closeDetails, loadAnomalies, loadStats, resolutionNotes, selectedAnomaly?.id, token])

  const listContent = getListContent({
    listLoading,
    listError,
    anomalies: filteredAnomalies,
    onOpenDetails: handleOpenDetails,
  })

  const detailsContent = getDetailsContent({
    detailsLoading,
    detailsError,
    selectedAnomaly,
    resolutionNotes,
    setResolutionNotes,
  })

  const statsCards = [
    {
      title: 'Total',
      value: totalAnomalies,
      hint: 'All detected anomalies',
      color: '#9ac8ff',
      icon: <InsightsRoundedIcon />,
    },
    {
      title: 'Open',
      value: openCount,
      hint: 'Needs review',
      color: '#ffd78f',
      icon: <ErrorOutlineRoundedIcon />,
    },
    {
      title: 'Resolved',
      value: resolvedCount,
      hint: 'Closed anomalies',
      color: '#95f5bc',
      icon: <CheckCircleRoundedIcon />,
    },
    {
      title: 'Critical',
      value: criticalCount,
      hint: 'High-impact issues',
      color: '#ff9d9d',
      icon: <ReportProblemRoundedIcon />,
    },
  ]

  return (
    <PageSectionLayout>
      <PageHeaderCard
        title="Anomalies"
        description="Monitor data quality issues and resolve exception cases quickly."
        onRefresh={handleRefresh}
        refreshDisabled={listLoading || statsLoading}
      />

      <Grid container spacing={2}>
        {statsLoading
          ? ['stats-skeleton-1', 'stats-skeleton-2', 'stats-skeleton-3', 'stats-skeleton-4'].map((key) => (
              <Grid key={key} size={{ xs: 12, sm: 6, md: 3 }}>
                <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 3 }} />
              </Grid>
            ))
          : statsCards.map((card) => (
              <Grid key={card.title} size={{ xs: 12, sm: 6, md: 3 }}>
                <StatsCard
                  title={card.title}
                  value={card.value}
                  hint={card.hint}
                  color={card.color}
                  icon={card.icon}
                />
              </Grid>
            ))}
      </Grid>

      {statsError ? <Alert severity="warning">{statsError}</Alert> : null}

      <Card
        component={motion.div}
        variants={itemVariants}
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(160deg, rgba(14,24,42,0.96), rgba(10,18,34,0.96))',
        }}
      >
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search title or description"
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: <SearchRoundedIcon fontSize="small" sx={{ mr: 1 }} />,
                },
              }}
            />

            <TextField
              select
              size="small"
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              sx={{ minWidth: 170 }}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value || 'all-statuses'} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Severity"
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
              sx={{ minWidth: 170 }}
            >
              {severityOptions.map((option) => (
                <MenuItem key={option.value || 'all-severity'} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Type"
              value={type}
              onChange={(event) => setType(event.target.value)}
              sx={{ minWidth: 190 }}
            >
              {typeOptions.map((option) => (
                <MenuItem key={option.value || 'all-types'} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {listContent}
        </CardContent>
      </Card>

      <Dialog
        open={detailsOpen}
        onClose={resolveBusy ? undefined : closeDetails}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Anomaly Details</DialogTitle>
        <DialogContent dividers>
          {detailsContent}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetails} disabled={resolveBusy}>Close</Button>
          {selectedAnomaly?.status === 'open' ? (
            <Button
              variant="contained"
              onClick={handleResolve}
              disabled={resolveBusy || detailsLoading}
              startIcon={<TaskAltRoundedIcon />}
            >
              {resolveBusy ? 'Resolving...' : 'Resolve'}
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>

      <SnackbarAlert
        open={snack.open}
        severity={snack.severity}
        message={snack.message}
        onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
      />
    </PageSectionLayout>
  )
}

export default AnomaliesPage
