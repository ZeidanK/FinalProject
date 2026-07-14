import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useTheme } from '@mui/material/styles'
import AnimatedBackground from '../components/AnimatedBackground'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import { getPayablesAgingReport, getReconciliationReport } from '../services/reports'

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut', staggerChildren: 0.07 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
}

const EMPTY_REPORT_ROWS = []

const REPORT_TAB_KEYS = {
  reconciliation: 'reconciliation',
  aging: 'aging',
}

const reportTabs = [
  { value: REPORT_TAB_KEYS.reconciliation, label: 'Reconciliation Report', icon: <CompareArrowsRoundedIcon fontSize="small" /> },
  { value: REPORT_TAB_KEYS.aging, label: 'Payables Aging', icon: <ScheduleRoundedIcon fontSize="small" /> },
]

const reportCardSx = {
  borderRadius: 3,
  border: '1px solid rgba(129, 191, 255, 0.12)',
  background: 'rgba(14, 24, 45, 0.65)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
}

const statusPresentation = {
  fully_matched: { label: 'Fully matched', color: 'success' },
  partially_matched: { label: 'Partially matched', color: 'info' },
  ledger_only: { label: 'Ledger only', color: 'warning' },
  bank_only: { label: 'Bank only', color: 'error' },
}

const reconciliationStatusOrder = {
  fully_matched: 0,
  partially_matched: 1,
  ledger_only: 2,
  bank_only: 3,
}

const reconciliationColumns = [
  { key: 'status', label: 'Status' },
  { key: 'ledgerEntry', label: 'Ledger entry' },
  { key: 'ledgerDate', label: 'Ledger date' },
  { key: 'ledgerAmount', label: 'Ledger amount', align: 'right' },
  { key: 'bankTransaction', label: 'Bank transaction' },
  { key: 'bankDate', label: 'Bank date' },
  { key: 'bankAmount', label: 'Bank amount', align: 'right' },
  { key: 'matchConfidence', label: 'Match details', sortLabel: 'match confidence' },
]

const getReconciliationSortValue = (row, key) => {
  switch (key) {
    case 'status':
      return reconciliationStatusOrder[row.reconciliationStatus] ?? Number.MAX_SAFE_INTEGER
    case 'ledgerEntry':
      return row.invoiceId ? `${row.invoiceNumber || ''} ${row.vendorName || ''}`.trim() : null
    case 'ledgerDate': {
      const value = row.invoiceDate ? Date.parse(row.invoiceDate) : Number.NaN
      return Number.isFinite(value) ? value : null
    }
    case 'ledgerAmount': {
      const value = Number(row.invoiceAmount)
      return row.invoiceAmount !== null && row.invoiceAmount !== undefined && Number.isFinite(value) ? value : null
    }
    case 'bankTransaction':
      return row.transactionId
        ? `${row.transactionDescription || ''} ${row.transactionId}`.trim()
        : null
    case 'bankDate': {
      const value = row.transactionDate ? Date.parse(row.transactionDate) : Number.NaN
      return Number.isFinite(value) ? value : null
    }
    case 'bankAmount': {
      const value = Number(row.transactionAmount)
      return row.transactionAmount !== null && row.transactionAmount !== undefined && Number.isFinite(value) ? value : null
    }
    case 'matchConfidence': {
      const value = Number(row.matchConfidence)
      return row.matchConfidence !== null && row.matchConfidence !== undefined && Number.isFinite(value) ? value : null
    }
    default:
      return null
  }
}

const compareReconciliationRows = (left, right, key, direction) => {
  const leftValue = getReconciliationSortValue(left, key)
  const rightValue = getReconciliationSortValue(right, key)

  if (leftValue === null && rightValue === null) return 0
  if (leftValue === null) return 1
  if (rightValue === null) return -1

  const comparison = typeof leftValue === 'number' && typeof rightValue === 'number'
    ? leftValue - rightValue
    : String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true, sensitivity: 'base' })

  return direction === 'asc' ? comparison : -comparison
}

const toDateInputValue = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getInitialReconciliationRange = () => {
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 29)
  return {
    startDate: toDateInputValue(startDate),
    endDate: toDateInputValue(endDate),
  }
}

const formatNumber = (value) => new Intl.NumberFormat().format(Number(value) || 0)

const formatMoney = (value, currency = 'USD') => {
  const numeric = Number(value)
  const safeCurrency = typeof currency === 'string' && currency.trim() ? currency.toUpperCase() : 'USD'

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: safeCurrency,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(numeric) ? numeric : 0)
  } catch {
    return `${safeCurrency} ${(Number.isFinite(numeric) ? numeric : 0).toFixed(2)}`
  }
}

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB')
}

const formatIsoDate = (value) => {
  if (!value) return ''
  const text = String(value)
  const match = text.match(/^\d{4}-\d{2}-\d{2}/)
  if (match) return match[0]
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : toDateInputValue(date)
}

const formatConfidence = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  return `${(numeric <= 1 ? numeric * 100 : numeric).toFixed(1)}%`
}

const makeSpreadsheetSafe = (value) => {
  const text = value === null || value === undefined ? '' : String(value)
  return typeof value === 'string' && /^[=+\-@]/.test(text) ? `'${text}` : text
}

const escapeCsvValue = (value) => {
  const text = makeSpreadsheetSafe(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const downloadCsv = (filename, columns, rows) => {
  if (!rows.length) return

  const lines = [
    columns.map((column) => escapeCsvValue(column.label)).join(','),
    ...rows.map((row) => columns.map((column) => escapeCsvValue(column.getValue(row))).join(',')),
  ]
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function CurrencyAmounts({ amounts, emptyLabel = 'No balance' }) {
  if (!Array.isArray(amounts) || amounts.length === 0) {
    return <Typography variant="body2" color="text.secondary">{emptyLabel}</Typography>
  }

  return (
    <Stack spacing={0.25}>
      {amounts.map((amount) => (
        <Typography key={amount.currency} variant="body2" fontWeight={700}>
          {formatMoney(amount.amount, amount.currency)}
        </Typography>
      ))}
    </Stack>
  )
}

function LoadingRows() {
  return (
    <Stack spacing={1.1}>
      {[1, 2, 3, 4].map((item) => <Skeleton key={item} variant="rounded" height={44} />)}
    </Stack>
  )
}

function TabPanel({ activeTab, tabValue, children }) {
  if (activeTab !== tabValue) return null
  return <Box>{children}</Box>
}

function ReportCatalog({ reconciliation, aging, onSelectReport }) {
  const summary = reconciliation?.summary || {}
  const totalExceptions = Number(summary.unmatchedLedgerCount || 0) + Number(summary.unmatchedBankTransactionCount || 0)
  const theme = useTheme()

  const statusPieData = [
    { name: 'Fully matched', value: Number(summary.fullyMatchedLedgerCount) || 0, color: theme.palette.success.main },
    { name: 'Partially matched', value: Number(summary.partiallyMatchedLedgerCount) || 0, color: theme.palette.info.main },
    { name: 'Exceptions', value: totalExceptions, color: theme.palette.warning.main },
  ]
  const hasPieData = statusPieData.some((d) => d.value > 0)

  const agingBuckets = aging?.buckets || []
  const agingChartData = agingBuckets
    .filter((b) => b.amountsByCurrency?.length)
    .map((b) => ({ name: b.label, amount: b.amountsByCurrency[0]?.amount || 0 }))
  const hasAgingChart = agingChartData.length > 0

  return (
    <Grid container spacing={2} component={motion.div} variants={itemVariants}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card elevation={0} sx={{ ...reportCardSx, height: '100%' }}>
          <CardContent>
            <Stack spacing={1.4}>
              <CompareArrowsRoundedIcon sx={{ color: '#a9d5ff' }} />
              <Typography variant="h6">Reconciliation Overview</Typography>
              <Typography variant="body2" color="text.secondary">
                Compare invoice ledger entries with imported bank transactions and expose unmatched activity.
              </Typography>
              {hasPieData && (
                <Box sx={{ width: '100%', height: 180 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                        {statusPieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={`${formatNumber(summary.fullyMatchedLedgerCount)} fully matched`} />
                <Chip size="small" color={totalExceptions > 0 ? 'warning' : 'success'} label={`${formatNumber(totalExceptions)} exceptions`} />
              </Stack>
              <Button
                variant="outlined"
                onClick={() => onSelectReport(REPORT_TAB_KEYS.reconciliation)}
                sx={{ alignSelf: 'flex-start' }}
              >
                View reconciliation
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card elevation={0} sx={{ ...reportCardSx, height: '100%' }}>
          <CardContent>
            <Stack spacing={1.4}>
              <ScheduleRoundedIcon sx={{ color: '#b7ffd2' }} />
              <Typography variant="h6">Aging Overview</Typography>
              <Typography variant="body2" color="text.secondary">
                Track unpaid vendor invoices by due date and remaining balance after historical payments.
              </Typography>
              {hasAgingChart && (
                <Box sx={{ width: '100%', height: 180 }}>
                  <ResponsiveContainer>
                    <BarChart data={agingChartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="name" stroke={theme.palette.text.disabled} tick={{ fontSize: 10 }} />
                      <YAxis stroke={theme.palette.text.disabled} tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }} />
                      <Bar dataKey="amount" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={`${formatNumber(aging?.totalInvoiceCount)} unpaid invoices`} />
                <Chip size="small" label={`${aging?.totalsByCurrency?.length || 0} currencies`} />
              </Stack>
              <Button
                variant="outlined"
                onClick={() => onSelectReport(REPORT_TAB_KEYS.aging)}
                sx={{ alignSelf: 'flex-start' }}
              >
                View aging
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

function ReconciliationReportSection({
  report,
  loading,
  error,
  range,
  rangeIsInvalid,
  onRangeChange,
  onReload,
  onExport,
}) {
  const rows = report?.rows || EMPTY_REPORT_ROWS
  const summary = report?.summary || {}
  const [sortKey, setSortKey] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows
    return [...rows].sort((left, right) => compareReconciliationRows(left, right, sortKey, sortDirection))
  }, [rows, sortDirection, sortKey])

  const handleSort = (key) => {
    const nextDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortKey(key)
    setSortDirection(nextDirection)
  }

  let content
  if (loading) {
    content = <LoadingRows />
  } else if (rows.length === 0) {
    content = (
      <EmptyState
        title="No reconciliation activity"
        description="No eligible invoices or bank transactions were found in this inclusive date range."
        actionLabel="Reload reconciliation"
        onAction={onReload}
      />
    )
  } else {
    content = (
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" aria-label="Reconciliation report table" sx={{ minWidth: 1160 }}>
          <TableHead>
            <TableRow>
              {reconciliationColumns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align || 'left'}
                  sortDirection={sortKey === column.key ? sortDirection : false}
                >
                  <TableSortLabel
                    active={sortKey === column.key}
                    direction={sortKey === column.key ? sortDirection : 'asc'}
                    onClick={() => handleSort(column.key)}
                    aria-label={`Sort by ${column.sortLabel || column.label}`}
                    sx={{
                      width: '100%',
                      justifyContent: column.align === 'right' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map((row, index) => {
              const status = statusPresentation[row.reconciliationStatus] || {
                label: row.reconciliationStatus || 'Unknown',
                color: 'default',
              }
              const key = row.matchId
                ? `match-${row.matchId}`
                : row.invoiceId
                  ? `invoice-${row.invoiceId}`
                  : row.transactionId
                    ? `transaction-${row.transactionId}`
                    : `row-${index}`

              return (
                <TableRow key={key} hover>
                  <TableCell><Chip size="small" label={status.label} color={status.color} variant="outlined" /></TableCell>
                  <TableCell>
                    {row.invoiceId ? (
                      <Stack spacing={0.25}>
                        <Typography variant="body2" fontWeight={700}>{row.invoiceNumber || `#${row.invoiceId}`}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.vendorName || 'Unknown vendor'}</Typography>
                      </Stack>
                    ) : '—'}
                  </TableCell>
                  <TableCell>{formatDate(row.invoiceDate)}</TableCell>
                  <TableCell align="right">
                    {row.invoiceAmount === null || row.invoiceAmount === undefined
                      ? '—'
                      : formatMoney(row.invoiceAmount, row.invoiceCurrency)}
                  </TableCell>
                  <TableCell>
                    {row.transactionId ? (
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{row.transactionDescription || `Transaction #${row.transactionId}`}</Typography>
                        <Typography variant="caption" color="text.secondary">#{row.transactionId}</Typography>
                      </Stack>
                    ) : '—'}
                  </TableCell>
                  <TableCell>{formatDate(row.transactionDate)}</TableCell>
                  <TableCell align="right">
                    {row.transactionAmount === null || row.transactionAmount === undefined
                      ? '—'
                      : formatMoney(row.transactionAmount, row.transactionCurrency || report?.companyCurrency)}
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.25}>
                      <Typography variant="body2">
                        {row.matchMethod ? `${row.matchMethod} · ${formatConfidence(row.matchConfidence)}` : 'No recorded match'}
                      </Typography>
                      {row.outstandingAmount > 0 && (
                        <Typography variant="caption" color="warning.main">
                          Outstanding {formatMoney(row.outstandingAmount, row.invoiceCurrency)}
                        </Typography>
                      )}
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
    <Card id="reconciliation-report" elevation={0} component={motion.div} variants={itemVariants} sx={reportCardSx}>
      <CardContent sx={{ p: { xs: 2.2, md: 2.8 } }}>
        <Stack spacing={2.2}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
            <Stack spacing={0.4}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AccountBalanceRoundedIcon color="primary" />
                <Typography variant="h6">Reconciliation Report</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Invoice ledger entries and bank transactions are included when either date falls within the range.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={onReload} disabled={loading || rangeIsInvalid}>
                Reload
              </Button>
              <Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={onExport} disabled={loading || rows.length === 0}>
                Export CSV
              </Button>
            </Stack>
          </Stack>

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Start date"
                type="date"
                value={range.startDate}
                onChange={(event) => onRangeChange('startDate', event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="End date"
                type="date"
                value={range.endDate}
                onChange={(event) => onRangeChange('endDate', event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
          </Grid>

          {rangeIsInvalid && <Alert severity="error">Start date must be on or before end date.</Alert>}
          {error && <Alert severity="warning">{error}</Alert>}

          <Grid container spacing={1.2}>
            {[
              ['Ledger entries', summary.ledgerEntryCount, 'default'],
              ['Fully matched', summary.fullyMatchedLedgerCount, 'success'],
              ['Partially matched', summary.partiallyMatchedLedgerCount, 'info'],
              ['Ledger only', summary.unmatchedLedgerCount, 'warning'],
              ['Bank only', summary.unmatchedBankTransactionCount, 'error'],
            ].map(([label, value, color]) => (
              <Grid key={label} size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Chip color={color} variant="outlined" label={`${label}: ${loading ? '…' : formatNumber(value)}`} sx={{ width: '100%' }} />
              </Grid>
            ))}
          </Grid>

          {content}
        </Stack>
      </CardContent>
    </Card>
  )
}

function AgingReportSection({ report, loading, error, asOfDate, onAsOfDateChange, onReload, onExport }) {
  const rows = report?.rows || []
  const buckets = report?.buckets || []

  let content
  if (loading) {
    content = <LoadingRows />
  } else if (rows.length === 0) {
    content = (
      <EmptyState
        title="No unpaid invoices"
        description="No eligible vendor invoices have an outstanding balance on this date."
        actionLabel="Reload aging"
        onAction={onReload}
      />
    )
  } else {
    content = (
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" aria-label="Payables aging report table" sx={{ minWidth: 1080 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 120 }}>Invoice</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Invoice date</TableCell>
              <TableCell>Due date</TableCell>
              <TableCell align="right">Days overdue</TableCell>
              <TableCell>Bucket</TableCell>
              <TableCell align="right">Original</TableCell>
              <TableCell align="right">Paid</TableCell>
              <TableCell align="right">Outstanding</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.invoiceId} hover>
                <TableCell sx={{ fontWeight: 700, width: 120, wordBreak: 'break-all', whiteSpace: 'normal' }}>{row.invoiceNumber || `#${row.invoiceId}`}</TableCell>
                <TableCell>{row.vendorName || 'Unknown vendor'}</TableCell>
                <TableCell>{formatDate(row.invoiceDate)}</TableCell>
                <TableCell>
                  <Stack spacing={0.2}>
                    <Typography variant="body2">{formatDate(row.effectiveDueDate)}</Typography>
                    {!row.dueDate && <Typography variant="caption" color="text.secondary">Invoice-date fallback</Typography>}
                  </Stack>
                </TableCell>
                <TableCell align="right">{Math.max(Number(row.daysPastDue) || 0, 0)}</TableCell>
                <TableCell><Chip size="small" variant="outlined" label={row.bucketLabel} /></TableCell>
                <TableCell align="right">{formatMoney(row.originalAmount, row.currency)}</TableCell>
                <TableCell align="right">{formatMoney(row.matchedAmount, row.currency)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatMoney(row.outstandingAmount, row.currency)}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={row.paymentStatus === 'partially_paid' ? 'info' : 'warning'}
                    label={row.paymentStatus === 'partially_paid' ? 'Partially paid' : 'Unpaid'}
                    sx={{ minWidth: 120 }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  return (
    <Card id="aging-report" elevation={0} component={motion.div} variants={itemVariants} sx={reportCardSx}>
      <CardContent sx={{ p: { xs: 2.2, md: 2.8 } }}>
        <Stack spacing={2.2}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
            <Stack spacing={0.4}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ScheduleRoundedIcon color="primary" />
                <Typography variant="h6">Payables Aging</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Outstanding vendor bills as of the selected date, with historical bank payments applied.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={onReload} disabled={loading}>
                Reload
              </Button>
              <Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={onExport} disabled={loading || rows.length === 0}>
                Export CSV
              </Button>
            </Stack>
          </Stack>

          <Grid container spacing={1.5} alignItems="stretch">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="As of date"
                type="date"
                value={asOfDate}
                onChange={(event) => onAsOfDateChange(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent sx={{ py: 1.2, '&:last-child': { pb: 1.2 } }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      {loading ? 'Loading unpaid invoices…' : `${formatNumber(report?.totalInvoiceCount)} unpaid invoices`}
                    </Typography>
                    <CurrencyAmounts amounts={report?.totalsByCurrency} emptyLabel="No outstanding balance" />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {error && <Alert severity="warning">{error}</Alert>}

          <Grid container spacing={1.2}>
            {(loading ? [1, 2, 3, 4, 5] : buckets).map((bucket) => (
              <Grid key={loading ? bucket : bucket.key} size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 1.6, '&:last-child': { pb: 1.6 } }}>
                    {loading ? (
                      <Stack spacing={0.8}><Skeleton width="55%" /><Skeleton width="80%" /></Stack>
                    ) : (
                      <Stack spacing={0.7}>
                        <Typography variant="body2" fontWeight={700}>{bucket.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatNumber(bucket.invoiceCount)} invoice{bucket.invoiceCount === 1 ? '' : 's'}
                        </Typography>
                        <CurrencyAmounts amounts={bucket.amountsByCurrency} />
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {content}
        </Stack>
      </CardContent>
    </Card>
  )
}

function ReportsPage() {
  const { token } = useAuth()
  const { activeCompanyId } = useCompany()
  const [activeReportTab, setActiveReportTab] = useState(REPORT_TAB_KEYS.reconciliation)
  const [reconciliationRange, setReconciliationRange] = useState(getInitialReconciliationRange)
  const [asOfDate, setAsOfDate] = useState(() => toDateInputValue(new Date()))
  const [reconciliation, setReconciliation] = useState(null)
  const [aging, setAging] = useState(null)
  const [reconciliationLoading, setReconciliationLoading] = useState(false)
  const [agingLoading, setAgingLoading] = useState(false)
  const [reconciliationError, setReconciliationError] = useState('')
  const [agingError, setAgingError] = useState('')

  const rangeIsInvalid = Boolean(
    reconciliationRange.startDate
    && reconciliationRange.endDate
    && reconciliationRange.startDate > reconciliationRange.endDate,
  )

  const loadReconciliation = useCallback(async () => {
    if (!activeCompanyId || !token) {
      setReconciliation(null)
      setReconciliationError('Select an accessible company and sign in to load reconciliation data.')
      setReconciliationLoading(false)
      return
    }
    if (rangeIsInvalid) return

    setReconciliationLoading(true)
    setReconciliationError('')
    setReconciliation(null)
    try {
      const result = await getReconciliationReport(activeCompanyId, {
        startDate: reconciliationRange.startDate || undefined,
        endDate: reconciliationRange.endDate || undefined,
      }, token)
      setReconciliation(result || null)
    } catch (error) {
      setReconciliationError(error.message || 'Unable to load the reconciliation report.')
    } finally {
      setReconciliationLoading(false)
    }
  }, [activeCompanyId, rangeIsInvalid, reconciliationRange.endDate, reconciliationRange.startDate, token])

  const loadAging = useCallback(async () => {
    if (!activeCompanyId || !token) {
      setAging(null)
      setAgingError('Select an accessible company and sign in to load payables aging.')
      setAgingLoading(false)
      return
    }

    setAgingLoading(true)
    setAgingError('')
    setAging(null)
    try {
      const result = await getPayablesAgingReport(activeCompanyId, { asOfDate: asOfDate || undefined }, token)
      setAging(result || null)
    } catch (error) {
      setAgingError(error.message || 'Unable to load the payables-aging report.')
    } finally {
      setAgingLoading(false)
    }
  }, [activeCompanyId, asOfDate, token])

  useEffect(() => {
    loadReconciliation()
  }, [loadReconciliation])

  useEffect(() => {
    loadAging()
  }, [loadAging])

  const handleRangeChange = (field, value) => {
    setReconciliationRange((current) => ({ ...current, [field]: value }))
  }

  const exportReconciliation = () => {
    const rows = reconciliation?.rows || []
    downloadCsv(
      `reconciliation-${reconciliationRange.startDate || 'all'}-${reconciliationRange.endDate || 'all'}.csv`,
      [
        { label: 'Reconciliation Status', getValue: (row) => statusPresentation[row.reconciliationStatus]?.label || row.reconciliationStatus },
        { label: 'Invoice ID', getValue: (row) => row.invoiceId || '' },
        { label: 'Invoice Number', getValue: (row) => row.invoiceNumber || '' },
        { label: 'Vendor', getValue: (row) => row.vendorName || '' },
        { label: 'Invoice Date', getValue: (row) => formatIsoDate(row.invoiceDate) },
        { label: 'Due Date', getValue: (row) => formatIsoDate(row.dueDate) },
        { label: 'Invoice Amount', getValue: (row) => row.invoiceAmount ?? '' },
        { label: 'Invoice Currency', getValue: (row) => row.invoiceCurrency || '' },
        { label: 'Invoice Status', getValue: (row) => row.invoiceStatus || '' },
        { label: 'Invoice Matched Amount', getValue: (row) => row.invoiceMatchedAmount ?? '' },
        { label: 'Outstanding Amount', getValue: (row) => row.outstandingAmount ?? '' },
        { label: 'Match ID', getValue: (row) => row.matchId || '' },
        { label: 'Matched Amount', getValue: (row) => row.matchedAmount ?? '' },
        { label: 'Match Method', getValue: (row) => row.matchMethod || '' },
        { label: 'Match Confidence', getValue: (row) => row.matchConfidence ?? '' },
        { label: 'Transaction ID', getValue: (row) => row.transactionId || '' },
        { label: 'Transaction Date', getValue: (row) => formatIsoDate(row.transactionDate) },
        { label: 'Transaction Description', getValue: (row) => row.transactionDescription || '' },
        { label: 'Transaction Amount', getValue: (row) => row.transactionAmount ?? '' },
        { label: 'Transaction Currency', getValue: (row) => row.transactionCurrency || reconciliation?.companyCurrency || '' },
        { label: 'Original Transaction Amount', getValue: (row) => row.originalTransactionAmount ?? '' },
        { label: 'Original Transaction Currency', getValue: (row) => row.originalTransactionCurrency || '' },
        { label: 'Transaction Type', getValue: (row) => row.transactionType || '' },
      ],
      rows,
    )
  }

  const exportAging = () => {
    const rows = aging?.rows || []
    downloadCsv(
      `payables-aging-${asOfDate || 'current'}.csv`,
      [
        { label: 'Invoice ID', getValue: (row) => row.invoiceId },
        { label: 'Invoice Number', getValue: (row) => row.invoiceNumber },
        { label: 'Vendor', getValue: (row) => row.vendorName },
        { label: 'Invoice Date', getValue: (row) => formatIsoDate(row.invoiceDate) },
        { label: 'Due Date', getValue: (row) => formatIsoDate(row.dueDate) },
        { label: 'Effective Due Date', getValue: (row) => formatIsoDate(row.effectiveDueDate) },
        { label: 'Days Past Due', getValue: (row) => row.daysPastDue },
        { label: 'Aging Bucket', getValue: (row) => row.bucketLabel },
        { label: 'Original Amount', getValue: (row) => row.originalAmount },
        { label: 'Matched Amount', getValue: (row) => row.matchedAmount },
        { label: 'Outstanding Amount', getValue: (row) => row.outstandingAmount },
        { label: 'Currency', getValue: (row) => row.currency },
        { label: 'Payment Status', getValue: (row) => row.paymentStatus },
      ],
      rows,
    )
  }

  return (
    <Box sx={{ py: { xs: 3, md: 5 }, minHeight: '100%', position: 'relative', overflow: 'hidden' }}>
      <AnimatedBackground density="low" />
      <Container maxWidth={false} disableGutters sx={{ px: { xs: 2, sm: 3, md: 4, xl: 5 }, width: '100%', position: 'relative', zIndex: 1 }}>
        <Stack component={motion.div} variants={containerVariants} initial="hidden" animate="show" spacing={3}>
          <ReportCatalog
            reconciliation={reconciliation}
            aging={aging}
            onSelectReport={setActiveReportTab}
          />

          <Box
            component={motion.div}
            variants={itemVariants}
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              overflowX: 'auto',
            }}
          >
            <Tabs
              value={activeReportTab}
              onChange={(_, value) => setActiveReportTab(value)}
              variant="scrollable"
              allowScrollButtonsMobile
              aria-label="Financial report tabs"
            >
              {reportTabs.map((tab) => (
                <Tab
                  key={tab.value}
                  value={tab.value}
                  icon={tab.icon}
                  iconPosition="start"
                  label={tab.label}
                  sx={{ textTransform: 'none', alignItems: 'center' }}
                />
              ))}
            </Tabs>
          </Box>

          <TabPanel activeTab={activeReportTab} tabValue={REPORT_TAB_KEYS.reconciliation}>
            <ReconciliationReportSection
              report={reconciliation}
              loading={reconciliationLoading}
              error={reconciliationError}
              range={reconciliationRange}
              rangeIsInvalid={rangeIsInvalid}
              onRangeChange={handleRangeChange}
              onReload={loadReconciliation}
              onExport={exportReconciliation}
            />
          </TabPanel>

          <TabPanel activeTab={activeReportTab} tabValue={REPORT_TAB_KEYS.aging}>
            <AgingReportSection
              report={aging}
              loading={agingLoading}
              error={agingError}
              asOfDate={asOfDate}
              onAsOfDateChange={setAsOfDate}
              onReload={loadAging}
              onExport={exportAging}
            />
          </TabPanel>
        </Stack>
      </Container>
    </Box>
  )
}

export default ReportsPage
