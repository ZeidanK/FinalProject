import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  TableSortLabel,
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
import { useRealtime } from '../context/useRealtime'
import {
  downloadInvoicePdf,
  getInvoiceById,
} from '../services/invoices'
import { deleteUploadJob, deleteUploadJobsByCompany, getMyUploadJobs, getUploadJobStatus, markUploadJobVerified } from '../services/uploadJobs'
import { itemVariants } from '../utils/motionVariants'
import InvoiceVerificationModal from '../components/InvoiceVerificationModal'
import { mapExtractedToForm, mapSavedInvoiceToForm } from '../utils/invoiceExtraction'
import {
  useBulkDeleteInvoicesMutation,
  useCreateInvoiceMutation,
  useDeleteInvoiceMutation,
  useInvoicesByCompanyQuery,
  useUpdateInvoiceMutation,
  useUploadInvoicePdfMutation,
} from '../hooks/queries/useInvoicesQueries'

/**
 * Maximum supported invoice PDF upload size in bytes.
 * @type {number}
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Maps invoice processing status values to MUI chip colors.
 * @type {{[key: string]: string}}
 */
const statusColors = {
  uploaded: 'info',
  processing: 'warning',
  extracted: 'secondary',
  verified: 'success',
  matched: 'success',
  rejected: 'error',
}

/**
 * Invoice management page for uploading, reviewing, and editing PDFs.
 * Handles upload queue processing, verification workflows, and invoice list actions.
 *
 * @returns {JSX.Element} Rendered invoice page interface.
 */
function InvoicesPage() {
  const { token } = useAuth()
  const { activeCompanyId } = useCompany()
  const { isConnected: isRealtimeConnected, subscribe: subscribeRealtime } = useRealtime()

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
  const [sortKey, setSortKey] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')

  // ===================== Background-job polling =====================

  const pollingTimers = useRef({})
  const POLL_INTERVAL_MS = 4000

  const sessionKey = activeCompanyId ? `invoice_upload_jobs_${activeCompanyId}` : null

  const saveJobToSession = useCallback(
    (entry, jobId) => {
      if (!sessionKey) return
      try {
        const stored = JSON.parse(sessionStorage.getItem(sessionKey) || '[]')
        const deduped = stored.filter((j) => j.jobId !== jobId)
        deduped.push({ id: entry.id, jobId, name: entry.name, size: entry.size })
        sessionStorage.setItem(sessionKey, JSON.stringify(deduped))
      } catch {
        // ignore storage errors
      }
    },
    [sessionKey],
  )

  const removeJobFromSession = useCallback(
    (jobId) => {
      if (!sessionKey) return
      try {
        const stored = JSON.parse(sessionStorage.getItem(sessionKey) || '[]')
        sessionStorage.setItem(sessionKey, JSON.stringify(stored.filter((j) => j.jobId !== jobId)))
      } catch {
        // ignore storage errors
      }
    },
    [sessionKey],
  )

  const stopPolling = useCallback((jobId) => {
    if (pollingTimers.current[jobId]) {
      clearTimeout(pollingTimers.current[jobId])
      delete pollingTimers.current[jobId]
    }
  }, [])

  const applyUploadJobUpdate = useCallback(
    (job, fileEntryId = null) => {
      const normalizedJobId = job?.id ?? job?.Id
      if (!normalizedJobId) return false

      const status = (job?.status ?? job?.Status ?? '').toLowerCase()
      const progressPercent = job?.progressPercent ?? job?.ProgressPercent ?? 0
      const errorMessage = job?.errorMessage ?? job?.ErrorMessage
      const resultJson = job?.resultJson ?? job?.ResultJson
      const filePath = job?.filePath ?? job?.FilePath
      const fileOriginalName = job?.fileOriginalName ?? job?.FileOriginalName
      const fileType = job?.fileType ?? job?.FileType
      const fileSize = job?.fileSize ?? job?.FileSize

      const isTargetFile = (fileEntry) => {
        if (fileEntryId) return fileEntry.id === fileEntryId
        return fileEntry.jobId === normalizedJobId
      }

      if (status === 'completed') {
        let extractedData = null
        let serverResponse = null

        try {
          const result = JSON.parse(resultJson || 'null')
          if (result?.extractedData) {
            serverResponse = {
              filePath,
              fileOriginalName,
              fileType,
              fileSize,
              extractedData: result.extractedData,
            }
            extractedData = mapExtractedToForm(
              result.extractedData,
              result.extractedData?.extractionConfidence,
            )
          }
        } catch {
          // Ignore malformed result payload and mark as error below.
        }

        setFiles((prev) =>
          prev.map((f) =>
            isTargetFile(f)
              ? {
                  ...f,
                  status: extractedData ? 'completed' : 'error',
                  progress: 100,
                  serverResponse,
                  extractedData,
                  error: extractedData ? null : 'Extraction finished but returned no data.',
                  jobId: normalizedJobId,
                }
              : f,
          ),
        )

        return true
      }

      if (status === 'failed' || status === 'canceled') {
        setFiles((prev) =>
          prev.map((f) =>
            isTargetFile(f)
              ? { ...f, status: 'error', progress: 0, error: errorMessage || 'Processing failed.' }
              : f,
          ),
        )

        return true
      }

      setFiles((prev) =>
        prev.map((f) =>
          isTargetFile(f)
            ? { ...f, progress: Math.min(90, progressPercent || 20), jobId: normalizedJobId }
            : f,
        ),
      )

      return false
    },
    [],
  )

  const startPolling = useCallback(
    (jobId, fileEntryId) => {
      const poll = async () => {
        try {
          const job = await getUploadJobStatus(jobId, token)

          const terminal = applyUploadJobUpdate(job, fileEntryId)
          if (terminal) {
            stopPolling(jobId)
            removeJobFromSession(jobId)
            return
          }

          pollingTimers.current[jobId] = setTimeout(poll, POLL_INTERVAL_MS)
        } catch {
          // Transient network error — back off and retry
          pollingTimers.current[jobId] = setTimeout(poll, POLL_INTERVAL_MS * 2)
        }
      }

      pollingTimers.current[jobId] = setTimeout(poll, POLL_INTERVAL_MS)
    },
    [token, applyUploadJobUpdate, stopPolling, removeJobFromSession],
  )

  useEffect(() => {
    if (!isRealtimeConnected) return

    const unsubscribe = subscribeRealtime('uploadJobUpdated', (job) => {
      const normalizedJobId = job?.id ?? job?.Id
      if (!normalizedJobId) return

      const terminal = applyUploadJobUpdate(job)
      if (!terminal) return

      stopPolling(normalizedJobId)
      removeJobFromSession(normalizedJobId)
    })

    return unsubscribe
  }, [isRealtimeConnected, subscribeRealtime, applyUploadJobUpdate, stopPolling, removeJobFromSession])

  // Restore any in-flight jobs from sessionStorage when the page (re-)mounts or company changes
  useEffect(() => {
    if (!sessionKey || !token) return

    let stored = []
    try {
      stored = JSON.parse(sessionStorage.getItem(sessionKey) || '[]')
    } catch {
      return
    }
    if (stored.length === 0) return

    const restoredEntries = stored.map((j) => ({
      id: j.id,
      file: null,
      name: j.name,
      size: j.size,
      status: 'extracting',
      error: null,
      progress: 50,
      extractedData: null,
      serverResponse: null,
      jobId: j.jobId,
    }))

    setFiles((prev) => {
      const existingJobIds = new Set(prev.map((f) => f.jobId).filter(Boolean))
      const newOnes = restoredEntries.filter((e) => !existingJobIds.has(e.jobId))
      return newOnes.length > 0 ? [...prev, ...newOnes] : prev
    })

    restoredEntries.forEach((e) => startPolling(e.jobId, e.id))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey, token])

  // Clean up all polling timers on unmount
  useEffect(() => {
    return () => {
      Object.values(pollingTimers.current).forEach(clearTimeout)
      pollingTimers.current = {}
    }
  }, [])

  // ===================== Data Fetching =====================
  // Restore jobs from the server DB — runs on every login / company switch.
  // This is the persistent path (survives logout). sessionStorage only covers
  // same-tab navigation within a single session.
  useEffect(() => {
    if (!activeCompanyId || !token) return

    let cancelled = false

    const restoreFromServer = async () => {
      try {
        const jobs = await getMyUploadJobs(token, { companyId: activeCompanyId, take: 100 })
        if (cancelled || !Array.isArray(jobs)) return

        // Only invoice PDF jobs that the user hasn't verified yet
        const pending = jobs.filter(
          (j) =>
            j.jobType === 'invoice_upload_pdf' &&
            (j.status === 'completed' || j.status === 'queued' || j.status === 'processing'),
        )
        if (pending.length === 0) return

        setFiles((prev) => {
          const existingJobIds = new Set(prev.map((f) => f.jobId).filter(Boolean))
          const toAdd = []

          for (const job of pending) {
            if (existingJobIds.has(job.id)) continue // already tracked in this session

            if (job.status === 'completed') {
              let extractedData = null
              let serverResponse = null
              try {
                const result = JSON.parse(job.resultJson || 'null')
                if (result?.extractedData) {
                  serverResponse = {
                    filePath: job.filePath,
                    fileOriginalName: job.fileOriginalName,
                    fileType: job.fileType,
                    fileSize: job.fileSize,
                    extractedData: result.extractedData,
                  }
                  extractedData = mapExtractedToForm(
                    result.extractedData,
                    result.extractedData?.extractionConfidence,
                  )
                }
              } catch { /* skip unparseable jobs */ }

              if (!extractedData) continue // can't restore without data

              toAdd.push({
                id: `restored-${job.id}`,
                file: null,
                name: job.fileOriginalName || job.filePath?.split('/').pop() || `Job ${job.id}`,
                size: job.fileSize || 0,
                status: 'completed',
                error: null,
                progress: 100,
                extractedData,
                serverResponse,
                jobId: job.id,
              })
            } else {
              // queued / processing — add as extracting and resume polling
              toAdd.push({
                id: `restored-${job.id}`,
                file: null,
                name: job.fileOriginalName || job.filePath?.split('/').pop() || `Job ${job.id}`,
                size: job.fileSize || 0,
                status: 'extracting',
                error: null,
                progress: Math.max(job.progressPercent || 0, 10),
                extractedData: null,
                serverResponse: null,
                jobId: job.id,
              })
              startPolling(job.id, `restored-${job.id}`)
            }
          }

          return toAdd.length > 0 ? [...prev, ...toAdd] : prev
        })
      } catch {
        // Non-critical — user just won't see restored jobs this time
      }
    }

    restoreFromServer()
    return () => { cancelled = true }
  // startPolling is stable (wrapped in useCallback with no changing deps that affect this)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCompanyId, token])

  const handleClearQueue = useCallback(async () => {
    if (!activeCompanyId) return
    const confirmed = globalThis.confirm(
      'Clear the entire upload queue for this company? This will remove all pending upload jobs and their files.',
    )
    if (!confirmed) return

    try {
      await deleteUploadJobsByCompany(activeCompanyId, token)
      // Stop any active polling for the current company and clear state
      Object.keys(pollingTimers.current).forEach((key) => {
        const jobId = Number(key)
        stopPolling(jobId)
      })
      pollingTimers.current = {}
      if (sessionKey) {
        try { sessionStorage.removeItem(sessionKey) } catch { /* ignore */ }
      }
      setFiles([])
      setSnack({ open: true, message: 'Upload queue cleared.', severity: 'success' })
    } catch (err) {
      setSnack({ open: true, message: err.message || 'Failed to clear queue.', severity: 'error' })
    }
  }, [activeCompanyId, token, stopPolling, removeJobFromSession])

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

  /**
   * Validates an uploaded file before processing.
   * @param {File} file - The uploaded file to validate.
   * @returns {string|null} Error message for invalid files, or null when valid.
   */
  const validateFile = (file) => {
    if (file.type !== 'application/pdf') return 'Only PDF files are accepted.'
    if (file.size > MAX_FILE_SIZE) return 'File exceeds 10 MB limit.'
    return null
  }

  /**
   * Uploads an invoice PDF to the server and updates the upload queue state.
   * @param {Object} entry - Upload queue entry containing the file and metadata.
   */
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

        // Async path: server returned a background job id — poll until Gemini finishes
        const jobId = response?.jobId ?? response?.JobId
        if (jobId) {
          saveJobToSession(entry, jobId)
          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? { ...f, status: 'extracting', progress: 50, jobId }
                : f,
            ),
          )
          startPolling(jobId, entry.id)
          return
        }

        // Legacy sync path (fallback — should not normally occur after the async migration)
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? {
                  ...f,
                  status: response?.extractedData ? 'completed' : 'error',
                  progress: 100,
                  serverResponse: response,
                  extractedData: response?.extractedData
                    ? mapExtractedToForm(
                        response.extractedData,
                        response.extractedData?.extractionConfidence,
                      )
                    : null,
                  error: response?.extractedData ? null : 'No extraction data returned.',
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
    [activeCompanyId, uploadInvoiceMutation, saveJobToSession, startPolling],
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
        jobId: null,
      }
    })
    setFiles((prev) => [...prev, ...entries])

    // Auto-upload valid files
    entries
      .filter((e) => e.status === 'pending')
      .forEach((entry) => processFile(entry))
  }, [activeCompanyId, processFile])

  const removeFile = useCallback(async (id) => {
    const entry = files.find((f) => f.id === id)
    if (entry?.jobId) {
      stopPolling(entry.jobId)
      removeJobFromSession(entry.jobId)
      try {
        await deleteUploadJob(entry.jobId, token)
      } catch {
        // UI removal continues even if backend delete fails.
      }
    }
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [files, token, stopPolling, removeJobFromSession])

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
        const paymentPlanTotalInstallmentsInput = formData.paymentPlan?.totalInstallments?.value
        const paymentPlanInstallmentAmountInput = formData.paymentPlan?.installmentAmount?.value
        const paymentPlanCurrentInstallmentInput = formData.paymentPlan?.currentInstallment?.value

        const paymentPlanTotalInstallments =
          paymentPlanTotalInstallmentsInput === '' || paymentPlanTotalInstallmentsInput == null
            ? sourceInvoice.paymentPlanTotalInstallments ??
              sourceInvoice.payment_plan_total_installments ??
              null
            : Number.parseInt(paymentPlanTotalInstallmentsInput, 10) || 0

        const paymentPlanInstallmentAmount =
          paymentPlanInstallmentAmountInput === '' || paymentPlanInstallmentAmountInput == null
            ? sourceInvoice.paymentPlanInstallmentAmount ??
              sourceInvoice.payment_plan_installment_amount ??
              null
            : Number.parseFloat(paymentPlanInstallmentAmountInput) || 0

        const paymentPlanCurrentInstallment =
          paymentPlanCurrentInstallmentInput === '' || paymentPlanCurrentInstallmentInput == null
            ? sourceInvoice.paymentPlanCurrentInstallment ??
              sourceInvoice.payment_plan_current_installment ??
              null
            : Number.parseInt(paymentPlanCurrentInstallmentInput, 10) || 0

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
          paymentPlanTotalInstallments,
          paymentPlanInstallmentAmount,
          paymentPlanFrequency:
            formData.paymentPlan?.frequency?.value ||
            sourceInvoice.paymentPlanFrequency ||
            sourceInvoice.payment_plan_frequency ||
            null,
          paymentPlanCurrentInstallment,
          paymentPlanDescription:
            formData.paymentPlan?.description?.value ||
            sourceInvoice.paymentPlanDescription ||
            sourceInvoice.payment_plan_description ||
            null,
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

          // Mark file as verified and clean up session storage
          setFiles((prev) =>
            prev.map((f) =>
              f.id === modal.file?.id ? { ...f, status: 'verified' } : f,
            ),
          )
          if (modal.file?.jobId) {
            removeJobFromSession(modal.file.jobId)
            // Fire-and-forget: mark the job verified in the DB so it won't
            // reappear in the restoration queue after logout/login
            markUploadJobVerified(modal.file.jobId, token).catch(() => {})
          }

          // Handle duplicate invoice — saved but flagged as anomaly
          if (result?.isDuplicate) {
            setSnack({
              open: true,
              message:
                'This invoice number already exists. The upload was saved and flagged as a duplicate — check the Anomalies page for details.',
              severity: 'warning',
            })
          } else {
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
    [activeCompanyId, createInvoiceMutation, updateInvoiceMutation, modal.file, invoicesQuery, removeJobFromSession, token],
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

  const handleSort = useCallback((columnKey) => {
    if (sortKey === columnKey) {
      setSortDirection((prevDirection) => (prevDirection === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(columnKey)
    setSortDirection('asc')
  }, [sortKey])

  const compareNullableValues = useCallback((a, b, direction = 'asc') => {
    const aMissing = a == null
    const bMissing = b == null

    if (aMissing && bMissing) return 0
    if (aMissing) return 1
    if (bMissing) return -1

    let result = 0

    if (typeof a === 'number' && typeof b === 'number') {
      result = a - b
    } else {
      result = String(a).localeCompare(String(b), undefined, {
        sensitivity: 'base',
        numeric: true,
      })
    }

    return direction === 'desc' ? -result : result
  }, [])

  const getSortValue = useCallback((invoice, columnKey) => {
    switch (columnKey) {
      case 'invoiceNumber': {
        const invoiceNumber = invoice.invoice_number || invoice.invoiceNumber || ''
        return invoiceNumber.trim() || null
      }
      case 'vendor': {
        const vendor = invoice.vendor_name || invoice.vendorName || ''
        return vendor.trim() || null
      }
      case 'date': {
        const rawDate = invoice.invoice_date || invoice.invoiceDate
        if (!rawDate) return null

        const timestamp = new Date(rawDate).getTime()
        return Number.isNaN(timestamp) ? null : timestamp
      }
      case 'total': {
        const numericAmount = Number(invoice.total_amount ?? invoice.totalAmount)
        return Number.isFinite(numericAmount) ? numericAmount : null
      }
      case 'currency': {
        const currency = invoice.currency || ''
        return currency.trim() || null
      }
      case 'status': {
        const status = invoice.status || ''
        return status.trim() || null
      }
      case 'confidence': {
        const confidence = Number(invoice.ai_extraction_confidence ?? invoice.aiExtractionConfidence)
        return Number.isFinite(confidence) ? confidence : null
      }
      default:
        return null
    }
  }, [])

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      const valueA = getSortValue(a, sortKey)
      const valueB = getSortValue(b, sortKey)
      return compareNullableValues(valueA, valueB, sortDirection)
    })
  }, [invoices, sortKey, sortDirection, getSortValue, compareNullableValues])

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
              <TableCell sortDirection={sortKey === 'invoiceNumber' ? sortDirection : false}>
                <TableSortLabel
                  active={sortKey === 'invoiceNumber'}
                  direction={sortKey === 'invoiceNumber' ? sortDirection : 'asc'}
                  onClick={() => handleSort('invoiceNumber')}
                >
                  Invoice #
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortKey === 'vendor' ? sortDirection : false}>
                <TableSortLabel
                  active={sortKey === 'vendor'}
                  direction={sortKey === 'vendor' ? sortDirection : 'asc'}
                  onClick={() => handleSort('vendor')}
                >
                  Vendor
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortKey === 'date' ? sortDirection : false}>
                <TableSortLabel
                  active={sortKey === 'date'}
                  direction={sortKey === 'date' ? sortDirection : 'asc'}
                  onClick={() => handleSort('date')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sortDirection={sortKey === 'total' ? sortDirection : false}>
                <TableSortLabel
                  active={sortKey === 'total'}
                  direction={sortKey === 'total' ? sortDirection : 'asc'}
                  onClick={() => handleSort('total')}
                >
                  Total
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sortDirection={sortKey === 'currency' ? sortDirection : false}>
                <TableSortLabel
                  active={sortKey === 'currency'}
                  direction={sortKey === 'currency' ? sortDirection : 'asc'}
                  onClick={() => handleSort('currency')}
                >
                  Currency
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sortDirection={sortKey === 'status' ? sortDirection : false}>
                <TableSortLabel
                  active={sortKey === 'status'}
                  direction={sortKey === 'status' ? sortDirection : 'asc'}
                  onClick={() => handleSort('status')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sortDirection={sortKey === 'confidence' ? sortDirection : false}>
                <TableSortLabel
                  active={sortKey === 'confidence'}
                  direction={sortKey === 'confidence' ? sortDirection : 'asc'}
                  onClick={() => handleSort('confidence')}
                >
                  Confidence
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedInvoices.map((inv) => (
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
                    } else if (entry.status === 'uploading' || entry.status === 'extracting') {
                      entryIcon = <CircularProgress size={22} color="inherit" />
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
                          {entry.status === 'extracting' && (
                            <>
                              <LinearProgress
                                variant={entry.progress >= 20 ? 'determinate' : 'indeterminate'}
                                value={entry.progress}
                                sx={{ mt: 0.5, borderRadius: 1 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                Extracting with AI… this may take a few moments
                              </Typography>
                            </>
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

          {/* ---- Queue Actions ---- */}
          {pendingFiles.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                size="small"
                color="error"
                variant="outlined"
                onClick={handleClearQueue}
              >
                Clear Upload Queue
              </Button>
            </Stack>
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
        fileType={
          modal.file?.sourceInvoice?.fileType ||
          modal.file?.sourceInvoice?.file_type ||
          modal.file?.serverResponse?.fileType ||
          modal.file?.file?.type ||
          'application/pdf'
        }
        invoiceId={modal.file?.existingInvoiceId || null}
        uploadJobId={modal.file?.jobId || null}
        token={token}
        localFile={modal.file?.file || null}
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
