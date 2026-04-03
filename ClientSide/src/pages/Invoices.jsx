import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  LinearProgress,
  Skeleton,
  Snackbar,
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
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import { motion } from 'framer-motion'
import { useAuth } from '../context/useAuth'
import {
  createInvoice,
  downloadInvoicePdf,
  getInvoicesByCompany,
  uploadInvoicePdf,
} from '../services/invoices'
import InvoiceVerificationModal from '../components/InvoiceVerificationModal'
import { mapExtractedToForm } from '../utils/invoiceExtraction'

const MAX_FILE_SIZE = 10 * 1024 * 1024

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

const statusColors = {
  uploaded: 'info',
  processing: 'warning',
  extracted: 'secondary',
  verified: 'success',
  matched: 'success',
  rejected: 'error',
}

function InvoicesPage() {
  const { user, token } = useAuth()
  const companyId = user?.companyId || DEFAULT_COMPANY_ID

  // --- Invoice list state ---
  const [invoices, setInvoices] = useState([])
  const [listLoading, setListLoading] = useState(true)
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

  // ===================== Data Fetching =====================

  const loadInvoices = useCallback(async () => {
    setListLoading(true)
    setListError('')
    try {
      const data = await getInvoicesByCompany(companyId, {}, token)
      setInvoices(Array.isArray(data) ? data : [])
    } catch (err) {
      setListError(err.message || 'Failed to load invoices.')
    } finally {
      setListLoading(false)
    }
  }, [companyId, token])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

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
        const response = await uploadInvoicePdf(entry.file, companyId, token)

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
    [companyId, token],
  )

  const addFiles = useCallback((fileList) => {
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
  }, [processFile])

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

  const handleSaveVerification = useCallback(
    async (formData) => {
      setSaving(true)
      try {
        const serverResponse = modal.file?.serverResponse || {}
        const fileOriginalName = serverResponse.fileOriginalName || serverResponse.FileOriginalName || modal.file?.name || null
        const filePath = serverResponse.filePath || serverResponse.FilePath || null
        const fileType = serverResponse.fileType || serverResponse.FileType || modal.file?.file?.type || null
        const fileSize = serverResponse.fileSize || serverResponse.FileSize || modal.file?.file?.size || null
        const aiConfidence = formData?.confidence?.value ?? serverResponse?.extractedData?.extractionConfidence ?? serverResponse?.ExtractedData?.ExtractionConfidence ?? null

        const payload = {
          companyId,
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

        const result = await createInvoice(payload, true, token)

        // Mark file as verified
        setFiles((prev) =>
          prev.map((f) =>
            f.id === modal.file?.id ? { ...f, status: 'verified' } : f,
          ),
        )

        setModal({ open: false, file: null })
        
        // Show success message with auto-match result
        const autoMatchResult = result?.autoMatchResult
        if (autoMatchResult?.matched) {
          setSnack({ 
            open: true, 
            message: `Invoice created and automatically matched! (${autoMatchResult.matchScore?.toFixed(1)}% confidence)`, 
            severity: 'success' 
          })
        } else {
          setSnack({ open: true, message: 'Invoice created successfully!', severity: 'success' })
        }
        
        loadInvoices()
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
    [companyId, token, modal.file, loadInvoices],
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
              <TableCell>Invoice #</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="center">Currency</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Confidence</TableCell>
              <TableCell align="center">File</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id} hover>
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
                  {(inv.ai_extraction_confidence ?? inv.aiExtractionConfidence) == null
                    ? '—'
                    : `${Math.round((inv.ai_extraction_confidence ?? inv.aiExtractionConfidence) * 100)}%`}
                </TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={openingInvoiceId === inv.id ? <CircularProgress size={14} /> : <VisibilityRoundedIcon />}
                    onClick={() => handleOpenInvoice(inv)}
                    disabled={openingInvoiceId === inv.id}
                  >
                    Open
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

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
                    Invoices
                  </Typography>
                  <Typography color="text.secondary">
                    Upload PDF invoices for AI extraction, review, and reconciliation.
                  </Typography>
                </Stack>
                <Button
                  variant="outlined"
                  startIcon={<RefreshRoundedIcon />}
                  onClick={loadInvoices}
                  disabled={listLoading}
                >
                  Refresh
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* ---- Upload Drop Zone ---- */}
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
                Invoice Records
              </Typography>

              {invoiceListContent}
            </CardContent>
          </Card>
        </Stack>
      </Container>

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

export default InvoicesPage
