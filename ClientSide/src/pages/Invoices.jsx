import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { motion } from 'framer-motion'
import PageHeaderCard from '../components/PageHeaderCard'
import PageSectionLayout from '../components/PageSectionLayout'
import SnackbarAlert from '../components/SnackbarAlert'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import {
  downloadInvoicePdf,
  getInvoiceById,
} from '../services/invoices'
import { itemVariants } from '../utils/motionVariants'
import InvoiceVerificationModal from '../components/InvoiceVerificationModal'
import { mapExtractedToForm } from '../utils/invoiceExtraction'
import {
  useBulkDeleteInvoicesMutation,
  useCreateInvoiceMutation,
  useDeleteInvoiceMutation,
  useInvoicesByCompanyQuery,
  useUpdateInvoiceMutation,
  useUploadInvoicePdfMutation,
} from '../hooks/queries/useInvoicesQueries'

const MAX_FILE_SIZE = 10 * 1024 * 1024

const statusColors = {
  uploaded: 'info',
  processing: 'warning',
  extracted: 'secondary',
  verified: 'success',
  matched: 'success',
  rejected: 'error',
}

const toDateInput = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value.includes('T') ? value.split('T')[0] : value.slice(0, 10)
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

const mapSavedInvoiceToForm = (invoice) => {
  const confidence = invoice?.ai_extraction_confidence ?? invoice?.aiExtractionConfidence ?? null
  const lineItems = invoice?.lineItems || invoice?.line_items || []

  return mapExtractedToForm(
    {
      vendorName: invoice?.vendor_name ?? invoice?.vendorName ?? '',
      invoiceNumber: invoice?.invoice_number ?? invoice?.invoiceNumber ?? '',
      invoiceDate: toDateInput(invoice?.invoice_date ?? invoice?.invoiceDate),
      dueDate: toDateInput(invoice?.due_date ?? invoice?.dueDate),
      totalAmount: invoice?.total_amount ?? invoice?.totalAmount ?? 0,
      subtotal: invoice?.subtotal ?? 0,
      vatRate: invoice?.vat_rate ?? invoice?.vatRate ?? null,
      vatAmount: invoice?.vat_amount ?? invoice?.vatAmount ?? null,
      currency: invoice?.currency ?? 'USD',
      vendorTaxId: invoice?.vendor_tax_id ?? invoice?.vendorTaxId ?? '',
      lastFourDigitsCard: invoice?.last_four_digits_card ?? invoice?.lastFourDigitsCard ?? '',
      lineItems: lineItems.map((li, idx) => ({
        description: li?.description || '',
        quantity: li?.quantity ?? 1,
        unitPrice: li?.unit_price ?? li?.unitPrice ?? 0,
        totalAmount: li?.total_amount ?? li?.totalAmount ?? 0,
        aiConfidenceScore: li?.ai_confidence_score ?? li?.aiConfidenceScore ?? null,
        lineNumber: li?.line_number ?? li?.lineNumber ?? idx + 1,
      })),
      extractionConfidence: confidence,
    },
    confidence,
  )
}

function InvoicesPage() {
  const { token } = useAuth()
  const { activeCompanyId } = useCompany()

  // --- Invoice list state ---
  const [invoices, setInvoices] = useState([])
  const [listError, setListError] = useState('')

  // --- Upload state ---
  const [files, setFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  // --- Verification modal ---
  const [modal, setModal] = useState({ open: false, file: null })
  const [saving, setSaving] = useState(false)

  // --- Snackbar ---
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' })
  const [openingInvoiceId, setOpeningInvoiceId] = useState(null)
  const [reopeningInvoiceId, setReopeningInvoiceId] = useState(null)
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([])
  const [deletingInvoiceIds, setDeletingInvoiceIds] = useState([])
  const [bulkDeletingInvoices, setBulkDeletingInvoices] = useState(false)

  // ===================== Data Fetching =====================

  const invoicesQuery = useInvoicesByCompanyQuery({
    companyId: activeCompanyId,
    filters: {},
    token,
  })
  const uploadInvoiceMutation = useUploadInvoicePdfMutation({ token })
  const createInvoiceMutation = useCreateInvoiceMutation({
    companyId: activeCompanyId,
    filters: {},
    token,
  })
  const updateInvoiceMutation = useUpdateInvoiceMutation({
    companyId: activeCompanyId,
    filters: {},
    token,
  })
  const deleteInvoiceMutation = useDeleteInvoiceMutation({
    companyId: activeCompanyId,
    filters: {},
    token,
  })
  const bulkDeleteInvoicesMutation = useBulkDeleteInvoicesMutation({
    companyId: activeCompanyId,
    filters: {},
    token,
  })

  const listLoading = invoicesQuery.isLoading || invoicesQuery.isFetching

  useEffect(() => {
    if (invoicesQuery.error) {
      setListError(invoicesQuery.error.message || 'Failed to load invoices.')
      return
    }

    setListError('')
    setInvoices(Array.isArray(invoicesQuery.data) ? invoicesQuery.data : [])
    setSelectedInvoiceIds([])
  }, [invoicesQuery.data, invoicesQuery.error])

  // ===================== Upload Handlers =====================

  const validateFile = (file) => {
    if (file.type !== 'application/pdf') return 'Only PDF files are accepted.'
    if (file.size > MAX_FILE_SIZE) return 'File exceeds 10 MB limit.'
    return null
  }

  const processFile = useCallback(
    async (entry) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === entry.id ? { ...f, status: 'uploading', progress: 30 } : f)),
      )

      try {
        const response = await uploadInvoiceMutation.mutateAsync({
          file: entry.file,
          companyId: activeCompanyId,
        })

        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? {
                  ...f,
                  status: 'completed',
                  progress: 100,
                  serverResponse: response,
                  extractedData: mapExtractedToForm(
                    response.extractedData,
                    response.extractedData?.extractionConfidence,
                  ),
                }
              : f,
          ),
        )
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? { ...f, status: 'error', progress: 0, error: err.message || 'Upload failed.' }
              : f,
          ),
        )
      }
    },
    [activeCompanyId, uploadInvoiceMutation],
  )

  const addFiles = useCallback((fileList) => {
    if (!activeCompanyId) {
      setSnack({
        open: true,
        message: 'Select an assigned company before uploading invoices.',
        severity: 'warning',
      })
      return
    }

    const entries = Array.from(fileList).map((file) => {
      const error = validateFile(file)
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        name: file.name,
        size: file.size,
        status: error ? 'error' : 'pending',
        error,
        progress: 0,
        extractedData: null,
        serverResponse: null,
      }
    })
    setFiles((prev) => [...prev, ...entries])

    // Auto-upload valid files
    entries
      .filter((e) => e.status === 'pending')
      .forEach((entry) => processFile(entry))
  }, [activeCompanyId, processFile])

  const removeFile = useCallback((id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  // --- Drag handlers ---
  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
    },
    [addFiles],
  )

  const handleFileInput = useCallback(
    (e) => {
      if (e.target.files?.length) addFiles(e.target.files)
      e.target.value = ''
    },
    [addFiles],
  )

  // ===================== Verification =====================

  const openVerification = useCallback((fileEntry) => {
    setModal({ open: true, file: fileEntry })
  }, [])

  const openSavedInvoiceVerification = useCallback(
    async (invoiceId) => {
      if (!invoiceId) return
      setReopeningInvoiceId(invoiceId)
      try {
        const invoice = await getInvoiceById(invoiceId, token)
        const formData = mapSavedInvoiceToForm(invoice)
        setModal({
          open: true,
          file: {
            id: `saved-${invoice.id}`,
            name: invoice.fileOriginalName || invoice.file_original_name || `Invoice ${invoice.invoiceNumber || invoice.invoice_number || invoice.id}`,
            extractedData: formData,
            existingInvoiceId: invoice.id,
            sourceInvoice: invoice,
            serverResponse: null,
          },
        })
      } catch (err) {
        setSnack({
          open: true,
          message: err.message || 'Failed to open invoice for editing.',
          severity: 'error',
        })
      } finally {
        setReopeningInvoiceId(null)
      }
    },
    [token],
  )

  const handleSaveVerification = useCallback(
    async (formData) => {
      setSaving(true)
      try {
        const editingInvoiceId = modal.file?.existingInvoiceId || null
        const sourceInvoice = modal.file?.sourceInvoice || {}
        const serverResponse = modal.file?.serverResponse || {}
        const fileOriginalName =
          serverResponse.fileOriginalName ||
          serverResponse.FileOriginalName ||
          sourceInvoice.fileOriginalName ||
          sourceInvoice.file_original_name ||
          modal.file?.name ||
          null
        const filePath = serverResponse.filePath || serverResponse.FilePath || sourceInvoice.filePath || sourceInvoice.file_path || null
        const fileType =
          serverResponse.fileType ||
          serverResponse.FileType ||
          sourceInvoice.fileType ||
          sourceInvoice.file_type ||
          modal.file?.file?.type ||
          null
        const fileSize =
          serverResponse.fileSize ||
          serverResponse.FileSize ||
          sourceInvoice.fileSize ||
          sourceInvoice.file_size ||
          modal.file?.file?.size ||
          null
        const aiConfidence =
          formData?.confidence?.value ??
          sourceInvoice.aiExtractionConfidence ??
          sourceInvoice.ai_extraction_confidence ??
          serverResponse?.extractedData?.extractionConfidence ??
          serverResponse?.ExtractedData?.ExtractionConfidence ??
          null

        const payload = {
          companyId: sourceInvoice.companyId || sourceInvoice.company_id || activeCompanyId,
          invoiceNumber: formData.invoiceNumber?.value || '',
          vendorName: formData.vendorName?.value || '',
          invoiceDate: formData.invoiceDate?.value || new Date().toISOString(),
          totalAmount: Number.parseFloat(formData.totalAmount?.value) || 0,
          subtotal: Number.parseFloat(formData.subtotal?.value) || 0,
          vatRate: Number.parseFloat(formData.vatRate?.value) || null,
          vatAmount: Number.parseFloat(formData.vatAmount?.value) || null,
          currency: formData.currency?.value || 'USD',
          vendorTaxId: formData.vendorTaxId?.value || null,
          lastFourDigitsCard: formData.lastFourDigitsCard?.value || null,
          dueDate: formData.dueDate?.value || null,
          paymentDate: sourceInvoice.paymentDate || sourceInvoice.payment_date || null,
          itemCount: sourceInvoice.itemCount || sourceInvoice.item_count || null,
          paymentPlanTotalInstallments:
            sourceInvoice.paymentPlanTotalInstallments || sourceInvoice.payment_plan_total_installments || null,
          paymentPlanInstallmentAmount:
            sourceInvoice.paymentPlanInstallmentAmount || sourceInvoice.payment_plan_installment_amount || null,
          paymentPlanFrequency:
            sourceInvoice.paymentPlanFrequency || sourceInvoice.payment_plan_frequency || null,
          paymentPlanDescription:
            sourceInvoice.paymentPlanDescription || sourceInvoice.payment_plan_description || null,
          fileOriginalName,
          filePath,
          fileType,
          fileSize,
          aiExtractionConfidence: aiConfidence,
          lineItems: (formData.lineItems || []).map((li, idx) => ({
            description: li.description || 'Item',
            unitPrice: Number.parseFloat(li.unitPrice) || 0,
            totalAmount: Number.parseFloat(li.totalAmount) || 0,
            lineNumber: idx + 1,
            quantity: Number.parseFloat(li.quantity) || 1,
            vatRate: Number.parseFloat(formData.vatRate?.value) || null,
            aiConfidenceScore: li.confidence ?? null,
          })),
        }

        if (editingInvoiceId) {
          await updateInvoiceMutation.mutateAsync({ invoiceId: editingInvoiceId, payload })
        } else {
          const result = await createInvoiceMutation.mutateAsync({ payload, autoMatch: true })

          // Mark file as verified
          setFiles((prev) =>
            prev.map((f) =>
              f.id === modal.file?.id ? { ...f, status: 'verified' } : f,
            ),
          )

          // Show success message with auto-match result
          const autoMatchResult = result?.autoMatchResult
          if (autoMatchResult?.matched) {
            setSnack({
              open: true,
              message: `Invoice created and automatically matched! (${autoMatchResult.matchScore?.toFixed(1)}% confidence)`,
              severity: 'success',
            })
          } else {
            setSnack({ open: true, message: 'Invoice created successfully!', severity: 'success' })
          }
        }

        setModal({ open: false, file: null })
        if (editingInvoiceId) {
          setSnack({ open: true, message: 'Invoice updated successfully!', severity: 'success' })
        }

        await invoicesQuery.refetch()
      } catch (err) {
        setSnack({
          open: true,
          message: err.message || 'Failed to save invoice.',
          severity: 'error',
        })
      } finally {
        setSaving(false)
      }
    },
    [activeCompanyId, createInvoiceMutation, updateInvoiceMutation, modal.file, invoicesQuery],
  )

  const handleOpenInvoice = useCallback(
    async (invoice) => {
      const invoiceId = invoice?.id
      if (!invoiceId) return

      setOpeningInvoiceId(invoiceId)
      try {
        const { blob } = await downloadInvoicePdf(invoiceId, token)
        const objectUrl = URL.createObjectURL(blob)
        window.open(objectUrl, '_blank', 'noopener,noreferrer')
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
      } catch (err) {
        let message = err.message || 'Unable to open this invoice file.'
        if (err.status === 404) {
          message = 'No saved file was found for this invoice.'
        }
        if (err.status === 403) {
          message = 'You are not allowed to open this invoice file.'
        }
        setSnack({ open: true, message, severity: 'error' })
      } finally {
        setOpeningInvoiceId(null)
      }
    },
    [token],
  )

  const visibleInvoiceIds = invoices
    .map((inv) => inv.id)
    .filter((id) => typeof id === 'number' && id > 0)

  const allInvoicesSelected =
    visibleInvoiceIds.length > 0 && visibleInvoiceIds.every((id) => selectedInvoiceIds.includes(id))

  const hasInvoiceSelection = selectedInvoiceIds.length > 0

  const toggleSelectAllInvoices = useCallback(() => {
    setSelectedInvoiceIds((prev) => {
      if (visibleInvoiceIds.length === 0) return []
      const allSelected = visibleInvoiceIds.every((id) => prev.includes(id))
      return allSelected
        ? prev.filter((id) => !visibleInvoiceIds.includes(id))
        : [...new Set([...prev, ...visibleInvoiceIds])]
    })
  }, [visibleInvoiceIds])

  const toggleInvoiceSelection = useCallback((invoiceId) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(invoiceId) ? prev.filter((id) => id !== invoiceId) : [...prev, invoiceId],
    )
  }, [])

  const handleDeleteInvoice = useCallback(
    async (invoice) => {
      const invoiceId = invoice?.id
      if (!invoiceId) return

      const invoiceLabel = invoice?.invoice_number || invoice?.invoiceNumber || `#${invoiceId}`
      const confirmed = globalThis.confirm(`Delete invoice ${invoiceLabel}? This action cannot be undone.`)
      if (!confirmed) return

      setDeletingInvoiceIds((prev) => [...prev, invoiceId])
      try {
        await deleteInvoiceMutation.mutateAsync(invoiceId)
        setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId))
        setSelectedInvoiceIds((prev) => prev.filter((id) => id !== invoiceId))
        setSnack({ open: true, message: 'Invoice deleted successfully.', severity: 'success' })
      } catch (err) {
        setSnack({ open: true, message: err.message || 'Failed to delete invoice.', severity: 'error' })
      } finally {
        setDeletingInvoiceIds((prev) => prev.filter((id) => id !== invoiceId))
      }
    },
    [deleteInvoiceMutation],
  )

  const handleBulkDeleteInvoices = useCallback(async () => {
    if (selectedInvoiceIds.length === 0) return

    const confirmed = globalThis.confirm(
      `Delete ${selectedInvoiceIds.length} selected invoice(s)? This action cannot be undone.`,
    )
    if (!confirmed) return

    setBulkDeletingInvoices(true)
    try {
      const response = await bulkDeleteInvoicesMutation.mutateAsync(selectedInvoiceIds)
      const deletedIds = Array.isArray(response?.deletedIds) ? response.deletedIds : selectedInvoiceIds
      const notFoundIds = Array.isArray(response?.notFoundIds) ? response.notFoundIds : []

      setInvoices((prev) => prev.filter((inv) => !deletedIds.includes(inv.id)))
      setSelectedInvoiceIds((prev) => prev.filter((id) => !deletedIds.includes(id)))

      if (notFoundIds.length > 0) {
        setSnack({
          open: true,
          message: `Deleted ${deletedIds.length} invoice(s). ${notFoundIds.length} were not found.`,
          severity: 'warning',
        })
      } else {
        setSnack({
          open: true,
          message: `Deleted ${deletedIds.length} invoice(s).`,
          severity: 'success',
        })
      }
    } catch (err) {
      setSnack({ open: true, message: err.message || 'Bulk delete failed.', severity: 'error' })
    } finally {
      setBulkDeletingInvoices(false)
    }
  }, [selectedInvoiceIds, bulkDeleteInvoicesMutation])

  // ===================== Render =====================

  const pendingFiles = files.filter((f) => f.status !== 'verified')

  let invoiceListContent

  if (listLoading) {
    invoiceListContent = (
      <Stack spacing={1}>
        {['invoice-skeleton-1', 'invoice-skeleton-2', 'invoice-skeleton-3', 'invoice-skeleton-4'].map((key) => (
          <Skeleton key={key} variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
        ))}
      </Stack>
    )
  } else if (invoices.length === 0) {
    invoiceListContent = (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <DescriptionRoundedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography color="text.secondary">
          No invoices yet. Upload a PDF above to get started.
        </Typography>
      </Box>
    )
  } else {
    invoiceListContent = (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={allInvoicesSelected}
                  indeterminate={hasInvoiceSelection && !allInvoicesSelected}
                  onChange={toggleSelectAllInvoices}
                />
              </TableCell>
              <TableCell>Invoice #</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="center">Currency</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Confidence</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={selectedInvoiceIds.includes(inv.id)}
                    onChange={() => toggleInvoiceSelection(inv.id)}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {inv.invoice_number || inv.invoiceNumber || '—'}
                  </Typography>
                </TableCell>
                <TableCell>{inv.vendor_name || inv.vendorName || '—'}</TableCell>
                <TableCell>
                  {(inv.invoice_date || inv.invoiceDate)
                    ? new Date(inv.invoice_date || inv.invoiceDate).toLocaleDateString()
                    : '—'}
                </TableCell>
                <TableCell align="right">
                  {(inv.total_amount ?? inv.totalAmount ?? 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell align="center">{inv.currency || 'USD'}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={inv.status || 'uploaded'}
                    size="small"
                    color={statusColors[inv.status] || 'default'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  {(() => {
                    const confidenceValue = inv.ai_extraction_confidence ?? inv.aiExtractionConfidence
                    const parsedConfidence = Number(confidenceValue)
                    if (confidenceValue == null || Number.isNaN(parsedConfidence)) return '—'
                    return `${Math.round(parsedConfidence * 100)}%`
                  })()}
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenInvoice(inv)}
                      disabled={openingInvoiceId === inv.id || bulkDeletingInvoices}
                      aria-label="Download invoice"
                      title="Download invoice"
                    >
                      {openingInvoiceId === inv.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <DownloadRoundedIcon fontSize="small" />
                      )}
                    </IconButton>
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={() => openSavedInvoiceVerification(inv.id)}
                      disabled={reopeningInvoiceId === inv.id || bulkDeletingInvoices}
                      aria-label="Reopen invoice"
                      title="Reopen invoice"
                    >
                      {reopeningInvoiceId === inv.id ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <EditRoundedIcon fontSize="small" />
                      )}
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteInvoice(inv)}
                      disabled={deletingInvoiceIds.includes(inv.id) || bulkDeletingInvoices}
                      aria-label="Delete invoice"
                      title="Delete invoice"
                    >
                      {deletingInvoiceIds.includes(inv.id) ? (
                        <CircularProgress size={16} color="error" />
                      ) : (
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  return (
    <>
      <PageSectionLayout>
          <PageHeaderCard
            title="Invoices"
            description="Upload PDF invoices for AI extraction, review, and reconciliation."
            onRefresh={() => invoicesQuery.refetch()}
            refreshDisabled={listLoading}
            variants={itemVariants}
          />

          {/* ---- Upload Drop Zone ---- */}
          {!activeCompanyId && (
            <Alert severity="warning" variant="outlined">
              Select a company from your assigned companies before uploading invoice PDFs.
            </Alert>
          )}

          <Card
            component={motion.div}
            variants={itemVariants}
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '2px dashed',
              borderColor: dragActive ? 'primary.main' : 'divider',
              bgcolor: dragActive ? 'rgba(88,166,255,0.06)' : 'transparent',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent sx={{ py: { xs: 4, md: 6 }, textAlign: 'center' }}>
              <CloudUploadRoundedIcon
                sx={{ fontSize: 48, color: dragActive ? 'primary.main' : 'text.secondary', mb: 1.5 }}
              />
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                Drop PDF files here or click to browse
              </Typography>
              <Typography variant="body2" color="text.secondary">
                PDF files only — up to 10 MB each
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                hidden
                onChange={handleFileInput}
              />
            </CardContent>
          </Card>

          {/* ---- Uploaded Files List ---- */}
          {pendingFiles.length > 0 && (
            <Card
              component={motion.div}
              variants={itemVariants}
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                background:
                  'linear-gradient(160deg, rgba(14,24,42,0.96), rgba(10,18,34,0.96))',
              }}
            >
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                  Upload Queue ({pendingFiles.length})
                </Typography>
                <Stack spacing={1.5}>
                  {pendingFiles.map((entry) => {
                    let entryColor = 'primary.main'
                    if (entry.status === 'error') entryColor = 'error.main'
                    else if (entry.status === 'completed') entryColor = 'success.main'

                    let entryIcon = <DescriptionRoundedIcon />
                    if (entry.status === 'completed') {
                      entryIcon = <CheckCircleRoundedIcon />
                    } else if (entry.status === 'error') {
                      entryIcon = <ErrorRoundedIcon />
                    }

                    return (
                      <Stack
                        key={entry.id}
                        direction="row"
                        alignItems="center"
                        spacing={2}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'rgba(255,255,255,0.03)',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        {/* Icon */}
                        <Box sx={{ color: entryColor }}>
                          {entryIcon}
                        </Box>

                        {/* File info + progress */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {entry.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(entry.size / 1024).toFixed(0)} KB
                            </Typography>
                          </Stack>
                          {entry.status === 'uploading' && (
                            <LinearProgress sx={{ mt: 0.5, borderRadius: 1 }} />
                          )}
                          {entry.status === 'error' && (
                            <Typography variant="caption" color="error.main">
                              {entry.error}
                            </Typography>
                          )}
                          {entry.status === 'completed' && (
                            <Typography variant="caption" color="success.main">
                              Ready for verification
                            </Typography>
                          )}
                        </Box>

                        {/* Actions */}
                        <Stack direction="row" spacing={0.5}>
                          {entry.status === 'completed' && entry.extractedData && (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<VisibilityRoundedIcon />}
                              onClick={(e) => {
                                e.stopPropagation()
                                openVerification(entry)
                              }}
                            >
                              Verify
                            </Button>
                          )}
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFile(entry.id)
                            }}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>
                    )
                  })}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* ---- Error Alert ---- */}
          {listError && (
            <Alert severity="error" variant="outlined" onClose={() => setListError('')}>
              {listError}
            </Alert>
          )}

          {/* ---- Invoice List Table ---- */}
          <Card
            component={motion.div}
            variants={itemVariants}
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background:
                'linear-gradient(160deg, rgba(14,24,42,0.96), rgba(10,18,34,0.96))',
            }}
          >
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Invoice Records {listLoading ? '' : `(${invoices.length})`}
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={bulkDeletingInvoices ? <CircularProgress size={14} /> : <DeleteOutlineRoundedIcon />}
                  onClick={handleBulkDeleteInvoices}
                  disabled={!hasInvoiceSelection || bulkDeletingInvoices}
                >
                  {bulkDeletingInvoices
                    ? 'Deleting...'
                    : `Delete Selected (${selectedInvoiceIds.length})`}
                </Button>
              </Stack>

              {invoiceListContent}
            </CardContent>
          </Card>
      </PageSectionLayout>

      {/* ---- Verification Modal ---- */}
      <InvoiceVerificationModal
        key={modal.file?.id || 'empty'}
        open={modal.open}
        onClose={() => setModal({ open: false, file: null })}
        onSave={handleSaveVerification}
        initialData={modal.file?.extractedData}
        fileName={modal.file?.name}
        extractionMethod={modal.file?.serverResponse?.extractedData?.extractionMethod}
        saving={saving}
      />

      {/* ---- Snackbar ---- */}
      <SnackbarAlert
        open={snack.open}
        message={snack.message}
        severity={snack.severity}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      />
    </>
  )
}

export default InvoicesPage
