import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  TableRow,
  Typography,
} from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded'
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { motion } from 'framer-motion'
import Papa from 'papaparse'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import TransactionDetailsModal from '../components/TransactionDetailsModal'
import {
  bulkDeleteTransactions,
  createTransactionsBulk,
  deleteTransaction,
  getTransactionById,
  importExcelTransactions,
  previewExcel,
} from '../services/transactions'
import { useTransactionsByCompanyQuery } from '../hooks/queries/useTransactionsQueries'

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

function parseCSVData(text) {
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
    const transactionType = (raw.transactionType || raw.transaction_type || 'debit').toLowerCase()
    const category = raw.category || ''
    const referenceNumber = raw.referenceNumber || raw.reference_number || ''
    const postedDate = raw.postedDate || raw.posted_date || ''
    const vendorName = raw.vendorName || raw.vendor_name || ''

    return {
      _rowId: index,
      transactionDate,
      description,
      amount,
      transactionType,
      category,
      referenceNumber,
      postedDate,
      vendorName,
      _valid: Boolean(transactionDate && description && amount !== 0),
    }
  })
}

// ==================== Main Page ====================

function TransactionsPage() {
  const { token } = useAuth()
  const { activeCompanyId } = useCompany()

  // --- Transaction list ---
  const [transactions, setTransactions] = useState([])
  const [listError, setListError] = useState('')

  // --- File upload ---
  const [csvFile, setCsvFile] = useState(null)
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

  // --- Snackbar ---
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' })
  const [detailsModal, setDetailsModal] = useState({
    open: false,
    loading: false,
    error: '',
    transaction: null,
  })
  const [selectedTransactionIds, setSelectedTransactionIds] = useState([])
  const [deletingTransactionIds, setDeletingTransactionIds] = useState([])
  const [bulkDeletingTransactions, setBulkDeletingTransactions] = useState(false)

  // ===================== Data Fetching =====================

  const transactionFilters = useMemo(() => {
    if (typeFilter === 'all') return {}
    return { type: typeFilter }
  }, [typeFilter])

  const transactionsQuery = useTransactionsByCompanyQuery({
    companyId: activeCompanyId,
    token,
    filters: transactionFilters,
  })

  const listLoading = transactionsQuery.isLoading || transactionsQuery.isFetching

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

  // ===================== File Handlers =====================

  const validateFile = useCallback((file) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'csv' && !EXCEL_EXTENSIONS.has(ext))
      return 'Only CSV and Excel (.xlsx, .xls) files are accepted.'
    if (file.size > MAX_FILE_SIZE) return 'File exceeds 10 MB limit.'
    return null
  }, [])

  const handleCSVFile = useCallback((file) => {
    if (!activeCompanyId) {
      setParseError('Select an assigned company before uploading transactions.')
      return
    }

    const error = validateFile(file)
    if (error) {
      setParseError(error)
      return
    }

    setParseError('')
    setCsvFile({ name: file.name, size: file.size, filePath: null, isExcel: EXCEL_EXTENSIONS.has(file.name.split('.').pop()?.toLowerCase()) })

    const ext = file.name.split('.').pop()?.toLowerCase()

    if (EXCEL_EXTENSIONS.has(ext)) {
      // XLSX/XLS: send to server for extraction
      setPreviewing(true)
      setParsedRows([])
      previewExcel(file, activeCompanyId, token)
        .then((data) => {
          const txns = data?.extractionResult?.transactions || []
          const filePath = data?.filePath || data?.FilePath || null
          if (txns.length === 0) {
            setParseError('No transactions could be extracted from the Excel file.')
            setParsedRows([])
            return
          }
          setCsvFile((prev) => ({
            ...(prev || { name: file.name, size: file.size }),
            name: file.name,
            size: file.size,
            filePath,
            isExcel: true,
          }))
          const rows = txns.map((t, idx) => ({
            _rowId: idx,
            transactionDate: t.transactionDate || '',
            description: t.description || '',
            amount: typeof t.amount === 'number' ? t.amount : Number.parseFloat(t.amount) || 0,
            transactionType: (t.transactionType || 'debit').toLowerCase(),
            category: t.category || '',
            referenceNumber: t.referenceNumber || '',
            postedDate: t.postedDate || '',
            vendorName: t.vendorName || '',
            _valid: !!(t.transactionDate && t.description && t.amount && t.amount !== 0),
          }))
          setParsedRows(rows)
        })
        .catch((err) => {
          setParseError(err.message || 'Failed to process Excel file.')
          setParsedRows([])
        })
        .finally(() => setPreviewing(false))
      return
    }

    // CSV: parse client-side with PapaParse
    file.text()
      .then((text) => {
        const rows = parseCSVData(text)
        setParsedRows(rows)
        if (rows.length === 0) {
          setParseError('CSV file contains no data rows.')
        }
      })
      .catch((err) => {
        setParseError(err.message || 'Failed to read file.')
        setParsedRows([])
      })
  }, [activeCompanyId, token, validateFile])

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
      if (e.dataTransfer.files?.[0]) handleCSVFile(e.dataTransfer.files[0])
    },
    [handleCSVFile],
  )

  const handleFileInput = useCallback(
    (e) => {
      if (e.target.files?.[0]) handleCSVFile(e.target.files[0])
      e.target.value = ''
    },
    [handleCSVFile],
  )

  const removeRow = useCallback((rowId) => {
    setParsedRows((prev) => prev.filter((r) => r._rowId !== rowId))
  }, [])

  const clearUpload = useCallback(() => {
    setCsvFile(null)
    setParsedRows([])
    setParseError('')
  }, [])

  const handleClearUpload = useCallback(async () => {
    if (!csvFile?.isExcel) {
      clearUpload()
      return
    }

    const filePath = csvFile?.filePath
    if (!filePath) {
      setSnack({
        open: true,
        message: 'Missing file path for deny request. Please upload again.',
        severity: 'warning',
      })
      return
    }

    setClearingDecision(true)
    try {
      await importExcelTransactions(
        {
          status: 'Deny',
          savedFilePath: filePath,
          companyId: activeCompanyId,
          fileOriginalName: csvFile?.name || null,
        },
        token,
      )

      clearUpload()
      setSnack({
        open: true,
        message: 'File denied and cleared.',
        severity: 'success',
      })
    } catch (err) {
      setSnack({
        open: true,
        message: err.message || 'Failed to deny file on server.',
        severity: 'error',
      })
    } finally {
      setClearingDecision(false)
    }
  }, [csvFile, clearUpload, token, activeCompanyId])

  // ===================== Import =====================

  const handleImport = useCallback(async () => {
    if (!activeCompanyId) {
      setSnack({ open: true, message: 'Select an assigned company before importing.', severity: 'warning' })
      return
    }

    const validRows = parsedRows.filter((r) => r._valid)
    if (validRows.length === 0) {
      setSnack({ open: true, message: 'No valid rows to import.', severity: 'warning' })
      return
    }

    const fileName = csvFile?.name
    if (!fileName) {
      setSnack({
        open: true,
        message: 'Missing file name. Please upload the file again.',
        severity: 'warning',
      })
      return
    }

    setImporting(true)
    try {
      if (csvFile?.isExcel) {
        const savedFilePath = csvFile?.filePath
        if (!savedFilePath) {
          setSnack({
            open: true,
            message: 'Missing saved file path. Please re-upload the Excel file.',
            severity: 'warning',
          })
          return
        }

        const response = await importExcelTransactions(
          {
            companyId: activeCompanyId,
            savedFilePath,
            fileOriginalName: fileName,
          },
          token,
        )

        const importedCount = response?.count ?? 0
        setSnack({
          open: true,
          message: `Successfully imported ${importedCount} transaction(s) from ${fileName}.`,
          severity: 'success',
        })
      } else {
        const payload = {
          companyId: activeCompanyId,
          transactions: validRows.map((r) => ({
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

        await createTransactionsBulk(payload, token)
        setSnack({
          open: true,
          message: `Successfully imported ${validRows.length} transaction(s)!`,
          severity: 'success',
        })
      }

      clearUpload()
      await transactionsQuery.refetch()
    } catch (err) {
      setSnack({
        open: true,
        message: err.message || 'Failed to import transactions.',
        severity: 'error',
      })
    } finally {
      setImporting(false)
    }
  }, [parsedRows, csvFile, token, clearUpload, activeCompanyId, transactionsQuery])

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

  const visibleTransactionIds = transactions
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

      const confirmed = globalThis.confirm(
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

    const confirmed = globalThis.confirm(
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
  } else if (transactions.length === 0) {
    transactionTableContent = (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <DescriptionRoundedIcon
          sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }}
        />
        <Typography color="text.secondary">
          No transactions yet. Import a CSV above to get started.
        </Typography>
      </Box>
    )
  } else {
    transactionTableContent = (
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
              <TableCell>Date</TableCell>
              <TableCell sx={{ width: { xs: 180, md: 260 } }}>Description</TableCell>
              <TableCell sx={{ width: { xs: 140, md: 180 } }}>Vendor</TableCell>
              <TableCell align="right">Charge Amount</TableCell>
              <TableCell align="center" sx={{ width: 96 }}>Type</TableCell>
              <TableCell sx={{ width: { xs: 140, md: 180 } }}>Category</TableCell>
              <TableCell sx={{ width: { xs: 140, md: 180 } }}>Reference</TableCell>
              <TableCell align="center">Matched</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((tx) => {
              const date = tx.transaction_date || tx.transactionDate
              const desc = tx.description || '—'
              const vendor = tx.vendor_name || tx.vendorName || '—'
              const amount = tx.chargeAmount ?? tx.charge_amount ?? tx.amount ?? 0
              const type = (
                tx.transaction_type ||
                tx.transactionType ||
                'debit'
              ).toLowerCase()
              const cat = tx.category || '—'
              const ref = tx.reference_number || tx.referenceNumber || '—'
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
                      {desc}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                      {vendor}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
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
                      label={type}
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
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                      {ref}
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
                  Drop a CSV or Excel file here or click to browse
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  CSV (.csv) and Excel (.xlsx, .xls) files — up to 10 MB
                </Typography>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
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
                    <Chip label={csvFile?.name} size="small" variant="outlined" />
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
                        <TableCell sx={{ width: { xs: 180, md: 260 } }}>Description</TableCell>
                        <TableCell sx={{ width: { xs: 140, md: 180 } }}>Vendor</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="center" sx={{ width: 96 }}>Type</TableCell>
                        <TableCell sx={{ width: { xs: 140, md: 180 } }}>Category</TableCell>
                        <TableCell sx={{ width: { xs: 140, md: 180 } }}>Reference</TableCell>
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
                              {row.description || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                              {row.vendorName || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
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
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                              {row.referenceNumber || '—'}
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
                  Transaction Records
                </Typography>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={typeFilter}
                    label="Type"
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="debit">Debit</MenuItem>
                    <MenuItem value="credit">Credit</MenuItem>
                  </Select>
                </FormControl>
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
