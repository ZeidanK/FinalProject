import { useForm } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DoNotDisturbOnRoundedIcon from '@mui/icons-material/DoNotDisturbOnRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import PropTypes from 'prop-types'
import ModalShell from './ModalShell'
import { resolveAnomalySchema } from '../schemas/anomalies'

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
  return date.toLocaleDateString('en-GB')
}

const fmtBytes = (value) => {
  if (!value) return ''
  const bytes = Number(value)
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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

function InfoCard({ label, value }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.25,
        borderRadius: 2,
        bgcolor: 'rgba(255,255,255,0.02)',
        borderColor: 'divider',
        height: '100%',
      }}
    >
      <Stack spacing={0.5}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ letterSpacing: 0.3, textTransform: 'uppercase', fontSize: '0.7rem' }}
        >
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
          {value ?? '—'}
        </Typography>
      </Stack>
    </Paper>
  )
}

InfoCard.propTypes = {
  label: PropTypes.node.isRequired,
  value: PropTypes.node,
}

function SectionDivider({ label }) {
  return (
    <Divider sx={{ '&::before, &::after': { borderColor: 'rgba(129, 191, 255, 0.08)' } }}>
      <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {label}
      </Typography>
    </Divider>
  )
}

SectionDivider.propTypes = {
  label: PropTypes.string.isRequired,
}

function AnomalyHero({ data }) {
  const isDuplicateTransactionFile = data.anomalyType === 'duplicate_transaction_file'
  const confidence =
    data.detectionConfidence !== null && data.detectionConfidence !== undefined
      ? ` (${Math.round(Number(data.detectionConfidence) * 100)}%)`
      : ''

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(129, 191, 255, 0.08) 0%, rgba(129, 191, 255, 0.02) 100%)',
        borderColor: 'rgba(129, 191, 255, 0.15)',
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
            {data.title || 'Untitled anomaly'}
          </Typography>
          <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
            <Chip
              size="small"
              label={toStatusLabel(data.status)}
              color={statusColors[data.status] || 'default'}
            />
            <Chip
              size="small"
              label={toAnomalyTypeLabel(data.anomalyType)}
              variant="outlined"
            />
          </Stack>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {isDuplicateTransactionFile
            ? 'This file matches a previously imported transaction file. The duplicate upload was not imported.'
            : data.description || 'No description was provided for this anomaly.'}
        </Typography>
        {data.detectionMethod ? (
          <Typography variant="caption" color="text.secondary">
            Detected via {toLabel(data.detectionMethod)}{confidence}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  )
}

AnomalyHero.propTypes = {
  data: PropTypes.object.isRequired,
}

function RelatedRecordsSection({ relatedItems, canCleanup, cleanupBusy, viewingInvoiceId, onKeepItem, onViewInvoice }) {
  if (relatedItems.length === 0) return null

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ py: 1.5 }}>
        <Typography variant="subtitle2" sx={{ mb: 0.8 }}>
          Related Records
        </Typography>
        <Grid container spacing={0.6}>
          {relatedItems.map((item, index) => (
            <Grid key={`${item.itemType || 'item'}-${item.entityId || index}`} size={{ xs: 12, md: relatedItems.length === 1 ? 12 : 6 }}>
            <Box
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
              {canCleanup ? (
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                  {item.itemType === 'invoice' ? (
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<VisibilityRoundedIcon fontSize="small" />}
                      disabled={viewingInvoiceId === item.entityId}
                      onClick={() => onViewInvoice(item)}
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
                      cleanupBusy
                    }
                    onClick={() => onKeepItem(item)}
                  >
                    Keep This
                  </Button>
                </Stack>
              ) : null}
            </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

RelatedRecordsSection.propTypes = {
  relatedItems: PropTypes.array.isRequired,
  canCleanup: PropTypes.bool.isRequired,
  cleanupBusy: PropTypes.bool.isRequired,
  viewingInvoiceId: PropTypes.number,
  onKeepItem: PropTypes.func.isRequired,
  onViewInvoice: PropTypes.func.isRequired,
}

function AnomalySkeleton() {
  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: 'divider' }}>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Skeleton variant="rounded" width={220} height={32} />
            <Stack direction="row" spacing={0.5}>
              <Skeleton variant="rounded" width={80} height={24} />
              <Skeleton variant="rounded" width={60} height={24} />
            </Stack>
          </Stack>
          <Skeleton variant="rounded" width="100%" height={20} />
        </Stack>
      </Paper>
      <Grid container spacing={2}>
        {[0, 1, 2, 3].map((i) => (
          <Grid key={i} size={{ xs: 6, md: 3 }}>
            <Skeleton variant="rounded" height={56} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}

export default function AnomalyDetailsModal({
  open,
  onClose,
  selectedAnomaly,
  loading,
  error,
  resolveBusy,
  cleanupBusy,
  viewingInvoiceId,
  onResolve,
  onDismiss,
  onKeepItem,
  onViewInvoice,
}) {
  const {
    register,
    getValues,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: { resolutionNotes: '' },
  })

  const isOpen = selectedAnomaly?.status === 'open'
  const relatedItems = Array.isArray(selectedAnomaly?.relatedItems) ? selectedAnomaly.relatedItems : []
  const canCleanupRelatedItems =
    isOpen &&
    relatedItems.length > 1 &&
    selectedAnomaly?.anomalyType === 'duplicate'

  const duplicateInvoiceNeedsDecision =
    isOpen &&
    selectedAnomaly?.anomalyType === 'duplicate' &&
    Number(selectedAnomaly?.relatedItemsCount || relatedItems.length || 0) > 1

  const handleResolveClick = () => {
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
    onResolve(parsed.data.resolutionNotes)
  }

  const handleDismissClick = () => {
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
    onDismiss(parsed.data.resolutionNotes)
  }

  const actionsDisabled = resolveBusy || cleanupBusy

  const resolutionNotesProps = register('resolutionNotes')

  const hasRelatedIdsFallback =
    !loading &&
    !error &&
    selectedAnomaly &&
    relatedItems.length === 0 &&
    (selectedAnomaly.relatedInvoiceId || selectedAnomaly.relatedTransactionId || selectedAnomaly.relatedMatchId)

  return (
    <ModalShell
      open={open}
      onClose={actionsDisabled ? undefined : onClose}
      maxWidth="md"
      title={(
        <Stack spacing={0.5}>
          <Typography variant="h6">Anomaly Details</Typography>
          {selectedAnomaly && !loading ? (
            <Typography variant="body2" color="text.secondary">
              ID #{selectedAnomaly.id}
            </Typography>
          ) : null}
        </Stack>
      )}
      headerAction={(
        <Button onClick={onClose} disabled={actionsDisabled} color="inherit" startIcon={<CloseRoundedIcon />}>
          Close
        </Button>
      )}
      actions={(
        <>
          {isOpen ? (
            <>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleDismissClick}
                disabled={actionsDisabled || loading}
                startIcon={<DoNotDisturbOnRoundedIcon />}
              >
                {resolveBusy ? 'Updating...' : 'Dismiss'}
              </Button>
              {!duplicateInvoiceNeedsDecision ? (
                <Button
                  variant="contained"
                  onClick={handleResolveClick}
                  disabled={actionsDisabled || loading}
                  startIcon={<TaskAltRoundedIcon />}
                >
                  {resolveBusy ? 'Resolving...' : 'Resolve'}
                </Button>
              ) : null}
            </>
          ) : null}
        </>
      )}
      contentSx={{ py: 1.5 }}
    >
      {loading ? <AnomalySkeleton /> : null}

      {error && !loading ? (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : null}

      {!selectedAnomaly && !loading && !error ? (
        <Alert severity="info" sx={{ mt: 2 }}>No anomaly details available.</Alert>
      ) : null}

      {selectedAnomaly && !loading ? (
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <AnomalyHero data={selectedAnomaly} />

          <SectionDivider label="Details" />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <InfoCard label="Type" value={toAnomalyTypeLabel(selectedAnomaly.anomalyType)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <InfoCard label="Suggested Action" value={selectedAnomaly.suggestedAction || '—'} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <InfoCard
                label="Group Size"
                value={selectedAnomaly.relatedItemsCount || relatedItems.length || 0}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <InfoCard
                label="Created"
                value={fmtDate(selectedAnomaly.createdAt)}
              />
            </Grid>
          </Grid>

          {relatedItems.length > 0 ? (
            <>
              <SectionDivider label="Related Records" />
              <RelatedRecordsSection
                relatedItems={relatedItems}
                canCleanup={canCleanupRelatedItems}
                cleanupBusy={cleanupBusy}
                viewingInvoiceId={viewingInvoiceId}
                onKeepItem={onKeepItem}
                onViewInvoice={onViewInvoice}
              />
            </>
          ) : null}

          {hasRelatedIdsFallback ? (
            <>
              <SectionDivider label="Related IDs" />
              <Typography variant="body2" color="text.secondary">
                {selectedAnomaly.relatedInvoiceId ? `Invoice #${selectedAnomaly.relatedInvoiceId}` : null}
                {selectedAnomaly.relatedInvoiceId && (selectedAnomaly.relatedTransactionId || selectedAnomaly.relatedMatchId) ? ' | ' : null}
                {selectedAnomaly.relatedTransactionId ? `Transaction #${selectedAnomaly.relatedTransactionId}` : null}
                {selectedAnomaly.relatedTransactionId && selectedAnomaly.relatedMatchId ? ' | ' : null}
                {selectedAnomaly.relatedMatchId ? `Match #${selectedAnomaly.relatedMatchId}` : null}
              </Typography>
            </>
          ) : null}

          <SectionDivider label={isOpen ? 'Resolution Notes' : 'Resolution'} />

          {isOpen ? (
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Resolution Notes"
              error={Boolean(errors.resolutionNotes?.message)}
              helperText={errors.resolutionNotes?.message || ' '}
              {...resolutionNotesProps}
            />
          ) : (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoCard label="Resolved At" value={fmtDate(selectedAnomaly.resolvedAt)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoCard label="Resolution Notes" value={selectedAnomaly.resolutionNotes || '—'} />
              </Grid>
            </Grid>
          )}
        </Stack>
      ) : null}
    </ModalShell>
  )
}

AnomalyDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedAnomaly: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  resolveBusy: PropTypes.bool,
  cleanupBusy: PropTypes.bool,
  viewingInvoiceId: PropTypes.number,
  onResolve: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
  onKeepItem: PropTypes.func.isRequired,
  onViewInvoice: PropTypes.func.isRequired,
}

AnomalyDetailsModal.defaultProps = {
  selectedAnomaly: null,
  loading: false,
  error: '',
  resolveBusy: false,
  cleanupBusy: false,
  viewingInvoiceId: null,
}
