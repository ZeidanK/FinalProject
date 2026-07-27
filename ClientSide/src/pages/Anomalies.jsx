import { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Alert,
  Box,
  Button,
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
  TablePagination,
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
import AnimatedBackground from '../components/AnimatedBackground'
import GlassCard from '../components/GlassCard'
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

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100]

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

function AnomalyTableSkeleton() {
  return (
    <Stack spacing={1}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} variant="rectangular" height={52} sx={{ borderRadius: 2 }} />
      ))}
    </Stack>
  )
}

function AnomalyTableEmpty() {
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

function AnomalyTableError({ message }) {
  return <Alert severity="error">{message}</Alert>
}

function AnomalyTableBody({ anomalies, onOpenDetails }) {
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

AnomalyTableBody.propTypes = {
  anomalies: PropTypes.array.isRequired,
  onOpenDetails: PropTypes.func.isRequired,
}

function StatsCard({ title, value, hint, icon, color }) {
  return (
    <GlassCard variant="default" motionProps={{ variants: itemVariants }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, px: 2, pt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Box sx={{ color }}>{icon}</Box>
      </Stack>
      <Typography variant="h5" fontWeight={700} sx={{ px: 2 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, pb: 2 }}>
        {hint}
      </Typography>
    </GlassCard>
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
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)

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
    page: page + 1,
    pageSize: rowsPerPage,
    searchTerm: searchTerm || undefined,
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
    const timeoutId = globalThis.setTimeout(() => setSearchTerm(queryInput.trim()), 350)
    return () => globalThis.clearTimeout(timeoutId)
  }, [queryInput])

  useEffect(() => {
    if (page !== 0) setPage(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, type, searchTerm])

  useEffect(() => {
    if (!deepLinkedAnomalyId) return
    handleOpenDetails(deepLinkedAnomalyId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkedAnomalyId])

  const anomalies = anomaliesQuery.data?.items ?? []
  const totalCount = anomaliesQuery.data?.totalCount ?? 0

  const stats = useMemo(
    () => ({
      byStatus: statsQuery.data?.byStatus || {},
    }),
    [statsQuery.data],
  )

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
  }, [anomaliesQuery, confirm, detailsQuery, notify, queryClient, statsQuery, token])

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
  }, [notify, token])

  const handleChangePage = useCallback((_event, newPage) => {
    setPage(newPage)
  }, [])

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(Number(event.target.value))
    setPage(0)
  }, [])

  const listLoading = anomaliesQuery.isLoading || anomaliesQuery.isFetching
  const listError = anomaliesQuery.error?.message || ''
  const statsLoading = statsQuery.isLoading || statsQuery.isFetching
  const statsError = statsQuery.error?.message || ''
  const selectedAnomaly = detailsQuery.data || null
  const detailsLoading = detailsQuery.isLoading || detailsQuery.isFetching
  const detailsError = detailsQuery.error?.message || ''
  const resolveBusy = resolveMutation.isPending
  const cleanupBusy = Boolean(cleanupTarget)

  let tableContent
  if (listLoading) {
    tableContent = <AnomalyTableSkeleton />
  } else if (listError) {
    tableContent = <AnomalyTableError message={listError} />
  } else if (anomalies.length === 0) {
    tableContent = <AnomalyTableEmpty />
  } else {
    tableContent = <AnomalyTableBody anomalies={anomalies} onOpenDetails={handleOpenDetails} />
  }

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
          <Grid container spacing={2}>
            {statsLoading
              ? [0, 1, 2, 3].map((i) => (
                  <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
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

          <GlassCard variant="default" motionProps={{ variants: itemVariants }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2, px: 2, pt: 2 }}>
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

            {tableContent}

            {anomalies.length > 0 ? (
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                sx={{ px: 2 }}
              />
            ) : null}
          </GlassCard>

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
