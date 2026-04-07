import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import { getDashboardReport, getReconciliationReport, getVatReport } from '../services/reports'

const reportPeriods = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'qtd', label: 'Quarter to date' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'custom', label: 'Custom range' },
]

const containerVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: 'easeOut',
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const toDateInputValue = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const startOfDay = (date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

const getPresetRange = (period) => {
  const today = startOfDay(new Date())

  if (period === '7d') {
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 6)
    return { startDate: toDateInputValue(startDate), endDate: toDateInputValue(today) }
  }

  if (period === '30d') {
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 29)
    return { startDate: toDateInputValue(startDate), endDate: toDateInputValue(today) }
  }

  if (period === 'qtd') {
    const startDate = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
    return { startDate: toDateInputValue(startDate), endDate: toDateInputValue(today) }
  }

  if (period === 'ytd') {
    const startDate = new Date(today.getFullYear(), 0, 1)
    return { startDate: toDateInputValue(startDate), endDate: toDateInputValue(today) }
  }

  return { startDate: '', endDate: '' }
}

const formatNumber = (value) => new Intl.NumberFormat().format(Number(value) || 0)

const formatMoney = (value, currency = 'USD') =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatPercent = (value) => {
  if (value === null || value === undefined) return '—'

  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'

  const percentage = numeric <= 1 ? numeric * 100 : numeric
  const digits = Number.isInteger(percentage) ? 0 : 1
  return `${percentage.toFixed(digits)}%`
}

const formatMatchConfidence = (value) => {
  if (value === null || value === undefined) return '—'

  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'

  const percentage = numeric <= 1 ? numeric * 100 : numeric
  return `${percentage.toFixed(1)}%`
}

const escapeCsvValue = (value) => {
  const text = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

const downloadCsv = (filename, columns, rows) => {
  if (!rows.length) return

  const csvLines = [
    columns.map((column) => escapeCsvValue(column.label)).join(','),
    ...rows.map((row) => columns.map((column) => escapeCsvValue(column.getValue(row))).join(',')),
  ]

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function useReportsData(activeCompanyId, token, effectiveRange) {
  const [dashboardStats, setDashboardStats] = useState(null)
  const [vatReport, setVatReport] = useState(null)
  const [reconciliationRows, setReconciliationRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const refresh = useCallback(async () => {
    if (!activeCompanyId || !token) {
      setDashboardStats(null)
      setVatReport(null)
      setReconciliationRows([])
      setErrorMessage('Select a company and sign in to load reports.')
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMessage('')

    const query = {
      startDate: effectiveRange.startDate || undefined,
      endDate: effectiveRange.endDate || undefined,
    }

    try {
      const [dashboardResult, vatResult, reconciliationResult] = await Promise.allSettled([
        getDashboardReport(activeCompanyId, token),
        getVatReport(activeCompanyId, query, token),
        getReconciliationReport(activeCompanyId, query, token),
      ])

      const nextErrors = []

      if (dashboardResult.status === 'fulfilled') {
        setDashboardStats(dashboardResult.value || null)
      } else {
        setDashboardStats(null)
        nextErrors.push('overview metrics')
      }

      if (vatResult.status === 'fulfilled') {
        setVatReport(vatResult.value || null)
      } else {
        setVatReport(null)
        nextErrors.push('VAT report')
      }

      if (reconciliationResult.status === 'fulfilled') {
        setReconciliationRows(Array.isArray(reconciliationResult.value) ? reconciliationResult.value : [])
      } else {
        setReconciliationRows([])
        nextErrors.push('reconciliation report')
      }

      setErrorMessage(
        nextErrors.length > 0
          ? `Some report data could not be loaded: ${nextErrors.join(', ')}.`
          : '',
      )
    } catch (error) {
      setDashboardStats(null)
      setVatReport(null)
      setReconciliationRows([])
      setErrorMessage(error.message || 'Unable to load reports.')
    } finally {
      setLoading(false)
    }
  }, [activeCompanyId, effectiveRange.endDate, effectiveRange.startDate, token])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    dashboardStats,
    vatReport,
    reconciliationRows,
    loading,
    errorMessage,
    refresh,
  }
}

function SummaryCardsGrid({ loading, cards }) {
  return (
    <Grid container spacing={2} component={motion.div} variants={itemVariants} id="overview">
      {loading
        ? [1, 2, 3, 4].map((index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  background: 'linear-gradient(155deg, rgba(12, 22, 40, 0.98), rgba(8, 15, 29, 0.98))',
                }}
              >
                <CardContent>
                  <Stack spacing={1.1}>
                    <Skeleton variant="rounded" width={32} height={32} />
                    <Skeleton variant="text" width="45%" />
                    <Skeleton variant="text" width="60%" height={44} />
                    <Skeleton variant="text" width="80%" />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))
        : cards.map((card) => (
            <Grid key={card.title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  background: 'linear-gradient(155deg, rgba(12, 22, 40, 0.98), rgba(8, 15, 29, 0.98))',
                }}
              >
                <CardContent>
                  <Stack spacing={1}>
                    {card.icon}
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>
                    <Typography variant="h4">{card.value}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.subtitle}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
    </Grid>
  )
}

function ReportCatalogGrid({ reports }) {
  return (
    <Grid container spacing={2} component={motion.div} variants={itemVariants}>
      {reports.map((report) => (
        <Grid key={report.title} size={{ xs: 12, md: 4 }}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(160deg, rgba(14, 24, 42, 0.96), rgba(10, 18, 34, 0.96))',
            }}
          >
            <CardContent>
              <Stack spacing={1.4}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5}>
                  <Box>{report.icon}</Box>
                  <Chip
                    label={report.status}
                    size="small"
                    color={report.chipColor}
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>

                <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                  {report.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {report.description}
                </Typography>

                <Stack spacing={0.8}>
                  {report.metrics.map((metric) => (
                    <Typography key={metric} variant="body2" color="text.secondary">
                      {metric}
                    </Typography>
                  ))}
                </Stack>

                <Button
                  component={report.href ? 'a' : 'button'}
                  href={report.href || undefined}
                  variant={report.href ? 'outlined' : 'text'}
                  disabled={!report.href}
                  sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                >
                  {report.actionLabel}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

function VatReportSection({ loading, vatReport, vatInvoices, currencyCode, onReload, onExport }) {
  const content = (() => {
    if (loading) {
      return (
        <Stack spacing={1.2}>
          {[1, 2, 3, 4].map((index) => (
            <Skeleton key={index} variant="rounded" height={42} />
          ))}
        </Stack>
      )
    }

    if (vatInvoices.length === 0) {
      return (
        <EmptyState
          title="No VAT rows found"
          description="Try a different date range or confirm that the company has VAT-backed invoices."
          actionLabel="Reload reports"
          onAction={onReload}
        />
      )
    }

    return (
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" aria-label="VAT report table">
          <TableHead>
            <TableRow>
              <TableCell>Invoice</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Subtotal</TableCell>
              <TableCell align="right">VAT</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vatInvoices.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.invoiceNumber || `#${row.id}`}</TableCell>
                <TableCell>{row.vendorName || 'Unknown vendor'}</TableCell>
                <TableCell>{formatDate(row.invoiceDate)}</TableCell>
                <TableCell align="right">{formatMoney(row.subtotal, row.currency || currencyCode)}</TableCell>
                <TableCell align="right">
                  {row.vatAmount === null || row.vatAmount === undefined
                    ? '—'
                    : formatMoney(row.vatAmount, row.currency || currencyCode)}
                </TableCell>
                <TableCell align="right">{formatMoney(row.totalAmount, row.currency || currencyCode)}</TableCell>
                <TableCell>
                  <Chip
                    label={row.status || 'Unknown'}
                    size="small"
                    variant="outlined"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )
  })()

  return (
    <Card
      id="vat-report"
      elevation={0}
      component={motion.div}
      variants={itemVariants}
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(155deg, rgba(13, 23, 42, 0.98), rgba(9, 16, 31, 0.98))',
      }}
    >
      <CardContent sx={{ p: { xs: 2.2, md: 2.8 } }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={1.5}
          >
            <Stack spacing={0.4}>
              <Typography variant="h6">VAT Report</Typography>
              <Typography variant="body2" color="text.secondary">
                VAT summaries and invoice detail for the selected period.
              </Typography>
            </Stack>

            <Button
              variant="outlined"
              startIcon={<DownloadRoundedIcon fontSize="small" />}
              onClick={onExport}
              disabled={loading || vatInvoices.length === 0}
              sx={{ textTransform: 'none' }}
            >
              Export CSV
            </Button>
          </Stack>

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Chip
                label={`Subtotal ${loading ? '...' : formatMoney(vatReport?.totalSubtotal || 0, currencyCode)}`}
                sx={{ width: '100%', justifyContent: 'flex-start' }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Chip
                label={`VAT ${loading ? '...' : formatMoney(vatReport?.totalVat || 0, currencyCode)}`}
                sx={{ width: '100%', justifyContent: 'flex-start' }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Chip
                label={`Gross ${loading ? '...' : formatMoney(vatReport?.totalAmount || 0, currencyCode)}`}
                sx={{ width: '100%', justifyContent: 'flex-start' }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Chip
                label={`Invoices ${loading ? '...' : formatNumber(vatReport?.invoiceCount || 0)}`}
                sx={{ width: '100%', justifyContent: 'flex-start' }}
              />
            </Grid>
          </Grid>

          {content}
        </Stack>
      </CardContent>
    </Card>
  )
}

function ReconciliationReportSection({
  loading,
  reconciliationRows,
  currencyCode,
  matchedTransactions,
  totalTransactions,
  matchRate,
  onReload,
  onExport,
}) {
  const content = (() => {
    if (loading) {
      return (
        <Stack spacing={1.2}>
          {[1, 2, 3, 4].map((index) => (
            <Skeleton key={index} variant="rounded" height={42} />
          ))}
        </Stack>
      )
    }

    if (reconciliationRows.length === 0) {
      return (
        <EmptyState
          title="No reconciliation rows found"
          description="Try a different reporting period or verify that reconciliation data is available for this company."
          actionLabel="Reload reports"
          onAction={onReload}
        />
      )
    }

    return (
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" aria-label="Reconciliation report table">
          <TableHead>
            <TableRow>
              <TableCell>Invoice</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Match</TableCell>
              <TableCell>Confidence</TableCell>
              <TableCell>Transaction</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reconciliationRows.map((row) => (
              <TableRow key={row.invoiceId} hover>
                <TableCell>{row.invoiceNumber || `#${row.invoiceId}`}</TableCell>
                <TableCell>{row.vendorName || 'Unknown vendor'}</TableCell>
                <TableCell>{formatDate(row.invoiceDate)}</TableCell>
                <TableCell align="right">{formatMoney(row.invoiceAmount, currencyCode)}</TableCell>
                <TableCell>
                  <Chip
                    label={row.isMatched ? 'Matched' : 'Unmatched'}
                    size="small"
                    color={row.isMatched ? 'success' : 'warning'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{formatMatchConfidence(row.matchConfidence)}</TableCell>
                <TableCell>
                  <Stack spacing={0.35}>
                    <Typography variant="body2">{row.transactionDescription || 'No linked transaction'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.matchMethod ? `${row.matchMethod} match` : 'No match method recorded'}
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )
  })()

  return (
    <Card
      id="reconciliation-report"
      elevation={0}
      component={motion.div}
      variants={itemVariants}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(155deg, rgba(13, 23, 42, 0.98), rgba(9, 16, 31, 0.98))',
      }}
    >
      <CardContent sx={{ p: { xs: 2.2, md: 2.8 } }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={1.5}
          >
            <Stack spacing={0.4}>
              <Typography variant="h6">Reconciliation Report</Typography>
              <Typography variant="body2" color="text.secondary">
                Matched and unmatched invoice rows with linked transaction detail.
              </Typography>
            </Stack>

            <Button
              variant="outlined"
              startIcon={<DownloadRoundedIcon fontSize="small" />}
              onClick={onExport}
              disabled={loading || reconciliationRows.length === 0}
              sx={{ textTransform: 'none' }}
            >
              Export CSV
            </Button>
          </Stack>

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Chip
                label={`Matched ${loading ? '...' : formatNumber(matchedTransactions)}`}
                sx={{ width: '100%', justifyContent: 'flex-start' }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Chip
                label={`Unmatched ${loading ? '...' : formatNumber(Math.max(totalTransactions - matchedTransactions, 0))}`}
                sx={{ width: '100%', justifyContent: 'flex-start' }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Chip
                label={`Match rate ${loading ? '...' : formatPercent(matchRate)}`}
                sx={{ width: '100%', justifyContent: 'flex-start' }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Chip
                label={`Rows ${loading ? '...' : formatNumber(reconciliationRows.length)}`}
                sx={{ width: '100%', justifyContent: 'flex-start' }}
              />
            </Grid>
          </Grid>

          {content}
        </Stack>
      </CardContent>
    </Card>
  )
}

function ReportsPage() {
  const { token } = useAuth()
  const { companies, activeCompanyId } = useCompany()
  const [period, setPeriod] = useState('30d')
  const [customRange, setCustomRange] = useState(() => getPresetRange('30d'))

  const activeCompany = useMemo(
    () =>
      companies.find((company) => Number(company.id ?? company.companyId) === Number(activeCompanyId)) || null,
    [activeCompanyId, companies],
  )

  const effectiveRange = useMemo(
    () => (period === 'custom' ? customRange : getPresetRange(period)),
    [customRange, period],
  )

  const selectedRangeLabel = useMemo(() => getSelectedRangeLabel(period, effectiveRange), [effectiveRange, period])

  const { dashboardStats, vatReport, reconciliationRows, loading, errorMessage, refresh } = useReportsData(
    activeCompanyId,
    token,
    effectiveRange,
  )

  const vatInvoices = vatReport?.invoices || []
  const currencyCode = vatInvoices[0]?.currency || 'USD'
  const totalTransactions = Number(dashboardStats?.totalTransactions || 0)
  const matchedTransactions = Number(dashboardStats?.matchedTransactions || 0)
  const matchRate = totalTransactions > 0 ? Math.round((matchedTransactions / totalTransactions) * 100) : 0

  const summaryCards = buildSummaryCards({
    loading,
    dashboardStats,
    vatReport,
    currencyCode,
    matchedTransactions,
    totalTransactions,
    matchRate,
    selectedRangeLabel,
  })

  const reportCatalog = buildReportCatalog({
    dashboardStats,
    vatReport,
    reconciliationRows,
    currencyCode,
    matchedTransactions,
    totalTransactions,
  })

  const exportVatCsv = () => {
    downloadCsv(
      `vat-report-${effectiveRange.startDate || 'all'}-${effectiveRange.endDate || 'all'}.csv`,
      [
        { label: 'Invoice Number', getValue: (row) => row.invoiceNumber },
        { label: 'Vendor Name', getValue: (row) => row.vendorName },
        { label: 'Invoice Date', getValue: (row) => formatDate(row.invoiceDate) },
        { label: 'Subtotal', getValue: (row) => row.subtotal },
        { label: 'VAT Rate', getValue: (row) => formatPercent(row.vatRate) },
        { label: 'VAT Amount', getValue: (row) => row.vatAmount ?? '' },
        { label: 'Total Amount', getValue: (row) => row.totalAmount },
        { label: 'Currency', getValue: (row) => row.currency },
        { label: 'Status', getValue: (row) => row.status },
      ],
      vatInvoices,
    )
  }

  const exportReconciliationCsv = () => {
    downloadCsv(
      `reconciliation-report-${effectiveRange.startDate || 'all'}-${effectiveRange.endDate || 'all'}.csv`,
      [
        { label: 'Invoice Number', getValue: (row) => row.invoiceNumber },
        { label: 'Vendor Name', getValue: (row) => row.vendorName },
        { label: 'Invoice Date', getValue: (row) => formatDate(row.invoiceDate) },
        { label: 'Invoice Amount', getValue: (row) => row.invoiceAmount },
        { label: 'Invoice Status', getValue: (row) => row.invoiceStatus },
        { label: 'Matched', getValue: (row) => (row.isMatched ? 'Yes' : 'No') },
        { label: 'Match Method', getValue: (row) => row.matchMethod || '' },
        { label: 'Match Confidence', getValue: (row) => formatMatchConfidence(row.matchConfidence) },
        { label: 'Transaction Description', getValue: (row) => row.transactionDescription || '' },
        { label: 'Transaction Amount', getValue: (row) => row.transactionAmount ?? '' },
      ],
      reconciliationRows,
    )
  }

  return (
    <Box
      sx={{
        py: { xs: 3, md: 5 },
        background:
          'radial-gradient(circle at 0% 0%, rgba(88, 166, 255, 0.22), transparent 34%), radial-gradient(circle at 100% 0%, rgba(66, 130, 255, 0.14), transparent 30%), linear-gradient(180deg, #070b14 0%, #091021 62%, #0b1324 100%)',
      }}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{ px: { xs: 2, sm: 3, md: 4, xl: 5 }, width: '100%' }}
      >
        <Stack component={motion.div} variants={containerVariants} initial="hidden" animate="show" spacing={3}>
          <Card
            component={motion.div}
            variants={itemVariants}
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(135deg, rgba(14, 25, 45, 0.98), rgba(9, 17, 33, 0.97))',
              boxShadow: '0 24px 54px rgba(0, 0, 0, 0.42)',
            }}
          >
            <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
              <Stack spacing={2.2}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Stack spacing={0.7}>
                    <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '1.9rem' } }}>
                      Reports
                    </Typography>
                    <Typography color="text.secondary">
                      Generate and review financial reporting for {activeCompany?.name || `company #${activeCompanyId || '—'}`}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap">
                    <Chip
                      label={selectedRangeLabel}
                      sx={{
                        bgcolor: 'rgba(88, 166, 255, 0.16)',
                        border: '1px solid',
                        borderColor: 'rgba(129, 191, 255, 0.38)',
                        color: '#cde7ff',
                        fontWeight: 700,
                      }}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<RefreshRoundedIcon fontSize="small" />}
                      onClick={refresh}
                      disabled={loading}
                      sx={{ textTransform: 'none' }}
                    >
                      {loading ? 'Refreshing...' : 'Refresh reports'}
                    </Button>
                  </Stack>
                </Stack>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      select
                      fullWidth
                      label="Reporting period"
                      value={period}
                      onChange={(event) => setPeriod(event.target.value)}
                      disabled={loading}
                    >
                      {reportPeriods.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Start date"
                      type="date"
                      value={period === 'custom' ? customRange.startDate : effectiveRange.startDate}
                      onChange={(event) => setCustomRange((current) => ({ ...current, startDate: event.target.value }))}
                      disabled={period !== 'custom' || loading}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="End date"
                      type="date"
                      value={period === 'custom' ? customRange.endDate : effectiveRange.endDate}
                      onChange={(event) => setCustomRange((current) => ({ ...current, endDate: event.target.value }))}
                      disabled={period !== 'custom' || loading}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>

          {errorMessage && (
            <Alert severity="warning" component={motion.div} variants={itemVariants} sx={{ borderRadius: 2.5 }}>
              {errorMessage} Successful sections remain visible while the missing data is retried.
            </Alert>
          )}

          <SummaryCardsGrid loading={loading} cards={summaryCards} />
          <ReportCatalogGrid reports={reportCatalog} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }} component={motion.div} variants={itemVariants}>
              <VatReportSection
                loading={loading}
                vatReport={vatReport}
                vatInvoices={vatInvoices}
                currencyCode={currencyCode}
                onReload={refresh}
                onExport={exportVatCsv}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }} component={motion.div} variants={itemVariants}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  background: 'linear-gradient(155deg, rgba(13, 23, 42, 0.98), rgba(9, 16, 31, 0.98))',
                }}
              >
                <CardContent sx={{ p: { xs: 2.2, md: 2.8 } }}>
                  <Stack spacing={1.4}>
                    <Typography variant="h6">Selected range</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {effectiveRange.startDate || effectiveRange.endDate
                        ? `${formatDate(effectiveRange.startDate)} - ${formatDate(effectiveRange.endDate)}`
                        : 'All records'}
                    </Typography>

                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        Active company
                      </Typography>
                      <Typography fontWeight={700}>
                        {activeCompany?.name || activeCompany?.companyName || `Company #${activeCompanyId || '—'}`}
                      </Typography>
                    </Stack>

                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        Reporting notes
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        The page uses the current backend contract for dashboard, VAT, and reconciliation data.
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <ReconciliationReportSection
            loading={loading}
            reconciliationRows={reconciliationRows}
            currencyCode={currencyCode}
            matchedTransactions={matchedTransactions}
            totalTransactions={totalTransactions}
            matchRate={matchRate}
            onReload={refresh}
            onExport={exportReconciliationCsv}
          />
        </Stack>
      </Container>
    </Box>
  )
}

function getSelectedRangeLabel(period, effectiveRange) {
  if (period === 'custom') {
    if (!effectiveRange.startDate && !effectiveRange.endDate) {
      return 'No custom range selected'
    }

    return `${effectiveRange.startDate || 'Any start'} to ${effectiveRange.endDate || 'Any end'}`
  }

  return reportPeriods.find((option) => option.value === period)?.label || 'Selected period'
}

function buildSummaryCards({
  loading,
  dashboardStats,
  vatReport,
  currencyCode,
  matchedTransactions,
  totalTransactions,
  matchRate,
  selectedRangeLabel,
}) {
  return [
    {
      title: 'Invoices in scope',
      value: loading ? '...' : formatNumber(dashboardStats?.totalInvoices || vatReport?.invoiceCount || 0),
      subtitle: selectedRangeLabel,
      icon: <ReceiptLongRoundedIcon sx={{ color: '#a9d5ff' }} />,
    },
    {
      title: 'Match coverage',
      value: loading ? '...' : `${formatNumber(matchedTransactions)} / ${formatNumber(totalTransactions)}`,
      subtitle: loading ? 'Loading reconciliation data' : `${formatPercent(matchRate)} matched`,
      icon: <CompareArrowsRoundedIcon sx={{ color: '#b7ffd2' }} />,
    },
    {
      title: 'VAT total',
      value: loading ? '...' : formatMoney(vatReport?.totalVat || 0, currencyCode),
      subtitle: `${formatNumber(vatReport?.invoiceCount || 0)} invoices in VAT report`,
      icon: <AssessmentRoundedIcon sx={{ color: '#ffd0aa' }} />,
    },
    {
      title: 'Open anomalies',
      value: loading ? '...' : formatNumber(dashboardStats?.openAnomalies || 0),
      subtitle: `${formatNumber(dashboardStats?.criticalAnomalies || 0)} marked critical`,
      icon: <WarningAmberRoundedIcon sx={{ color: '#ffd0aa' }} />,
    },
  ]
}

function buildReportCatalog({ dashboardStats, vatReport, reconciliationRows, currencyCode, matchedTransactions, totalTransactions }) {
  return [
    {
      title: 'Dashboard Snapshot',
      description: 'A company-wide view of invoices, transactions, matches, and anomalies.',
      status: 'Available',
      chipColor: 'success',
      icon: <QueryStatsRoundedIcon sx={{ color: '#a9d5ff' }} />,
      metrics: [
        `${formatNumber(dashboardStats?.totalInvoices || 0)} invoices`,
        `${formatNumber(dashboardStats?.openAnomalies || 0)} open anomalies`,
        `${formatNumber(dashboardStats?.totalMatches || 0)} matches`,
      ],
      actionLabel: 'Scroll to overview',
      href: '#overview',
    },
    {
      title: 'VAT Report',
      description: 'Summarize VAT exposure for the selected date range and export the current list.',
      status: 'Available',
      chipColor: 'success',
      icon: <ReceiptLongRoundedIcon sx={{ color: '#b7ffd2' }} />,
      metrics: [
        `${formatNumber(vatReport?.invoiceCount || 0)} invoices`,
        formatMoney(vatReport?.totalVat || 0, currencyCode),
        formatMoney(vatReport?.totalAmount || 0, currencyCode),
      ],
      actionLabel: 'Scroll to VAT',
      href: '#vat-report',
    },
    {
      title: 'Reconciliation Report',
      description: 'Review matched and unmatched invoices with transaction detail.',
      status: 'Available',
      chipColor: 'success',
      icon: <CompareArrowsRoundedIcon sx={{ color: '#ffd0aa' }} />,
      metrics: [
        `${formatNumber(reconciliationRows.length)} invoice rows`,
        `${formatNumber(matchedTransactions)} matched`,
        `${formatNumber(totalTransactions - matchedTransactions)} unmatched`,
      ],
      actionLabel: 'Scroll to reconciliation',
      href: '#reconciliation-report',
    },
    {
      title: 'Expense Summary',
      description: 'A future report category for categorised spend analysis.',
      status: 'Planned',
      chipColor: 'warning',
      icon: <AssessmentRoundedIcon sx={{ color: '#a9d5ff' }} />,
      metrics: ['Planned backend endpoint', 'Not yet exposed by the API'],
      actionLabel: 'Coming soon',
    },
    {
      title: 'Vendor Analysis',
      description: 'Vendor concentration and spend trends will follow once the source data is available.',
      status: 'Planned',
      chipColor: 'warning',
      icon: <QueryStatsRoundedIcon sx={{ color: '#b7ffd2' }} />,
      metrics: ['Planned backend endpoint', 'Not yet exposed by the API'],
      actionLabel: 'Coming soon',
    },
  ]
}

SummaryCardsGrid.propTypes = {
  loading: PropTypes.bool.isRequired,
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      value: PropTypes.node.isRequired,
      subtitle: PropTypes.node.isRequired,
      icon: PropTypes.node.isRequired,
    }),
  ).isRequired,
}

ReportCatalogGrid.propTypes = {
  reports: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      chipColor: PropTypes.string.isRequired,
      icon: PropTypes.node.isRequired,
      metrics: PropTypes.arrayOf(PropTypes.string).isRequired,
      actionLabel: PropTypes.string.isRequired,
      href: PropTypes.string,
    }),
  ).isRequired,
}

VatReportSection.propTypes = {
  loading: PropTypes.bool.isRequired,
  vatReport: PropTypes.shape({
    totalSubtotal: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalVat: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    invoiceCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  vatInvoices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      invoiceNumber: PropTypes.string,
      vendorName: PropTypes.string,
      invoiceDate: PropTypes.string,
      subtotal: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      vatAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      totalAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      currency: PropTypes.string,
      status: PropTypes.string,
    }),
  ).isRequired,
  currencyCode: PropTypes.string.isRequired,
  onReload: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
}

ReconciliationReportSection.propTypes = {
  loading: PropTypes.bool.isRequired,
  reconciliationRows: PropTypes.arrayOf(
    PropTypes.shape({
      invoiceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      invoiceNumber: PropTypes.string,
      vendorName: PropTypes.string,
      invoiceDate: PropTypes.string,
      invoiceAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      invoiceStatus: PropTypes.string,
      isMatched: PropTypes.bool,
      matchConfidence: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      transactionDescription: PropTypes.string,
      matchMethod: PropTypes.string,
    }),
  ).isRequired,
  currencyCode: PropTypes.string.isRequired,
  matchedTransactions: PropTypes.number.isRequired,
  totalTransactions: PropTypes.number.isRequired,
  matchRate: PropTypes.number.isRequired,
  onReload: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
}

export default ReportsPage
