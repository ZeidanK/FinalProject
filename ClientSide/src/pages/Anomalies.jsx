import { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useForm } from 'react-hook-form'
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
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import DoNotDisturbOnRoundedIcon from '@mui/icons-material/DoNotDisturbOnRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import PageHeaderCard from '../components/PageHeaderCard'
import AnimatedBackground from '../components/AnimatedBackground'
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
import { resolveAnomalySchema } from '../schemas/anomalies'
import { mapSavedInvoiceToForm } from '../utils/invoiceExtraction'
import { containerVariants, itemVariants } from '../utils/motionVariants'
import InvoiceVerificationModal from '../components/InvoiceVerificationModal'

/**
 * Maps anomaly statuses to Material UI chip color variants.
 * @type {{[key: string]: string}}
 */
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

/**
 * Dropdown options used to filter anomalies by status.
 * @type {{value: string, label: string}[]}
 */
const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Unresolved' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
]

/**
 * Dropdown options used to filter anomalies by anomaly type.
 * @type {{value: string, label: string}[]}
 */
const typeOptions = [
  { value: '', label: 'All types' },
  { value: 'amount_mismatch', label: 'Amount Mismatch' },
  { value: 'date_gap', label: 'Date Gap' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'missing_link', label: 'Missing Link' },
]

/**
 * Formats a numeric amount for display with two decimal places.
 * @param {*} value - The value to format.
 * @returns {string} Formatted amount or an em dash when no value is available.
 */
const fmtAmount = (value) => {
  if (value === null || value === undefined) return '—'
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Formats a date value into the user's locale string.
 * @param {*} value - The date input to format.
 * @returns {string} Localized date string or an em dash when invalid.
 */
const fmtDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

const fmtBytes = (value) => {
  if (!value) return ''
  const bytes = Number(value)
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Converts snake_case or other raw values into human-readable labels.
 * @param {*} value - The raw value to convert.
 * @returns {string} Human-friendly label or an em dash when empty.
 */
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

/**
 * Renders the main anomalies list section based on current query state.
 *
 * @param {Object} props - List rendering props.
 * @param {boolean} props.listLoading - Whether anomaly data is currently loading.
 * @param {string} props.listError - Error message when loading failed.
 * @param {Array} props.anomalies - List of anomaly records to display.
 * @param {Function} props.onOpenDetails - Callback to open anomaly details.
 * @returns {JSX.Element} Rendered list content or placeholder states.
 */
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

/**
 * Renders the anomaly details panel, including the resolution form when the anomaly remains open.
 *
 * @param {Object} props - Detail panel rendering props.
 * @param {boolean} props.detailsLoading - Whether detail data is loading.
 * @param {string} props.detailsError - Error message when detail fetch failed.
 * @param {Object|null} props.selectedAnomaly - The currently selected anomaly record.
 * @param {Object} props.resolutionFieldProps - Props wired for the resolution notes form field.
 * @param {string} props.resolutionError - Validation error message for resolution notes.
 * @returns {JSX.Element} Rendered anomaly detail content.
 */
function getDetailsContent({
  detailsLoading,
  detailsError,
  selectedAnomaly,
  resolutionFieldProps,
  resolutionError,
  onDeleteRelatedItem,
  onViewInvoiceItem,
  cleanupBusy,
  viewingInvoiceId,
}) {
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
  const isDuplicateTransactionFile = selectedAnomaly.anomalyType === 'duplicate_transaction_file'
  const confidence =
    selectedAnomaly.detectionConfidence !== null && selectedAnomaly.detectionConfidence !== undefined
      ? ` (${Math.round(Number(selectedAnomaly.detectionConfidence) * 100)}%)`
      : ''
  const relatedItems = Array.isArray(selectedAnomaly.relatedItems) ? selectedAnomaly.relatedItems : []
  const canCleanupRelatedItems =
    isOpen &&
    relatedItems.length > 1 &&
    selectedAnomaly.anomalyType === 'duplicate'

  return (
    <Stack spacing={1.2}>
      <Typography variant="h6">{selectedAnomaly.title || 'Untitled anomaly'}</Typography>
      <Stack direction="row" spacing={1}>
        <Chip
          size="small"
          label={toStatusLabel(selectedAnomaly.status)}
          color={statusColors[selectedAnomaly.status] || 'default'}
        />
      </Stack>

      <Typography variant="body2" color="text.secondary">
        {isDuplicateTransactionFile
          ? 'This file matches a previously imported transaction file. The duplicate upload was not imported.'
          : selectedAnomaly.description || 'No description was provided for this anomaly.'}
      </Typography>

      <Typography variant="body2">
        <strong>Type:</strong> {toAnomalyTypeLabel(selectedAnomaly.anomalyType)}
      </Typography>
      <Typography variant="body2">
        <strong>Suggested Action:</strong> {selectedAnomaly.suggestedAction || '—'}
      </Typography>
      <Typography variant="body2">
        <strong>Detection:</strong> {toLabel(selectedAnomaly.detectionMethod)}
        {confidence}
      </Typography>

      <Typography variant="body2">
        <strong>Group Size:</strong> {selectedAnomaly.relatedItemsCount || relatedItems.length || 0}
      </Typography>

      {relatedItems.length > 0 ? (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.8 }}>
              Related Records
            </Typography>
            <Stack spacing={0.6}>
              {relatedItems.map((item, index) => (
                <Box
                  key={`${item.itemType || 'item'}-${item.entityId || index}`}
                  sx={{
                    minWidth: 0,
                    px: 1,
                    py: 0.7,
                    borderRadius: 1.25,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body2" fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>
                    {item.label || `${toLabel(item.itemType)} #${item.entityId || '—'}`}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', overflowWrap: 'anywhere' }}
                  >
                    {item.fileName ? `File: ${item.fileName}` : null}
                    {item.fileSize ? ` | Size: ${fmtBytes(item.fileSize)}` : null}
                    {item.amount !== null && item.amount !== undefined ? ` | Amount: ${fmtAmount(item.amount)}` : null}
                    {item.date ? ` | Date: ${fmtDate(item.date)}` : null}
                    {item.status ? ` | Status: ${toStatusLabel(item.status)}` : null}
                    {item.uploadedAt ? ` | Uploaded: ${fmtDate(item.uploadedAt)}` : null}
                  </Typography>
                  {canCleanupRelatedItems ? (
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                      {item.itemType === 'invoice' ? (
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<VisibilityRoundedIcon fontSize="small" />}
                          disabled={viewingInvoiceId === item.entityId}
                          onClick={() => onViewInvoiceItem(item)}
                        >
                          {viewingInvoiceId === item.entityId ? 'Opening...' : 'View'}
                        </Button>
                      ) : null}
                      <Button
                        size="small"
                        color="primary"
                        variant="text"
                        startIcon={<TaskAltRoundedIcon fontSize="small" />}
                        disabled={
                          cleanupBusy ||
                          (item.itemType === 'invoice' && selectedAnomaly.status !== 'open' && item.status !== 'deleted')
                        }
                        onClick={() => onDeleteRelatedItem(item)}
                      >
                        {item.itemType === 'invoice' && selectedAnomaly.status !== 'open' && item.status !== 'deleted'
                          ? 'Kept'
                          : 'Keep This'}
                      </Button>
                    </Stack>
                  ) : null}
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Typography variant="body2">
          <strong>Related IDs:</strong>
          {' '}
          Invoice #{selectedAnomaly.relatedInvoiceId || '—'}
          {' | '}
          Transaction #{selectedAnomaly.relatedTransactionId || '—'}
          {' | '}
          Match #{selectedAnomaly.relatedMatchId || '—'}
        </Typography>
      )}

      <Typography variant="body2">
        <strong>Created:</strong> {fmtDate(selectedAnomaly.createdAt)}
      </Typography>

      {isOpen ? (
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Resolution Notes"
          error={Boolean(resolutionError)}
          helperText={resolutionError || ' '}
          {...resolutionFieldProps}
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

/**
 * Displays a compact anomaly statistics card.
 *
 * @param {Object} props - Card properties.
 * @param {string} props.title - Card title.
 * @param {string|number} props.value - Display value.
 * @param {string} props.hint - Supporting hint text.
 * @param {React.ReactNode} props.icon - Icon displayed in the card.
 * @param {string} props.color - Color used for the icon.
 * @returns {JSX.Element} Rendered statistics card.
 */
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

/**
 * Main page for anomaly monitoring and resolution workflows.
 *
 * This page provides filter controls, anomaly summary cards, a searchable anomaly list,
 * and a details dialog for resolving open anomalies.
 *
 * @returns {JSX.Element} The anomalies page content.
 */
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

  const {
    register,
    getValues,
    setValue,
    setError,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      resolutionNotes: '',
    },
  })

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

  useEffect(() => {
    if (!detailsQuery.data) {
      return
    }

    setValue('resolutionNotes', detailsQuery.data?.resolutionNotes || '')
    clearErrors('resolutionNotes')
  }, [clearErrors, detailsQuery.data, setValue])

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
      reset({ resolutionNotes: '' })
    },
    [reset],
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
    reset({ resolutionNotes: '' })
  }, [reset, resolveMutation])

  const handleStatusChange = useCallback(async (nextStatus) => {
    if (!detailsQuery.data?.id) return

    const parsed = resolveAnomalySchema.safeParse({
      resolutionNotes: getValues('resolutionNotes') || '',
    })

    if (!parsed.success) {
      setError('resolutionNotes', {
        type: 'manual',
        message: parsed.error.issues[0]?.message || 'Please enter valid resolution notes.',
      })
      return
    }

    clearErrors('resolutionNotes')
    try {
      await resolveMutation.mutateAsync({
        anomalyId: detailsQuery.data.id,
        payload: {
          status: nextStatus,
          resolutionNotes: parsed.data.resolutionNotes || null,
        },
      })

      const actionLabel = nextStatus === 'dismissed' ? 'dismissed' : 'resolved'
      notify({ severity: 'success', message: `Anomaly ${actionLabel} successfully.` })

      closeDetails()
    } catch (err) {
      notify({
        severity: 'error',
        message: err.message || `Failed to ${nextStatus === 'dismissed' ? 'dismiss' : 'resolve'} anomaly.`,
      })
    }
  }, [clearErrors, closeDetails, detailsQuery.data, getValues, resolveMutation, setError])

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
  const duplicateInvoiceNeedsDecision =
    selectedAnomaly?.status === 'open' &&
    selectedAnomaly?.anomalyType === 'duplicate' &&
    Number(selectedAnomaly?.relatedItemsCount || selectedAnomaly?.relatedItems?.length || 0) > 1
  const resolutionFieldProps = register('resolutionNotes')

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
    resolutionFieldProps,
    resolutionError: errors.resolutionNotes?.message,
    onDeleteRelatedItem: handleDeleteRelatedItem,
    onViewInvoiceItem: handleViewInvoiceItem,
    cleanupBusy,
    viewingInvoiceId,
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

      <Dialog
        open={detailsOpen}
        onClose={resolveBusy || cleanupBusy ? undefined : closeDetails}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Anomaly Details</DialogTitle>
        <DialogContent dividers>
          {detailsContent}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetails} disabled={resolveBusy || cleanupBusy}>Close</Button>
          {selectedAnomaly?.status === 'open' ? (
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => handleStatusChange('dismissed')}
              disabled={resolveBusy || cleanupBusy || detailsLoading}
              startIcon={<DoNotDisturbOnRoundedIcon />}
            >
              {resolveBusy ? 'Updating...' : 'Dismiss'}
            </Button>
          ) : null}
          {selectedAnomaly?.status === 'open' && !duplicateInvoiceNeedsDecision ? (
              <Button
                variant="contained"
                onClick={() => handleStatusChange('resolved')}
                disabled={resolveBusy || cleanupBusy || detailsLoading}
                startIcon={<TaskAltRoundedIcon />}
              >
                {resolveBusy ? 'Resolving...' : 'Resolve'}
              </Button>
          ) : null}
        </DialogActions>
      </Dialog>

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
