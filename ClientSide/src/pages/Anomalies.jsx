import { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
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
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import DoNotDisturbOnRoundedIcon from '@mui/icons-material/DoNotDisturbOnRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import PageHeaderCard from '../components/PageHeaderCard'
import AnimatedBackground from '../components/AnimatedBackground'
import AnomalyDetailsModal from '../components/AnomalyDetailsModal'
import { useNotification } from '../context/useNotification'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import { useConfirm } from '../components/ConfirmContext'
import {
  useAnomaliesListQuery,
  useAnomalyDetailsQuery,
  useAnomalyStatsQuery,
  useResolveAnomalyMutation,
} from '../hooks/queries/useAnomaliesQueries'
import { keepDuplicateInvoice } from '../services/anomalies'
import { getInvoiceById } from '../services/invoices'
import { invoiceKeys } from '../queries/queryKeys'
import { mapSavedInvoiceToForm } from '../utils/invoiceExtraction'
import { containerVariants, itemVariants } from '../utils/motionVariants'
import InvoiceVerificationModal from '../components/InvoiceVerificationModal'

const statusColors = {
  open: 'warning',
  resolved: 'success',
  dismissed: 'default',
}

const statusLabels = {
  open: 'Unresolved',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
}

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Unresolved' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
]

const typeOptions = [
  { value: '', label: 'All types' },
  { value: 'amount_mismatch', label: 'Amount Mismatch' },
  { value: 'date_gap', label: 'Date Gap' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'missing_link', label: 'Missing Link' },
]

const fmtDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB')
}

const toLabel = (value) => {
  if (!value) return '—'
  return String(value)
    .replaceAll('_', ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const toStatusLabel = (value) => statusLabels[value] || toLabel(value)

const toAnomalyTypeLabel = (value) =>
  value === 'duplicate_transaction_file' ? 'Duplicate' : toLabel(value)

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
            <TableCell align="right">Related Items</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {anomalies.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>{toAnomalyTypeLabel(item.anomalyType)}</TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {item.title || 'Untitled anomaly'}
                </Typography>
              </TableCell>
              <TableCell align="right">{item.relatedItemsCount || 0}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={toStatusLabel(item.status)}
                  color={statusColors[item.status] || 'default'}
                />
              </TableCell>
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

function StatsCard({ title, value, hint, icon, color }) {
  return (
    <Card
      component={motion.div}
      variants={itemVariants}
      elevation={0}
      sx={{
        borderRadius: 3.5,
        border: '1px solid rgba(129, 191, 255, 0.12)',
        background: 'rgba(14, 24, 45, 0.65)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
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
  const queryClient = useQueryClient()
  const { token } = useAuth()
  const { activeCompanyId } = useCompany()
  const [searchParams] = useSearchParams()
  const deepLinkedAnomalyId = Number(searchParams.get('anomalyId')) || null

  const [status, setStatus] = useState('open')
  const [type, setType] = useState('')
  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')

  const [selectedAnomalyId, setSelectedAnomalyId] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [cleanupTarget, setCleanupTarget] = useState(null)
  const [invoiceModal, setInvoiceModal] = useState({ open: false, file: null })
  const [viewingInvoiceId, setViewingInvoiceId] = useState(null)

  const { notify } = useNotification()

  const { confirm } = useConfirm()

  const filters = useMemo(
    () => ({
      status,
      type: type === 'duplicate' ? '' : type,
    }),
    [status, type],
  )

  const anomaliesQuery = useAnomaliesListQuery({
    companyId: activeCompanyId,
    token,
    filters,
  })

  const statsQuery = useAnomalyStatsQuery({
    companyId: activeCompanyId,
    token,
  })

  const detailsQuery = useAnomalyDetailsQuery({
    anomalyId: selectedAnomalyId,
    token,
    enabled: detailsOpen,
  })

  const resolveMutation = useResolveAnomalyMutation({
    companyId: activeCompanyId,
    token,
  })

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => setQuery(queryInput.trim()), 350)
    return () => globalThis.clearTimeout(timeoutId)
  }, [queryInput])

  const anomalies = useMemo(
    () => (Array.isArray(anomaliesQuery.data) ? anomaliesQuery.data : []),
    [anomaliesQuery.data],
  )

  const stats = useMemo(
    () => ({
      byStatus: statsQuery.data?.byStatus || {},
    }),
    [statsQuery.data],
  )

  const filteredAnomalies = useMemo(() => {
    const q = query.toLowerCase()
    return anomalies.filter((item) => {
      const matchesType =
        !type ||
        (type === 'duplicate'
          ? ['duplicate', 'duplicate_transaction_file'].includes(item?.anomalyType)
          : item?.anomalyType === type)
      const titleText = item?.title?.toLowerCase() || ''
      const descriptionText = item?.description?.toLowerCase() || ''
      const matchesSearch = !q || titleText.includes(q) || descriptionText.includes(q)
      return matchesType && matchesSearch
    })
  }, [anomalies, query, type])

  const totalAnomalies = useMemo(
    () => Object.values(stats.byStatus || {}).reduce((sum, entry) => sum + Number(entry || 0), 0),
    [stats.byStatus],
  )

  const openCount = Number(stats.byStatus?.open || 0)
  const resolvedCount = Number(stats.byStatus?.resolved || 0)
  const dismissedCount = Number(stats.byStatus?.dismissed || 0)

  const handleOpenDetails = useCallback(
    async (anomalyId) => {
      setDetailsOpen(true)
      setSelectedAnomalyId(anomalyId)
    },
    [],
  )

  useEffect(() => {
    if (!deepLinkedAnomalyId) return
    handleOpenDetails(deepLinkedAnomalyId)
  }, [deepLinkedAnomalyId, handleOpenDetails])

  const closeDetails = useCallback(() => {
    setDetailsOpen(false)
    setSelectedAnomalyId(null)
    setCleanupTarget(null)
    resolveMutation.reset()
  }, [resolveMutation])

  const handleResolve = useCallback(async (resolutionNotes) => {
    if (!detailsQuery.data?.id) return

    try {
      await resolveMutation.mutateAsync({
        anomalyId: detailsQuery.data.id,
        payload: { status: 'resolved', resolutionNotes: resolutionNotes || null },
      })

      notify({ severity: 'success', message: 'Anomaly resolved successfully.' })
      closeDetails()
    } catch (err) {
      notify({
        severity: 'error',
        message: err.message || 'Failed to resolve anomaly.',
      })
    }
  }, [closeDetails, detailsQuery.data, resolveMutation, notify])

  const handleDismiss = useCallback(async (resolutionNotes) => {
    if (!detailsQuery.data?.id) return

    try {
      await resolveMutation.mutateAsync({
        anomalyId: detailsQuery.data.id,
        payload: { status: 'dismissed', resolutionNotes: resolutionNotes || null },
      })

      notify({ severity: 'success', message: 'Anomaly dismissed successfully.' })
      closeDetails()
    } catch (err) {
      notify({
        severity: 'error',
        message: err.message || 'Failed to dismiss anomaly.',
      })
    }
  }, [closeDetails, detailsQuery.data, resolveMutation, notify])

  const handleDeleteRelatedItem = useCallback(async (item) => {
    if (!item?.entityId || !detailsQuery.data) return

    if (item.itemType !== 'invoice') return

    const remainingCount = detailsQuery.data.relatedItems?.length || 0
    if (remainingCount <= 1) {
      notify({ severity: 'warning', message: 'Keep at least one record in the duplicate group.' })
      return
    }

    const itemLabel = item.label || item.fileName || `${toLabel(item.itemType)} #${item.entityId}`
    const confirmed = await confirm(`Keep ${itemLabel} and soft-delete the other duplicate invoices?`)
    if (!confirmed) return

    setCleanupTarget(`${item.itemType}-${item.entityId}`)
    try {
      await keepDuplicateInvoice(detailsQuery.data.id, {
        keepInvoiceId: item.entityId,
        resolutionNotes: `Kept ${itemLabel}; soft-deleted the other duplicate invoices.`,
      }, token)

      notify({ severity: 'success', message: 'Duplicate invoice decision saved and anomaly resolved.' })

      await Promise.all([anomaliesQuery.refetch(), statsQuery.refetch()])
      await queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
      await detailsQuery.refetch()
    } catch (err) {
      notify({ severity: 'error', message: err.message || 'Failed to save duplicate decision.' })
    } finally {
      setCleanupTarget(null)
    }
  }, [anomaliesQuery, detailsQuery, queryClient, statsQuery, token])

  const handleViewInvoiceItem = useCallback(async (item) => {
    const invoiceId = item?.entityId
    if (!invoiceId) return

    setViewingInvoiceId(invoiceId)
    try {
      const invoice = await getInvoiceById(invoiceId, token)
      setInvoiceModal({
        open: true,
        file: {
          id: `anomaly-invoice-${invoice.id}`,
          name:
            invoice.fileOriginalName ||
            invoice.file_original_name ||
            `Invoice ${invoice.invoiceNumber || invoice.invoice_number || invoice.id}`,
          extractedData: mapSavedInvoiceToForm(invoice),
          existingInvoiceId: invoice.id,
          sourceInvoice: invoice,
        },
      })
    } catch (err) {
      notify({ severity: 'error', message: err.message || 'Failed to open invoice details.' })
    } finally {
      setViewingInvoiceId(null)
    }
  }, [token])

  const listLoading = anomaliesQuery.isLoading || anomaliesQuery.isFetching
  const listError = anomaliesQuery.error?.message || ''
  const statsLoading = statsQuery.isLoading || statsQuery.isFetching
  const statsError = statsQuery.error?.message || ''
  const selectedAnomaly = detailsQuery.data || null
  const detailsLoading = detailsQuery.isLoading || detailsQuery.isFetching
  const detailsError = detailsQuery.error?.message || ''
  const resolveBusy = resolveMutation.isPending
  const cleanupBusy = Boolean(cleanupTarget)

  const listContent = getListContent({
    listLoading,
    listError,
    anomalies: filteredAnomalies,
    onOpenDetails: handleOpenDetails,
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
      title: 'Unresolved',
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
      title: 'Dismissed',
      value: dismissedCount,
      hint: 'Dismissed anomalies',
      color: '#b9c2d0',
      icon: <DoNotDisturbOnRoundedIcon />,
    },
  ]

  return (
    <Box sx={{ py: { xs: 4, md: 6 }, position: 'relative', overflow: 'hidden' }}>
      <AnimatedBackground density="low" />
      <Container maxWidth={false} disableGutters sx={{ px: { xs: 2, sm: 3, md: 4, xl: 5 }, width: '100%', position: 'relative', zIndex: 1 }}>
        <Stack component={motion.div} variants={containerVariants} initial="hidden" animate="show" spacing={3}>
      <PageHeaderCard
        title="Anomalies"
        description="Monitor data quality issues and resolve exception cases quickly."
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
          borderRadius: 3.5,
          border: '1px solid rgba(129, 191, 255, 0.12)',
          background: 'rgba(14, 24, 45, 0.65)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
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
              sx={{ minWidth: 185 }}
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

      <AnomalyDetailsModal
        open={detailsOpen}
        onClose={closeDetails}
        selectedAnomaly={selectedAnomaly}
        loading={detailsLoading}
        error={detailsError}
        resolveBusy={resolveBusy}
        cleanupBusy={cleanupBusy}
        viewingInvoiceId={viewingInvoiceId}
        onResolve={handleResolve}
        onDismiss={handleDismiss}
        onKeepItem={handleDeleteRelatedItem}
        onViewInvoice={handleViewInvoiceItem}
      />

      <InvoiceVerificationModal
        key={invoiceModal.file?.id || 'empty-anomaly-invoice'}
        open={invoiceModal.open}
        onClose={() => setInvoiceModal({ open: false, file: null })}
        onSave={() => {}}
        initialData={invoiceModal.file?.extractedData}
        fileName={invoiceModal.file?.name}
        fileType={
          invoiceModal.file?.sourceInvoice?.fileType ||
          invoiceModal.file?.sourceInvoice?.file_type ||
          null
        }
        invoiceId={invoiceModal.file?.existingInvoiceId || null}
        token={token}
        extractionMethod={
          invoiceModal.file?.sourceInvoice?.extractionMethod ||
          invoiceModal.file?.sourceInvoice?.extraction_method
        }
        readOnly
      />

        </Stack>
      </Container>
    </Box>
  )
}

export default AnomaliesPage
