import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Checkbox,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded'
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import Papa from 'papaparse'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import TransactionDetailsModal from '../components/TransactionDetailsModal'
import { useConfirm } from '../components/ConfirmContext'
import {
  bulkDeleteTransactions,
  deleteTransaction,
  getTransactionById,
  importExcelTransactions,
  previewExcel,
} from '../services/transactions'
import { getUploadJobStatus } from '../services/uploadJobs'
import { useTransactionsByCompanyQuery, useCreateTransactionsBulkMutation } from '../hooks/queries/useTransactionsQueries'
import { useRealtime } from '../context/useRealtime'
import { transactionKeys } from '../queries/queryKeys'
import {
  filterTransactionsByType,
  formatTransactionTypeLabel,
  getTransactionTypes,
  normalizeTransactionType,
} from '../utils/transactionHelpers'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const EXCEL_EXTENSIONS = new Set(['xlsx', 'xls'])

const typeColors = {
  credit: 'success',
  debit: 'error',
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
}

/**
 * Parse CSV text into normalized transaction preview rows.
 *
 * @param {string} text Raw CSV contents.
 * @param {number} [baseId=0] Base row identifier for stable preview keys.
 * @returns {Array<Object>} Parsed transaction rows with validation state.
 */
function parseCSVData(text, baseId = 0) {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header?.trim(),
  })

  const rows = Array.isArray(result.data) ? result.data : []

  return rows.map((raw, index) => {
    const transactionDate = raw.transactionDate || raw.date || raw.transaction_date || ''
    const description = raw.description || raw.memo || ''
    const amountValue = Number.parseFloat(raw.amount)
    const amount = Number.isNaN(amountValue) ? 0 : amountValue
    const transactionType = (raw.transactionType || raw.transaction_type || raw.type || 'debit').toLowerCase()
    const category = raw.category || ''
    const referenceNumber = raw.referenceNumber || raw.reference_number || ''
    const postedDate = raw.postedDate || raw.posted_date || ''
    const vendorName = raw.vendorName || raw.vendor_name || ''

    return {
      _rowId: baseId + index,
      transactionDate,
      description,
      amount,
      transactionType,
      category,
      referenceNumber,
      postedDate,
      vendorName,
      _valid: Boolean(transactionDate && description && amount !== 0),
      _source: 'csv',
    }
  })
}

// ==================== Main Page ====================

/**
 * Transactions page component.
 *
 * Renders the transaction list, search and filter controls, CSV/Excel upload zone,
 * import preview, and bulk transaction management actions for the active company.
 *
 * @returns {JSX.Element} Transaction management UI.
 */
function TransactionsPage() {
  const { token } = useAuth()
  const [searchParams] = useSearchParams()
  const deepLinkedJobId = Number(searchParams.get('jobId')) || null
  const { activeCompanyId } = useCompany()
  const queryClient = useQueryClient()

  // --- Transaction list ---
  const [transactions, setTransactions] = useState([])
  const [listError, setListError] = useState('')

  // --- File upload ---
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [parsedRows, setParsedRows] = useState([])
  const [parseError, setParseError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const fileInputRef = useRef(null)

  // --- Import state ---
  const [importing, setImporting] = useState(false)
  const [clearingDecision, setClearingDecision] = useState(false)

  // --- Filters ---
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // --- Snackbar ---
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' })
  const [deepLinkedJob, setDeepLinkedJob] = useState(null)

  useEffect(() => {
    if (!deepLinkedJobId || !token) return
    let cancelled = false
    getUploadJobStatus(deepLinkedJobId, token)
      .then((job) => {
        if (!cancelled) setDeepLinkedJob({ job })
      })
      .catch((error) => {
        if (!cancelled) setDeepLinkedJob({ error: error.message || 'This import is no longer available.' })
      })
    return () => { cancelled = true }
  }, [deepLinkedJobId, token])
  const [detailsModal, setDetailsModal] = useState({
    open: false,
    loading: false,
    error: '',
    transaction: null,
  })
  const [selectedTransactionIds, setSelectedTransactionIds] = useState([])
  const [deletingTransactionIds, setDeletingTransactionIds] = useState([])
  const [bulkDeletingTransactions, setBulkDeletingTransactions] = useState(false)

  const { confirm } = useConfirm()

  // ===================== Data Fetching =====================

  const transactionsQuery = useTransactionsByCompanyQuery({
    companyId: activeCompanyId,
    token,
    filters: undefined,
  })

  const listLoading = transactionsQuery.isLoading || transactionsQuery.isFetching

  const createBulkMutation = useCreateTransactionsBulkMutation({
    companyId: activeCompanyId,
    filters: undefined,
    token,
  })

  // ===================== Background-job polling (Excel imports) =====================

  const pollingTimers = useRef({})
  const POLL_INTERVAL_MS = 4000
  const txSessionKey = activeCompanyId ? `transaction_upload_jobs_${activeCompanyId}` : null

  const saveTxJobToSession = useCallback(
    (jobId, fileName) => {
      if (!txSessionKey) return
      try {
        const stored = JSON.parse(sessionStorage.getItem(txSessionKey) || '[]')
        if (!stored.find((j) => j.jobId === jobId))
          stored.push({ jobId, fileName })
        sessionStorage.setItem(txSessionKey, JSON.stringify(stored))
      } catch { /* ignore */ }
    },
    [txSessionKey],
  )

  const removeTxJobFromSession = useCallback(
    (jobId) => {
      if (!txSessionKey) return
      try {
        const stored = JSON.parse(sessionStorage.getItem(txSessionKey) || '[]')
        sessionStorage.setItem(txSessionKey, JSON.stringify(stored.filter((j) => j.jobId !== jobId)))
      } catch { /* ignore */ }
    },
    [txSessionKey],
  )

  // [importingJobs] tracks each in-flight Excel import job so the UI can show progress
  const [importingJobs, setImportingJobs] = useState([])  // [{jobId, fileName, progress, status}]

  const upsertImportingJob = useCallback((jobId, patch) => {
    setImportingJobs((prev) => {
      const idx = prev.findIndex((j) => j.jobId === jobId)
      if (idx === -1) return [...prev, { jobId, progress: 0, status: 'queued', fileName: '', ...patch }]
      const next = [...prev]
      next[idx] = { ...next[idx], ...patch }
      return next
    })
  }, [])

  const stopTxPolling = useCallback((jobId) => {
    if (pollingTimers.current[jobId]) {
      clearTimeout(pollingTimers.current[jobId])
      delete pollingTimers.current[jobId]
    }
  }, [])

  const startTxPolling = useCallback(
    (jobId, fileName) => {
      const poll = async () => {
        try {
          const job = await getUploadJobStatus(jobId, token)

          if (job.status === 'completed') {
            stopTxPolling(jobId)
            removeTxJobFromSession(jobId)
            const result = (() => { try { return JSON.parse(job.resultJson || 'null') } catch { return null } })()
            upsertImportingJob(jobId, { status: 'completed', progress: 100 })
            setImportingJobs((prev) => prev.filter((j) => j.jobId !== jobId))

            if (result?.isDuplicate) {
              setSnack({
                open: true,
                message: 'Duplicate Excel file detected. This file has already been imported and was skipped — check the Anomalies page for details.',
                severity: 'warning',
              })
              return
            }

            const count = result?.count ?? 0
            setSnack({ open: true, message: `Successfully imported ${count} transaction(s) from ${fileName}.`, severity: 'success' })
            queryClient.invalidateQueries({ queryKey: transactionKeys.byCompany(activeCompanyId) })
            return
          }

          if (job.status === 'failed' || job.status === 'canceled') {
            stopTxPolling(jobId)
            removeTxJobFromSession(jobId)
            upsertImportingJob(jobId, { status: 'failed', progress: 0 })
            setSnack({ open: true, message: job.errorMessage || `Import failed for ${fileName}.`, severity: 'error' })
            setImportingJobs((prev) => prev.filter((j) => j.jobId !== jobId))
            return
          }

          upsertImportingJob(jobId, { progress: Math.min(90, job.progressPercent || 30), status: job.status })
          pollingTimers.current[jobId] = setTimeout(poll, POLL_INTERVAL_MS)
        } catch {
          pollingTimers.current[jobId] = setTimeout(poll, POLL_INTERVAL_MS * 2)
        }
      }
      pollingTimers.current[jobId] = setTimeout(poll, POLL_INTERVAL_MS)
    },
    [token, stopTxPolling, removeTxJobFromSession, upsertImportingJob, queryClient, activeCompanyId],
  )

  // Restore in-flight jobs from sessionStorage on mount / company change.
  // Check job status immediately to avoid showing "processing" for already-completed jobs.
  useEffect(() => {
    if (!txSessionKey || !token) return
    let stored = []
    try { stored = JSON.parse(sessionStorage.getItem(txSessionKey) || '[]') } catch { return }
    if (stored.length === 0) return
    stored.forEach(({ jobId, fileName }) => {
      getUploadJobStatus(jobId, token).then((job) => {
        const jStatus = (job?.status ?? '').toLowerCase()
        if (jStatus === 'completed' || jStatus === 'failed' || jStatus === 'canceled') {
          removeTxJobFromSession(jobId)
          if (jStatus === 'completed') {
            const result = (() => { try { return JSON.parse(job.resultJson || 'null') } catch { return null } })()
            if (!result?.isDuplicate) {
              transactionsQuery.refetch()
            }
          }
        } else {
          upsertImportingJob(jobId, { status: jStatus || 'processing', progress: Math.min(90, job?.progressPercent ?? job?.ProgressPercent ?? 50), fileName })
          startTxPolling(jobId, fileName)
        }
      }).catch(() => {
        upsertImportingJob(jobId, { status: 'processing', progress: 50, fileName })
        startTxPolling(jobId, fileName)
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txSessionKey, token])

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(pollingTimers.current).forEach(clearTimeout)
      pollingTimers.current = {}
    }
  }, [])

  // Listen for real-time upload job updates via SignalR for instant completion detection
  useEffect(() => {
    if (!subscribeRealtime) return
    const unsub = subscribeRealtime('uploadJobUpdated', (job) => {
      const jobId = job?.id ?? job?.Id
      if (!jobId) return
      const status = (job?.status ?? '').toLowerCase()
      if (status === 'completed' || status === 'failed' || status === 'canceled') {
        stopTxPolling(jobId)
        removeTxJobFromSession(jobId)
        upsertImportingJob(jobId, { status, progress: status === 'completed' ? 100 : 0 })
        setImportingJobs((prev) => prev.filter((j) => j.jobId !== jobId))
      } else {
        upsertImportingJob(jobId, { status, progress: Math.min(90, job?.progressPercent ?? job?.ProgressPercent ?? 30) })
      }
    })
    return unsub
  }, [subscribeRealtime, stopTxPolling, removeTxJobFromSession, upsertImportingJob])

  useEffect(() => {
    if (transactionsQuery.error) {
      setListError(transactionsQuery.error.message || 'Failed to load transactions.')
      return
    }

    setListError('')
    const data = Array.isArray(transactionsQuery.data) ? transactionsQuery.data : []
    setTransactions(data)
    setSelectedTransactionIds([])
  }, [transactionsQuery.data, transactionsQuery.error])

  const transactionTypeOptions = useMemo(() => getTransactionTypes(transactions), [transactions])

  useEffect(() => {
    if (!transactionTypeOptions.includes(typeFilter)) {
      setTypeFilter('all')
    }
  }, [transactionTypeOptions, typeFilter])

  useEffect(() => {
    setPage(0)
  }, [typeFilter, searchTerm, sortKey, sortDirection, rowsPerPage])

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
    } else if (typeof a === 'boolean' && typeof b === 'boolean') {
      result = Number(a) - Number(b)
    } else {
      result = String(a).localeCompare(String(b), undefined, {
        sensitivity: 'base',
        numeric: true,
      })
    }

    return direction === 'desc' ? -result : result
  }, [])

  const getSortValue = useCallback((transaction, columnKey) => {
    switch (columnKey) {
      case 'date': {
        const rawDate = transaction.transaction_date || transaction.transactionDate
        if (!rawDate) return null

        const timestamp = new Date(rawDate).getTime()
        return Number.isNaN(timestamp) ? null : timestamp
      }
      case 'vendor': {
        const vendor = transaction.vendor_name || transaction.vendorName || ''
        return vendor.trim() || null
      }
      case 'description': {
        const description = transaction.description || ''
        return description.trim() || null
      }
      case 'amount': {
        const numericAmount = Number(transaction.chargeAmount ?? transaction.charge_amount ?? transaction.amount)
        return Number.isFinite(numericAmount) ? numericAmount : null
      }
      case 'type':
        return normalizeTransactionType(transaction)
      case 'category': {
        const category = transaction.category || ''
        return category.trim() || null
      }
      case 'matched':
        return Boolean(transaction.is_matched ?? transaction.isMatched ?? false)
      default:
        return null
    }
  }, [])

  // Client-side filtering for type + search
  const filteredTransactions = useMemo(() => {
    const byType = filterTransactionsByType(transactions, typeFilter)

    let filtered = byType
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = byType.filter((tx) => {
        const vendor = (tx.vendor_name || tx.vendorName || '').toLowerCase()
        const description = (tx.description || '').toLowerCase()
        const amount = String(tx.chargeAmount ?? tx.charge_amount ?? tx.amount ?? 0)
        const date = tx.transaction_date || tx.transactionDate
        const formattedDate = date ? new Date(date).toLocaleDateString() : ''

        return vendor.includes(term) || description.includes(term) || amount.includes(term) || formattedDate.toLowerCase().includes(term)
      })
    }

    return [...filtered].sort((a, b) => {
      const valueA = getSortValue(a, sortKey)
      const valueB = getSortValue(b, sortKey)
      return compareNullableValues(valueA, valueB, sortDirection)
    })
  }, [transactions, typeFilter, searchTerm, sortKey, sortDirection, getSortValue, compareNullableValues])

  const paginatedTransactions = useMemo(() => {
    const startIndex = page * rowsPerPage
    return filteredTransactions.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredTransactions, page, rowsPerPage])

  useEffect(() => {
    const maxPage = Math.max(Math.ceil(filteredTransactions.length / rowsPerPage) - 1, 0)
    if (page > maxPage) {
      setPage(maxPage)
    }
  }, [filteredTransactions.length, page, rowsPerPage])

  // ===================== File Handlers =====================

  const validateFile = useCallback((file) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'csv' && !EXCEL_EXTENSIONS.has(ext))
      return 'Only CSV and Excel (.xlsx, .xls) files are accepted.'
    if (file.size > MAX_FILE_SIZE) return 'File exceeds 10 MB limit.'
    return null
  }, [])

  const handleCSVFiles = useCallback(
    async (files) => {
      if (!activeCompanyId) {
        setParseError('Select an assigned company before uploading transactions.')
        return
      }

      setParseError('')
      setPreviewing(true)
      setParsedRows([])
      setUploadedFiles([])

      const newUploadedFiles = []
      const accumulatedRows = []
      const errors = []
      let nextRowId = 0

      for (const file of files) {
        const error = validateFile(file)
        if (error) {
          errors.push(`${file.name}: ${error}`)
          continue
        }

        const ext = file.name.split('.').pop()?.toLowerCase()
        const isExcel = EXCEL_EXTENSIONS.has(ext)
        const fileMeta = {
          name: file.name,
          size: file.size,
          isExcel,
          filePath: null,
        }

        if (isExcel) {
          try {
            const data = await previewExcel(file, activeCompanyId, token)
            const txns = data?.extractionResult?.transactions || []
            const filePath = data?.filePath || data?.FilePath || null
            if (txns.length === 0) {
              errors.push(`${file.name}: No transactions could be extracted from the Excel file.`)
              continue
            }

            fileMeta.filePath = filePath
            const rows = txns.map((t) => ({
              _rowId: nextRowId++,
              transactionDate: t.transactionDate || '',
              description: t.description || '',
              amount: typeof t.amount === 'number' ? t.amount : Number.parseFloat(t.amount) || 0,
              transactionType: (t.transactionType || 'debit').toLowerCase(),
              category: t.category || '',
              referenceNumber: t.referenceNumber || '',
              postedDate: t.postedDate || '',
              vendorName: t.vendorName || '',
              _valid: !!(t.transactionDate && t.description && t.amount && t.amount !== 0),
              _source: 'excel',
            }))
            accumulatedRows.push(...rows)
          } catch (err) {
            errors.push(`${file.name}: ${err.message || 'Failed to process Excel file.'}`)
            continue
          }
        } else {
          try {
            const text = await file.text()
            const rows = parseCSVData(text, nextRowId)
            nextRowId += rows.length
            if (rows.length === 0) {
              errors.push(`${file.name}: CSV file contains no data rows.`)
              continue
            }
            accumulatedRows.push(...rows)
          } catch (err) {
            errors.push(`${file.name}: ${err.message || 'Failed to read file.'}`)
            continue
          }
        }

        newUploadedFiles.push(fileMeta)
      }

      setUploadedFiles(newUploadedFiles)
      setParsedRows(accumulatedRows)
      if (errors.length > 0) setParseError(errors.join(' '))
      setPreviewing(false)
    },
    [activeCompanyId, token, validateFile],
  )

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
      const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : []
      if (files.length > 0) handleCSVFiles(files)
    },
    [handleCSVFiles],
  )

  const handleFileInput = useCallback(
    (e) => {
      const files = e.target.files ? Array.from(e.target.files) : []
      if (files.length > 0) handleCSVFiles(files)
      e.target.value = ''
    },
    [handleCSVFiles],
  )

  const removeRow = useCallback((rowId) => {
    setParsedRows((prev) => prev.filter((r) => r._rowId !== rowId))
  }, [])

  const clearUpload = useCallback(() => {
    setUploadedFiles([])
    setParsedRows([])
    setParseError('')
  }, [])

  const handleClearUpload = useCallback(async () => {
    const excelFiles = uploadedFiles.filter((file) => file.isExcel)
    if (excelFiles.length === 0) {
      clearUpload()
      return
    }

    const missingPathFile = excelFiles.find((file) => !file.filePath)
    if (missingPathFile) {
      setSnack({
        open: true,
        message: `Missing saved file path for ${missingPathFile.name}. Please upload again.`,
        severity: 'warning',
      })
      return
    }

    setClearingDecision(true)
    try {
      await Promise.all(
        excelFiles.map((file) =>
          importExcelTransactions(
            {
              status: 'Deny',
              savedFilePath: file.filePath,
              companyId: activeCompanyId,
              fileOriginalName: file.name,
            },
            token,
          ),
        ),
      )

      clearUpload()
      setSnack({
        open: true,
        message: 'Uploaded files denied and cleared.',
        severity: 'success',
      })
    } catch (err) {
      setSnack({
        open: true,
        message: err.message || 'Failed to deny uploaded files on server.',
        severity: 'error',
      })
    } finally {
      setClearingDecision(false)
    }
  }, [uploadedFiles, clearUpload, token, activeCompanyId])

  // ===================== Import =====================

  const handleImport = useCallback(async () => {
    if (!activeCompanyId) {
      setSnack({ open: true, message: 'Select an assigned company before importing.', severity: 'warning' })
      return
    }

    if (uploadedFiles.length === 0) {
      setSnack({ open: true, message: 'Upload at least one file before importing.', severity: 'warning' })
      return
    }

    const csvRows = parsedRows.filter((r) => r._valid && r._source === 'csv')
    const excelFiles = uploadedFiles.filter((file) => file.isExcel)
    if (csvRows.length === 0 && excelFiles.length === 0) {
      setSnack({ open: true, message: 'No valid rows to import.', severity: 'warning' })
      return
    }

    setImporting(true)
    try {
      let totalImported = 0

      if (excelFiles.length > 0) {
        for (const file of excelFiles) {
          const savedFilePath = file.filePath
          if (!savedFilePath) {
            setSnack({
              open: true,
              message: `Missing saved file path for ${file.name}. Please re-upload the Excel file.`,
              severity: 'warning',
            })
            return
          }

          const response = await importExcelTransactions(
            {
              companyId: activeCompanyId,
              savedFilePath,
              fileOriginalName: file.name,
            },
            token,
          )

          // Async 202 path — response contains jobId; poll until complete
          const jobId = response?.jobId ?? response?.JobId
          if (jobId) {
            saveTxJobToSession(jobId, file.name)
            upsertImportingJob(jobId, { jobId, fileName: file.name, status: 'queued', progress: 10 })
            startTxPolling(jobId, file.name)
            // Don't add to totalImported here — will be shown via snackbar when job finishes
            continue
          }

          // Legacy sync fallback
          totalImported += response?.count ?? 0
        }
      }

      if (csvRows.length > 0) {
        const payload = {
          companyId: activeCompanyId,
          transactions: csvRows.map((r) => ({
            companyId: activeCompanyId,
            transactionDate: r.transactionDate,
            description: r.description,
            amount: r.amount,
            transactionType: r.transactionType,
            postedDate: r.postedDate || null,
            category: r.category || null,
            referenceNumber: r.referenceNumber || null,
            vendorName: r.vendorName || null,
          })),
        }

        await createBulkMutation.mutateAsync(payload)
        totalImported += csvRows.length
      }

      if (totalImported > 0) {
        setSnack({
          open: true,
          message: `Successfully imported ${totalImported} transaction(s).`,
          severity: 'success',
        })
        await queryClient.invalidateQueries({ queryKey: transactionKeys.byCompany(activeCompanyId) })
      } else if (excelFiles.length > 0) {
        setSnack({
          open: true,
          message: `${excelFiles.length} Excel file(s) queued for import — you can leave this page, we'll keep processing.`,
          severity: 'info',
        })
      }
      clearUpload()
    } catch (err) {
      setSnack({
        open: true,
        message: err.message || 'Failed to import transactions.',
        severity: 'error',
      })
    } finally {
      setImporting(false)
    }
  }, [parsedRows, uploadedFiles, token, clearUpload, activeCompanyId, queryClient, saveTxJobToSession, upsertImportingJob, startTxPolling])

  const openTransactionDetails = useCallback(
    async (tx) => {
      const transactionId = tx?.id ?? tx?.transactionId
      if (!transactionId) return

      setDetailsModal({ open: true, loading: true, error: '', transaction: null })

      try {
        const transaction = await getTransactionById(transactionId, token)
        setDetailsModal({ open: true, loading: false, error: '', transaction })
      } catch (err) {
        setDetailsModal({
          open: true,
          loading: false,
          error: err.message || 'Failed to load transaction details.',
          transaction: tx || null,
        })
      }
    },
    [token],
  )

  const closeTransactionDetails = useCallback(() => {
    setDetailsModal({ open: false, loading: false, error: '', transaction: null })
  }, [])

  const visibleTransactionIds = filteredTransactions
    .map((tx) => tx.id ?? tx.transactionId)
    .filter((id) => typeof id === 'number' && id > 0)

  const allTransactionsSelected =
    visibleTransactionIds.length > 0 &&
    visibleTransactionIds.every((id) => selectedTransactionIds.includes(id))

  const hasTransactionSelection = selectedTransactionIds.length > 0

  const toggleSelectAllTransactions = useCallback(() => {
    setSelectedTransactionIds((prev) => {
      if (visibleTransactionIds.length === 0) return []
      const allSelected = visibleTransactionIds.every((id) => prev.includes(id))
      return allSelected
        ? prev.filter((id) => !visibleTransactionIds.includes(id))
        : [...new Set([...prev, ...visibleTransactionIds])]
    })
  }, [visibleTransactionIds])

  const toggleTransactionSelection = useCallback((transactionId) => {
    setSelectedTransactionIds((prev) =>
      prev.includes(transactionId)
        ? prev.filter((id) => id !== transactionId)
        : [...prev, transactionId],
    )
  }, [])

  const handleDeleteTransaction = useCallback(
    async (transaction) => {
      const transactionId = transaction?.id ?? transaction?.transactionId
      if (!transactionId) return

      const confirmed = await confirm(
        `Delete transaction #${transactionId}? This action cannot be undone.`,
      )
      if (!confirmed) return

      setDeletingTransactionIds((prev) => [...prev, transactionId])
      try {
        await deleteTransaction(transactionId, token)
        setTransactions((prev) =>
          prev.filter((tx) => (tx.id ?? tx.transactionId) !== transactionId),
        )
        setSelectedTransactionIds((prev) => prev.filter((id) => id !== transactionId))
        setSnack({ open: true, message: 'Transaction deleted successfully.', severity: 'success' })
      } catch (err) {
        setSnack({
          open: true,
          message: err.message || 'Failed to delete transaction.',
          severity: 'error',
        })
      } finally {
        setDeletingTransactionIds((prev) => prev.filter((id) => id !== transactionId))
      }
    },
    [token],
  )

  const handleBulkDeleteTransactions = useCallback(async () => {
    if (selectedTransactionIds.length === 0) return

    const confirmed = await confirm(
      `Delete ${selectedTransactionIds.length} selected transaction(s)? This action cannot be undone.`,
    )
    if (!confirmed) return

    setBulkDeletingTransactions(true)
    try {
      const response = await bulkDeleteTransactions(selectedTransactionIds, token)
      const deletedIds = Array.isArray(response?.deletedIds)
        ? response.deletedIds
        : selectedTransactionIds
      const notFoundIds = Array.isArray(response?.notFoundIds) ? response.notFoundIds : []

      setTransactions((prev) =>
        prev.filter((tx) => !deletedIds.includes(tx.id ?? tx.transactionId)),
      )
      setSelectedTransactionIds((prev) => prev.filter((id) => !deletedIds.includes(id)))

      if (notFoundIds.length > 0) {
        setSnack({
          open: true,
          message: `Deleted ${deletedIds.length} transaction(s). ${notFoundIds.length} were not found.`,
          severity: 'warning',
        })
      } else {
        setSnack({
          open: true,
          message: `Deleted ${deletedIds.length} transaction(s).`,
          severity: 'success',
        })
      }
    } catch (err) {
      setSnack({
        open: true,
        message: err.message || 'Bulk delete failed.',
        severity: 'error',
      })
    } finally {
      setBulkDeletingTransactions(false)
    }
  }, [selectedTransactionIds, token])

  // ===================== Render =====================

  const validCount = parsedRows.filter((r) => r._valid).length
  const invalidCount = parsedRows.length - validCount

  let transactionTableContent
  if (listLoading) {
    transactionTableContent = (
      <Stack spacing={1}>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={`tx-loading-${index + 1}`} variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
        ))}
      </Stack>
    )
  } else if (filteredTransactions.length === 0) {
    transactionTableContent = (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <DescriptionRoundedIcon
          sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }}
        />
        <Typography color="text.secondary">
          {transactions.length === 0
            ? 'No transactions yet. Import a CSV above to get started.'
            : 'No transactions match your search criteria.'}
        </Typography>
      </Box>
    )
  } else {
    transactionTableContent = (
      <Stack spacing={1.2}>
        <TableContainer sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={allTransactionsSelected}
                    indeterminate={hasTransactionSelection && !allTransactionsSelected}
                    onChange={toggleSelectAllTransactions}
                  />
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
                <TableCell
                  sx={{ width: { xs: 140, md: 180 } }}
                  sortDirection={sortKey === 'vendor' ? sortDirection : false}
                >
                  <TableSortLabel
                    active={sortKey === 'vendor'}
                    direction={sortKey === 'vendor' ? sortDirection : 'asc'}
                    onClick={() => handleSort('vendor')}
                  >
                    Vendor
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sx={{ width: { xs: 180, md: 260 } }}
                  sortDirection={sortKey === 'description' ? sortDirection : false}
                >
                  <TableSortLabel
                    active={sortKey === 'description'}
                    direction={sortKey === 'description' ? sortDirection : 'asc'}
                    onClick={() => handleSort('description')}
                  >
                    Description
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sortDirection={sortKey === 'amount' ? sortDirection : false}>
                  <TableSortLabel
                    active={sortKey === 'amount'}
                    direction={sortKey === 'amount' ? sortDirection : 'asc'}
                    onClick={() => handleSort('amount')}
                  >
                    Charge Amount
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ width: 96 }} sortDirection={sortKey === 'type' ? sortDirection : false}>
                  <TableSortLabel
                    active={sortKey === 'type'}
                    direction={sortKey === 'type' ? sortDirection : 'asc'}
                    onClick={() => handleSort('type')}
                  >
                    Type
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sx={{ width: { xs: 140, md: 180 } }}
                  sortDirection={sortKey === 'category' ? sortDirection : false}
                >
                  <TableSortLabel
                    active={sortKey === 'category'}
                    direction={sortKey === 'category' ? sortDirection : 'asc'}
                    onClick={() => handleSort('category')}
                  >
                    Category
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sortDirection={sortKey === 'matched' ? sortDirection : false}>
                  <TableSortLabel
                    active={sortKey === 'matched'}
                    direction={sortKey === 'matched' ? sortDirection : 'asc'}
                    onClick={() => handleSort('matched')}
                  >
                    Matched
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTransactions.map((tx) => {
                const date = tx.transaction_date || tx.transactionDate
                const desc = tx.description || '—'
                const vendor = tx.vendor_name || tx.vendorName || '—'
                const amount = tx.chargeAmount ?? tx.charge_amount ?? tx.amount ?? 0
                const type = normalizeTransactionType(tx)
                const cat = tx.category || '—'
                const matched = tx.is_matched ?? tx.isMatched ?? false

                return (
                  <TableRow key={tx.id ?? tx.transactionId} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={selectedTransactionIds.includes(tx.id ?? tx.transactionId)}
                        onChange={() => toggleTransactionSelection(tx.id ?? tx.transactionId)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {date ? new Date(date).toLocaleDateString() : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                        {vendor}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                        {desc}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={type === 'credit' ? 'success.main' : 'error.main'}
                      >
                        {type === 'credit' ? '+' : '−'}
                        {Math.abs(amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={formatTransactionTypeLabel(type)}
                        size="small"
                        color={typeColors[type] || 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                        {cat}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={matched ? 'Matched' : 'Unmatched'}
                        size="small"
                        color={matched ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" justifyContent="center" spacing={0.5}>
                        <IconButton
                          size="small"
                          onClick={() => openTransactionDetails(tx)}
                        >
                          <VisibilityRoundedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteTransaction(tx)}
                          disabled={
                            deletingTransactionIds.includes(tx.id ?? tx.transactionId) ||
                            bulkDeletingTransactions
                          }
                        >
                          {deletingTransactionIds.includes(tx.id ?? tx.transactionId) ? (
                            <CircularProgress size={16} color="error" />
                          ) : (
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredTransactions.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value))
            setPage(0)
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Stack>
    )
  }

  return (
    <Box
      sx={{
        py: { xs: 4, md: 6 },
        overflowX: 'hidden',
        background:
          'radial-gradient(circle at 0% 5%, rgba(88,166,255,0.25), transparent 34%), radial-gradient(circle at 100% 0%, rgba(66,130,255,0.16), transparent 28%), linear-gradient(180deg, #070b14 0%, #091021 62%, #0b1324 100%)',
      }}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{ px: { xs: 2, sm: 3, md: 4, xl: 5 }, width: '100%', overflowX: 'hidden' }}
      >
        <Stack
          component={motion.div}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          spacing={3}
          sx={{ minWidth: 0 }}
        >
          {deepLinkedJob && (
            <Alert
              severity={deepLinkedJob.error || deepLinkedJob.job?.status === 'failed' ? 'warning' : 'info'}
              onClose={() => setDeepLinkedJob(null)}
            >
              {deepLinkedJob.error
                || (deepLinkedJob.job?.status === 'failed'
                  ? 'This transaction import failed. You can retry by uploading the file again.'
                  : `Import “${deepLinkedJob.job?.fileOriginalName || `#${deepLinkedJobId}`}” is ${deepLinkedJob.job?.status || 'unavailable'}.`)}
            </Alert>
          )}
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
                    Transactions
                  </Typography>
                  <Typography color="text.secondary">
                    Import bank &amp; credit card statements, review transactions, and prepare for
                    reconciliation.
                  </Typography>
                </Stack>
                <Button
                  variant="outlined"
                  startIcon={<RefreshRoundedIcon />}
                  onClick={() => transactionsQuery.refetch()}
                  disabled={listLoading}
                >
                  Refresh
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* ---- CSV / Excel Upload ---- */}
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
              {!activeCompanyId && (
                <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
                  Select a company from your assigned companies before uploading or importing transactions.
                </Alert>
              )}

              {/* CSV drop zone */}
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: dragActive ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  bgcolor: dragActive ? 'rgba(88,166,255,0.06)' : 'transparent',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  py: { xs: 4, md: 5 },
                  textAlign: 'center',
                }}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <CloudUploadRoundedIcon
                  sx={{
                    fontSize: 44,
                    color: dragActive ? 'primary.main' : 'text.secondary',
                    mb: 1,
                  }}
                />
                <Typography variant="h6" sx={{ mb: 0.5 }}>
                  Drop one or more CSV or Excel files here or click to browse
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  CSV (.csv) and Excel (.xlsx, .xls) files — up to 10 MB each
                </Typography>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  multiple
                  hidden
                  onChange={handleFileInput}
                />
                {previewing && (
                  <Box sx={{ mt: 2 }}>
                    <CircularProgress size={28} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Processing Excel file…
                    </Typography>
                  </Box>
                )}
              </Box>

              {parseError && (
                <Alert severity="error" variant="outlined" sx={{ mt: 2 }} onClose={() => setParseError('')}>
                  {parseError}
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* ---- Parsed Preview ---- */}
          {parsedRows.length > 0 && (
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
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ sm: 'center' }}
                  spacing={1}
                  sx={{ mb: 2 }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <FileUploadRoundedIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Import Preview
                    </Typography>
                    <Chip
                      label={
                        uploadedFiles.length === 1
                          ? uploadedFiles[0].name
                          : `${uploadedFiles.length} files uploaded`
                      }
                      size="small"
                      variant="outlined"
                    />
                    <Chip label={`${validCount} valid`} size="small" color="success" variant="outlined" />
                    {invalidCount > 0 && (
                      <Chip
                        label={`${invalidCount} invalid`}
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      onClick={handleClearUpload}
                      disabled={importing || clearingDecision}
                    >
                      {clearingDecision ? 'Clearing...' : 'Clear'}
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleImport}
                      disabled={importing || clearingDecision || validCount === 0}
                      startIcon={
                        importing ? <CircularProgress size={16} /> : <CheckCircleRoundedIcon />
                      }
                    >
                      {importing ? 'Importing…' : `Import ${validCount} Transaction(s)`}
                    </Button>
                  </Stack>
                </Stack>

                {importing && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

                <TableContainer sx={{ width: '100%', maxWidth: '100%', maxHeight: 400, overflowX: 'auto' }}>
                  <Table size="small" stickyHeader sx={{ minWidth: 980 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                        <TableCell padding="checkbox" />
                        <TableCell>Date</TableCell>
                        <TableCell sx={{ width: { xs: 140, md: 180 } }}>Vendor</TableCell>
                        <TableCell sx={{ width: { xs: 180, md: 260 } }}>Description</TableCell>
                        <TableCell align="center">Amount</TableCell>
                        <TableCell align="center" sx={{ width: 96 }}>Type</TableCell>
                        <TableCell sx={{ width: { xs: 140, md: 180 } }}>Category</TableCell>
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {parsedRows.map((row) => (
                        <TableRow
                          key={row._rowId}
                          hover
                          sx={{ opacity: row._valid ? 1 : 0.5 }}
                        >
                          <TableCell padding="checkbox">
                            <IconButton
                              size="small"
                              onClick={() => removeRow(row._rowId)}
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{row.transactionDate || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                              {row.vendorName || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                              {row.description || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={
                                row.transactionType === 'credit'
                                  ? 'success.main'
                                  : 'error.main'
                              }
                            >
                              {row.transactionType === 'credit' ? '+' : '−'}
                              {Math.abs(row.amount).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={row.transactionType}
                              size="small"
                              color={typeColors[row.transactionType] || 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                              {row.category || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {row._valid ? (
                              <CheckCircleRoundedIcon
                                fontSize="small"
                                sx={{ color: 'success.main' }}
                              />
                            ) : (
                              <ErrorRoundedIcon
                                fontSize="small"
                                sx={{ color: 'error.main' }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* ---- Error Alert ---- */}
          {listError && (
            <Alert severity="error" variant="outlined" onClose={() => setListError('')}>
              {listError}
            </Alert>
          )}

          {/* ---- Background import progress banners ---- */}
          {importingJobs.length > 0 && (
            <Stack spacing={1}>
              {importingJobs.map((job) => (
                <Alert
                  key={job.jobId}
                  severity="info"
                  variant="outlined"
                  icon={<CircularProgress size={16} />}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="body2">
                      Importing <strong>{job.fileName}</strong> in the background…
                    </Typography>
                    <LinearProgress
                      variant={job.progress > 0 ? 'determinate' : 'indeterminate'}
                      value={job.progress}
                      sx={{ borderRadius: 1 }}
                    />
                  </Stack>
                </Alert>
              ))}
            </Stack>
          )}

          {/* ---- Filter Bar ---- */}
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
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ sm: 'center' }}
                spacing={2}
                sx={{ minWidth: 0 }}
              >
                <Typography variant="subtitle1" fontWeight={700}>
                  Transaction Records {listLoading ? '' : `(${transactions.length})`}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    size="small"
                    placeholder="Search vendor, description, amount, date..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchRoundedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ minWidth: 250 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={typeFilter}
                      label="Type"
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      {transactionTypeOptions.map((type) => (
                        <MenuItem key={type} value={type}>
                          {formatTransactionTypeLabel(type)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1 }}>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={bulkDeletingTransactions ? <CircularProgress size={14} /> : <DeleteOutlineRoundedIcon />}
                  onClick={handleBulkDeleteTransactions}
                  disabled={!hasTransactionSelection || bulkDeletingTransactions}
                >
                  {bulkDeletingTransactions
                    ? 'Deleting...'
                    : `Delete Selected (${selectedTransactionIds.length})`}
                </Button>
              </Stack>

              {/* Transaction table */}
              <Box sx={{ mt: 2 }}>
                {transactionTableContent}
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      <TransactionDetailsModal
        open={detailsModal.open}
        loading={detailsModal.loading}
        error={detailsModal.error}
        transaction={detailsModal.transaction}
        onClose={closeTransactionDetails}
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

export default TransactionsPage
