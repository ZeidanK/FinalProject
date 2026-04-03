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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  TextField,
  Typography,
} from '@mui/material'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { motion } from 'framer-motion'
import Papa from 'papaparse'
import { useAuth } from '../context/useAuth'
import {
  getTransactionById,
  getTransactionsByCompany,
  createTransactionsBulk,
  previewExcel,
} from '../services/transactions'
import {
  getBankAccountsByCompany,
  createBankAccount,
} from '../services/bankAccounts'
import TransactionDetailsModal from '../components/TransactionDetailsModal'

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

const typeColors = {
  debit: 'error',
  credit: 'success',
}

// ==================== CSV Helpers ====================

const EXPECTED_HEADERS = ['date', 'description', 'amount', 'type']
const OPTIONAL_HEADERS = ['category', 'reference', 'posteddate', 'vendorname']

function normalizeHeader(raw) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/transactiondate|txndate|txdate/, 'date')
    .replace(/posteddate|postdate/, 'posteddate')
    .replace(/referencenumber|refno|ref/, 'reference')
    .replace(/transactiontype|txntype|txtype/, 'type')
    .replace(/desc/, 'description')
    .replace(/amt/, 'amount')
    .replace(/cat/, 'category')
    .replace(/vendorname|vendor|suppliername|supplier/, 'vendorname')
}

function parseCSVData(text) {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  })

  if (result.errors.length > 0) {
    const fatal = result.errors.find((e) => e.type === 'Quotes' || e.type === 'Delimiter')
    if (fatal) throw new Error(`CSV parsing error: ${fatal.message}`)
  }

  const headers = result.meta.fields || []
  const missing = EXPECTED_HEADERS.filter((h) => !headers.includes(h))
  if (missing.length > 0) {
    throw new Error(
      `Missing required columns: ${missing.join(', ')}. Expected: Date, Description, Amount, Type`,
    )
  }

  const rows = result.data.map((row, idx) => {
    const amount = parseFloat(row.amount)
    const type = (row.type || '').toLowerCase().trim()
    return {
      _rowId: idx,
      transactionDate: row.date || '',
      description: row.description || '',
      amount: isNaN(amount) ? 0 : amount,
      transactionType: type === 'credit' ? 'credit' : 'debit',
      category: row.category || '',
      referenceNumber: row.reference || '',
      postedDate: row.posteddate || '',
      vendorName: row.vendorname || '',
      _valid: !!(row.date && row.description && !isNaN(amount) && amount !== 0),
    }
  })

  return rows
}

// ==================== Bank Account Dialog ====================

const ACCOUNT_TYPES = ['checking', 'savings', 'credit_card', 'other']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'ILS']
const EXCEL_EXTENSIONS = ['xlsx', 'xls']

const emptyAccount = {
  bankName: '',
  accountType: 'checking',
  accountName: '',
  accountNumberMasked: '',
  currency: 'USD',
}

function AddBankAccountDialog({ open, onClose, onSave, saving }) {
  const [form, setForm] = useState(emptyAccount)

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSave = () => {
    if (!form.bankName.trim() || !form.accountType) return
    onSave(form)
  }

  const handleClose = () => {
    setForm(emptyAccount)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Bank Account</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Bank Name"
            required
            fullWidth
            value={form.bankName}
            onChange={handleChange('bankName')}
          />
          <FormControl fullWidth>
            <InputLabel>Account Type</InputLabel>
            <Select
              value={form.accountType}
              label="Account Type"
              onChange={handleChange('accountType')}
            >
              {ACCOUNT_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Account Name (optional)"
            fullWidth
            value={form.accountName}
            onChange={handleChange('accountName')}
          />
          <TextField
            label="Account Number (masked)"
            fullWidth
            placeholder="e.g. ****1234"
            value={form.accountNumberMasked}
            onChange={handleChange('accountNumberMasked')}
          />
          <FormControl fullWidth>
            <InputLabel>Currency</InputLabel>
            <Select
              value={form.currency}
              label="Currency"
              onChange={handleChange('currency')}
            >
              {CURRENCIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !form.bankName.trim()}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? 'Saving…' : 'Add Account'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ==================== Main Page ====================

function TransactionsPage() {
  const { user, token } = useAuth()
  const companyId = user?.companyId || DEFAULT_COMPANY_ID

  // --- Transaction list ---
  const [transactions, setTransactions] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')

  // --- Bank accounts ---
  const [bankAccounts, setBankAccounts] = useState([])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [accountsLoading, setAccountsLoading] = useState(true)

  // --- Add bank account dialog ---
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [addingAccount, setAddingAccount] = useState(false)

  // --- File upload ---
  const [csvFile, setCsvFile] = useState(null)
  const [parsedRows, setParsedRows] = useState([])
  const [parseError, setParseError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const fileInputRef = useRef(null)

  // --- Import state ---
  const [importing, setImporting] = useState(false)

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

  // ===================== Data Fetching =====================

  const loadTransactions = useCallback(async () => {
    setListLoading(true)
    setListError('')
    try {
      const filters = {}
      if (typeFilter !== 'all') filters.type = typeFilter
      const data = await getTransactionsByCompany(companyId, filters, token)
      setTransactions(Array.isArray(data) ? data : [])
    } catch (err) {
      setListError(err.message || 'Failed to load transactions.')
    } finally {
      setListLoading(false)
    }
  }, [companyId, token, typeFilter])

  const loadBankAccounts = useCallback(async () => {
    setAccountsLoading(true)
    try {
      const data = await getBankAccountsByCompany(companyId, token)
      const accounts = Array.isArray(data) ? data : []
      setBankAccounts(accounts)
      if (accounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accounts[0].id ?? accounts[0].bankAccountId ?? '')
      }
    } catch {
      // Bank accounts may not be available yet — silently handle
      setBankAccounts([])
    } finally {
      setAccountsLoading(false)
    }
  }, [companyId, token, selectedAccountId])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  useEffect(() => {
    loadBankAccounts()
  }, [loadBankAccounts])

  // ===================== File Handlers =====================

  const validateFile = useCallback((file) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'csv' && !EXCEL_EXTENSIONS.includes(ext))
      return 'Only CSV and Excel (.xlsx, .xls) files are accepted.'
    if (file.size > MAX_FILE_SIZE) return 'File exceeds 10 MB limit.'
    return null
  }, [])

  const handleCSVFile = useCallback((file) => {
    const error = validateFile(file)
    if (error) {
      setParseError(error)
      return
    }

    setParseError('')
    setCsvFile({ name: file.name, size: file.size })

    const ext = file.name.split('.').pop()?.toLowerCase()

    if (EXCEL_EXTENSIONS.includes(ext)) {
      // XLSX/XLS: send to server for extraction
      setPreviewing(true)
      setParsedRows([])
      previewExcel(file, companyId, token)
        .then((data) => {
          const txns = data?.extractionResult?.transactions || []
          if (txns.length === 0) {
            setParseError('No transactions could be extracted from the Excel file.')
            setParsedRows([])
            return
          }
          const rows = txns.map((t, idx) => ({
            _rowId: idx,
            transactionDate: t.transactionDate || '',
            description: t.description || '',
            amount: typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0,
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
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const rows = parseCSVData(e.target.result)
        setParsedRows(rows)
        if (rows.length === 0) {
          setParseError('CSV file contains no data rows.')
        }
      } catch (err) {
        setParseError(err.message)
        setParsedRows([])
      }
    }
    reader.onerror = () => {
      setParseError('Failed to read file.')
    }
    reader.readAsText(file)
  }, [companyId, token, validateFile])

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

  // ===================== Import =====================

  const handleImport = useCallback(async () => {
    const validRows = parsedRows.filter((r) => r._valid)
    if (validRows.length === 0) {
      setSnack({ open: true, message: 'No valid rows to import.', severity: 'warning' })
      return
    }

    setImporting(true)
    try {
      const payload = {
        companyId,
        createdByUserId: user?.id || user?.userId,
        transactions: validRows.map((r) => ({
          companyId,
          bankAccountId: selectedAccountId || null,
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
      clearUpload()
      loadTransactions()
    } catch (err) {
      setSnack({
        open: true,
        message: err.message || 'Failed to import transactions.',
        severity: 'error',
      })
    } finally {
      setImporting(false)
    }
  }, [parsedRows, companyId, user, selectedAccountId, token, clearUpload, loadTransactions])

  // ===================== Add Bank Account =====================

  const handleAddAccount = useCallback(
    async (formData) => {
      setAddingAccount(true)
      try {
        await createBankAccount(
          {
            companyId,
            bankName: formData.bankName,
            accountType: formData.accountType,
            accountName: formData.accountName || null,
            accountNumberMasked: formData.accountNumberMasked || null,
            currency: formData.currency || 'USD',
            createdByUserId: user?.id || user?.userId,
          },
          token,
        )
        setSnack({ open: true, message: 'Bank account added!', severity: 'success' })
        setShowAddAccount(false)
        loadBankAccounts()
      } catch (err) {
        setSnack({
          open: true,
          message: err.message || 'Failed to add bank account.',
          severity: 'error',
        })
      } finally {
        setAddingAccount(false)
      }
    },
    [companyId, user, token, loadBankAccounts],
  )

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

  // ===================== Render =====================

  const validCount = parsedRows.filter((r) => r._valid).length
  const invalidCount = parsedRows.length - validCount

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
                  onClick={loadTransactions}
                  disabled={listLoading}
                >
                  Refresh
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* ---- Bank Account Selector + CSV Upload ---- */}
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
              {/* Bank account selector */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ sm: 'center' }}
                spacing={2}
                sx={{ mb: 3 }}
              >
                <AccountBalanceRoundedIcon sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle1" fontWeight={700} sx={{ minWidth: 'fit-content' }}>
                  Bank Account
                </Typography>
                {accountsLoading ? (
                  <Skeleton variant="rectangular" width={220} height={40} sx={{ borderRadius: 1 }} />
                ) : bankAccounts.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No bank accounts yet.
                  </Typography>
                ) : (
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <Select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      displayEmpty={true}
                    >
                      {bankAccounts.map((acc) => (
                        <MenuItem key={acc.id ?? acc.bankAccountId} value={acc.id ?? acc.bankAccountId}>
                          {acc.bankName || acc.bank_name}
                          {(acc.accountNumberMasked || acc.account_number_masked) &&
                            ` · ${acc.accountNumberMasked || acc.account_number_masked}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                <Button
                  size="small"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => setShowAddAccount(true)}
                >
                  Add Account
                </Button>
              </Stack>

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
                    <Button size="small" variant="outlined" color="inherit" onClick={clearUpload}>
                      Clear
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleImport}
                      disabled={importing || validCount === 0}
                      startIcon={
                        importing ? <CircularProgress size={16} /> : <CheckCircleRoundedIcon />
                      }
                    >
                      {importing ? 'Importing…' : `Import ${validCount} Transaction(s)`}
                    </Button>
                  </Stack>
                </Stack>

                {importing && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                        <TableCell padding="checkbox" />
                        <TableCell>Date</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Vendor</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="center">Type</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Reference</TableCell>
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
                            <Typography variant="body2" noWrap sx={{ maxWidth: 220 }}>
                              {row.description || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
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
                            <Typography variant="body2" color="text.secondary">
                              {row.category || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
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

              {/* Transaction table */}
              <Box sx={{ mt: 2 }}>
                {listLoading ? (
                  <Stack spacing={1}>
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
                    ))}
                  </Stack>
                ) : transactions.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <DescriptionRoundedIcon
                      sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }}
                    />
                    <Typography color="text.secondary">
                      No transactions yet. Import a CSV above to get started.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                          <TableCell>Date</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Vendor</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell align="center">Type</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Reference</TableCell>
                          <TableCell align="center">Matched</TableCell>
                          <TableCell align="center">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transactions.map((tx) => {
                          const date = tx.transaction_date || tx.transactionDate
                          const desc = tx.description || '—'
                          const vendor = tx.vendor_name || tx.vendorName || '—'
                          const amount = tx.amount ?? 0
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
                              <TableCell>
                                <Typography variant="body2">
                                  {date ? new Date(date).toLocaleDateString() : '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" noWrap sx={{ maxWidth: 240 }}>
                                  {desc}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
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
                                <Typography variant="body2" color="text.secondary">
                                  {cat}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
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
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<VisibilityRoundedIcon />}
                                  onClick={() => openTransactionDetails(tx)}
                                >
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      {/* ---- Add Bank Account Dialog ---- */}
      <AddBankAccountDialog
        open={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        onSave={handleAddAccount}
        saving={addingAccount}
      />

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
