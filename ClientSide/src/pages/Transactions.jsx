import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Alert, Box, Container, Snackbar, Stack } from '@mui/material'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import AnimatedBackground from '../components/AnimatedBackground'
import ErrorBoundary from '../components/ErrorBoundary'
import PageHeaderCard from '../components/PageHeaderCard'
import GlassCard from '../components/GlassCard'
import TransactionUploadZone from '../components/TransactionUploadZone'
import TransactionImportPreview from '../components/TransactionImportPreview'
import TransactionFilterBar from '../components/TransactionFilterBar'
import TransactionTable from '../components/TransactionTable'
import TransactionImportJobs from '../components/TransactionImportJobs'
import TransactionDetailsModal from '../components/TransactionDetailsModal'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import { useNotification } from '../context/useNotification'
import { useConfirm } from '../components/ConfirmContext'
import {
  bulkDeleteTransactions, deleteTransaction, getTransactionById,
  importExcelTransactions, setRequiresInvoice,
} from '../services/transactions'
import { getUploadJobStatus } from '../services/uploadJobs'
import { useTransactionsByCompanyQuery, useCreateTransactionsBulkMutation } from '../hooks/queries/useTransactionsQueries'
import { useTransactionUpload } from '../hooks/useTransactionUpload'
import { useTransactionImportJobs } from '../hooks/useTransactionImportJobs'
import { transactionKeys } from '../queries/queryKeys'
import {
  exportTransactionsToCSV, filterTransactionsByType, getTransactionTypes, normalizeTransactionType,
} from '../utils/transactionHelpers'
import { containerVariants, itemVariants } from '../utils/motionVariants'

function TransactionsPage() {
  const { token } = useAuth()
  const { activeCompanyId } = useCompany()
  const { notify } = useNotification()
  const { confirm } = useConfirm()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const deepLinkedJobId = Number(searchParams.get('jobId')) || null

  const [deepLinkedJob, setDeepLinkedJob] = useState(null)
  useEffect(() => {
    if (!deepLinkedJobId || !token) return
    let cancelled = false
    getUploadJobStatus(deepLinkedJobId, token)
      .then((job) => { if (!cancelled) setDeepLinkedJob({ job }) })
      .catch((error) => { if (!cancelled) setDeepLinkedJob({ error: error.message || 'This import is no longer available.' }) })
    return () => { cancelled = true }
  }, [deepLinkedJobId, token])

  const { importingJobs, saveTxJobToSession, startTxPolling } = useTransactionImportJobs({ activeCompanyId, token })

  const {
    uploadedFiles, parsedRows, parseError, previewing,
    handleFiles, removeRow, clearUpload, clearParseError,
    validCount, invalidCount,
  } = useTransactionUpload({ activeCompanyId, token })

  const [typeFilter, setTypeFilter] = useState('all')
  const [invoiceFilter, setInvoiceFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [importing, setImporting] = useState(false)
  const [clearingDecision, setClearingDecision] = useState(false)
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' })
  const [detailsModal, setDetailsModal] = useState({ open: false, loading: false, error: '', transaction: null })
  const [selectedTransactionIds, setSelectedTransactionIds] = useState([])
  const [deletingTransactionIds, setDeletingTransactionIds] = useState([])
  const [bulkDeletingTransactions, setBulkDeletingTransactions] = useState(false)

  const filters = useMemo(() => ({
    type: typeFilter !== 'all' ? typeFilter : undefined,
    requiresInvoice: invoiceFilter !== 'all' ? (invoiceFilter === 'required') : undefined,
    searchTerm: searchTerm.trim() || undefined,
    sortBy: sortKey === 'date' ? 'transaction_date'
      : sortKey === 'vendor' ? 'vendor_name'
      : sortKey === 'type' ? 'transaction_type'
      : sortKey === 'matched' ? 'is_matched'
      : sortKey,
    sortDirection: sortDirection.toUpperCase(),
    pageNumber: page + 1,
    pageSize: rowsPerPage,
  }), [typeFilter, invoiceFilter, searchTerm, sortKey, sortDirection, page, rowsPerPage])

  const transactionsQuery = useTransactionsByCompanyQuery({
    companyId: activeCompanyId, token, filters,
  })

  const createBulkMutation = useCreateTransactionsBulkMutation({
    companyId: activeCompanyId, filters, token,
  })

  const listLoading = transactionsQuery.isLoading || transactionsQuery.isFetching

  const pagedData = transactionsQuery.data
  const transactions = Array.isArray(pagedData?.items) ? pagedData.items : (Array.isArray(pagedData) ? pagedData : [])
  const totalCount = pagedData?.totalCount ?? transactions.length
  const listError = transactionsQuery.error?.message || ''

  const transactionTypeOptions = useMemo(() => getTransactionTypes(transactions), [transactions])

  useEffect(() => {
    if (!transactionTypeOptions.includes(typeFilter)) setTypeFilter('all')
  }, [transactionTypeOptions, typeFilter])

  useEffect(() => {
    setPage(0)
  }, [typeFilter, searchTerm])

  const handleSort = useCallback((columnKey) => {
    setSortKey((prev) => {
      if (prev === columnKey) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDirection('asc')
      return columnKey
    })
  }, [])

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage)
  }, [])

  const handleRowsPerPageChange = useCallback((newValue) => {
    setRowsPerPage(newValue)
    setPage(0)
  }, [])

  const visibleTransactionIds = useMemo(
    () => transactions.map((tx) => tx.id ?? tx.transactionId).filter((id) => typeof id === 'number' && id > 0),
    [transactions],
  )

  const allTransactionsSelected = visibleTransactionIds.length > 0 && visibleTransactionIds.every((id) => selectedTransactionIds.includes(id))
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

  const toggleTransactionSelection = useCallback((id) => {
    setSelectedTransactionIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }, [])

  const openTransactionDetails = useCallback(async (tx) => {
    const transactionId = tx?.id ?? tx?.transactionId
    if (!transactionId) return
    setDetailsModal({ open: true, loading: true, error: '', transaction: null })
    try {
      const transaction = await getTransactionById(transactionId, token)
      setDetailsModal({ open: true, loading: false, error: '', transaction })
    } catch (err) {
      setDetailsModal({ open: true, loading: false, error: err.message || 'Failed to load transaction details.', transaction: tx || null })
    }
  }, [token])

  const closeTransactionDetails = useCallback(() => {
    setDetailsModal({ open: false, loading: false, error: '', transaction: null })
  }, [])

  const handleDeleteTransaction = useCallback(async (tx) => {
    const transactionId = tx?.id ?? tx?.transactionId
    if (!transactionId) return
    const confirmed = await confirm(`Delete transaction #${transactionId}? This action cannot be undone.`)
    if (!confirmed) return
    setDeletingTransactionIds((prev) => [...prev, transactionId])
    try {
      await deleteTransaction(transactionId, token)
      queryClient.invalidateQueries({ queryKey: transactionKeys.byCompany(activeCompanyId) })
      setSelectedTransactionIds((prev) => prev.filter((id) => id !== transactionId))
      notify({ message: 'Transaction deleted successfully.', severity: 'success' })
    } catch (err) {
      notify({ message: err.message || 'Failed to delete transaction.', severity: 'error' })
    } finally {
      setDeletingTransactionIds((prev) => prev.filter((id) => id !== transactionId))
    }
  }, [token, queryClient, activeCompanyId, confirm, notify])

  const handleBulkDeleteTransactions = useCallback(async () => {
    if (selectedTransactionIds.length === 0) return
    const confirmed = await confirm(`Delete ${selectedTransactionIds.length} selected transaction(s)? This action cannot be undone.`)
    if (!confirmed) return
    setBulkDeletingTransactions(true)
    try {
      const response = await bulkDeleteTransactions(selectedTransactionIds, token)
      const deletedIds = Array.isArray(response?.deletedIds) ? response.deletedIds : selectedTransactionIds
      const notFoundIds = Array.isArray(response?.notFoundIds) ? response.notFoundIds : []
      setSelectedTransactionIds((prev) => prev.filter((id) => !deletedIds.includes(id)))
      queryClient.invalidateQueries({ queryKey: transactionKeys.byCompany(activeCompanyId) })
      if (notFoundIds.length > 0) {
        notify({ message: `Deleted ${deletedIds.length} transaction(s). ${notFoundIds.length} were not found.`, severity: 'warning' })
      } else {
        notify({ message: `Deleted ${deletedIds.length} transaction(s).`, severity: 'success' })
      }
    } catch (err) {
      notify({ message: err.message || 'Bulk delete failed.', severity: 'error' })
    } finally {
      setBulkDeletingTransactions(false)
    }
  }, [selectedTransactionIds, token, queryClient, activeCompanyId, confirm, notify])

  const handleToggleRequiresInvoice = useCallback(async (tx, newValue) => {
    const id = tx.id ?? tx.transactionId
    try {
      await setRequiresInvoice(id, newValue, token)
      queryClient.invalidateQueries({ queryKey: transactionKeys.byCompany(activeCompanyId) })
    } catch (err) {
      notify({ message: err.message || 'Failed to update transaction classification.', severity: 'error' })
    }
  }, [token, queryClient, activeCompanyId, notify])

  const handleClearUpload = useCallback(async () => {
    const excelFiles = uploadedFiles.filter((file) => file.isExcel)
    if (excelFiles.length === 0) { clearUpload(); return }

    const missingPathFile = excelFiles.find((file) => !file.filePath)
    if (missingPathFile) {
      notify({ message: `Missing saved file path for ${missingPathFile.name}. Please upload again.`, severity: 'warning' })
      return
    }

    setClearingDecision(true)
    try {
      await Promise.all(
        excelFiles.map((file) =>
          importExcelTransactions({ status: 'Deny', savedFilePath: file.filePath, companyId: activeCompanyId, fileOriginalName: file.name }, token),
        ),
      )
      clearUpload()
      notify({ message: 'Uploaded files denied and cleared.', severity: 'success' })
    } catch (err) {
      notify({ message: err.message || 'Failed to deny uploaded files on server.', severity: 'error' })
    } finally {
      setClearingDecision(false)
    }
  }, [uploadedFiles, clearUpload, token, activeCompanyId, notify])

  const handleImport = useCallback(async () => {
    if (!activeCompanyId) { notify({ message: 'Select an assigned company before importing.', severity: 'warning' }); return }
    if (uploadedFiles.length === 0) { notify({ message: 'Upload at least one file before importing.', severity: 'warning' }); return }

    const csvRows = parsedRows.filter((r) => r._valid && r._source === 'csv')
    const excelFiles = uploadedFiles.filter((file) => file.isExcel)
    if (csvRows.length === 0 && excelFiles.length === 0) { notify({ message: 'No valid rows to import.', severity: 'warning' }); return }

    setImporting(true)
    try {
      let totalImported = 0

      for (const file of excelFiles) {
        if (!file.filePath) { notify({ message: `Missing saved file path for ${file.name}. Please re-upload the Excel file.`, severity: 'warning' }); return }
        const response = await importExcelTransactions({ companyId: activeCompanyId, savedFilePath: file.filePath, fileOriginalName: file.name }, token)
        const jobId = response?.jobId ?? response?.JobId
        if (jobId) {
          saveTxJobToSession(jobId, file.name)
          startTxPolling(jobId, file.name)
          continue
        }
        totalImported += response?.count ?? 0
      }

      if (csvRows.length > 0) {
        await createBulkMutation.mutateAsync({
          companyId: activeCompanyId,
          transactions: csvRows.map((r) => ({
            companyId: activeCompanyId, transactionDate: r.transactionDate, description: r.description,
            amount: r.amount, transactionType: r.transactionType, postedDate: r.postedDate || null,
            category: r.category || null, referenceNumber: r.referenceNumber || null, vendorName: r.vendorName || null,
          })),
        })
        totalImported += csvRows.length
      }

      if (totalImported > 0) {
        notify({ message: `Successfully imported ${totalImported} transaction(s).`, severity: 'success' })
        queryClient.invalidateQueries({ queryKey: transactionKeys.byCompany(activeCompanyId) })
      } else if (excelFiles.length > 0) {
        notify({ message: `${excelFiles.length} Excel file(s) queued for import — you can leave this page, we'll keep processing.`, severity: 'info' })
      }
      clearUpload()
    } catch (err) {
      notify({ message: err.message || 'Failed to import transactions.', severity: 'error' })
    } finally {
      setImporting(false)
    }
  }, [parsedRows, uploadedFiles, token, activeCompanyId, queryClient, createBulkMutation, clearUpload, notify, saveTxJobToSession, startTxPolling])

  const handleExport = useCallback(() => {
    const data = Array.isArray(transactionsQuery.data?.items) ? transactionsQuery.data.items : (Array.isArray(transactionsQuery.data) ? transactionsQuery.data : [])
    exportTransactionsToCSV(data)
  }, [transactionsQuery.data])

  return (
    <ErrorBoundary>
      <Box sx={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
        <AnimatedBackground density="medium" />
        <Box sx={{ position: 'relative', zIndex: 1, py: { xs: 4, md: 6 }, overflowX: 'hidden' }}>
          <Container maxWidth={false} disableGutters sx={{ px: { xs: 2, sm: 3, md: 4, xl: 5 }, width: '100%', overflowX: 'hidden' }}>
            <Stack component={motion.div} variants={containerVariants} initial="hidden" animate="show" spacing={3} sx={{ minWidth: 0 }}>
              {deepLinkedJob && (
                <Alert
                  severity={deepLinkedJob.error || deepLinkedJob.job?.status === 'failed' ? 'warning' : 'info'}
                  onClose={() => setDeepLinkedJob(null)}
                >
                  {deepLinkedJob.error || (deepLinkedJob.job?.status === 'failed'
                    ? 'This transaction import failed. You can retry by uploading the file again.'
                    : `Import "${deepLinkedJob.job?.fileOriginalName || `#${deepLinkedJobId}`}" is ${deepLinkedJob.job?.status || 'unavailable'}.`)}
                </Alert>
              )}

              <PageHeaderCard
                title="Transactions"
                description="Import bank & credit card statements, review transactions, and prepare for reconciliation."
                onRefresh={() => transactionsQuery.refetch()}
                refreshDisabled={listLoading}
                variants={itemVariants}
              />

              <TransactionUploadZone
                activeCompanyId={activeCompanyId}
                onFiles={handleFiles}
                previewing={previewing}
                parseError={parseError}
                onDismissError={clearParseError}
              />

              <TransactionImportPreview
                uploadedFiles={uploadedFiles}
                parsedRows={parsedRows}
                validCount={validCount}
                invalidCount={invalidCount}
                importing={importing}
                clearingDecision={clearingDecision}
                onClear={handleClearUpload}
                onImport={handleImport}
                onRemoveRow={removeRow}
              />

              {listError && (
                <Alert severity="error" variant="outlined" onClose={() => {}}>{listError}</Alert>
              )}

              <TransactionImportJobs jobs={importingJobs} />

              <GlassCard variant="default">
                <Box sx={{ p: { xs: 2.2, md: 3 } }}>
                  <TransactionFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    typeFilter={typeFilter}
                    onTypeFilterChange={setTypeFilter}
                    transactionTypeOptions={transactionTypeOptions}
                    invoiceFilter={invoiceFilter}
                    onInvoiceFilterChange={setInvoiceFilter}
                    hasSelection={hasTransactionSelection}
                    selectedCount={selectedTransactionIds.length}
                    bulkDeleting={bulkDeletingTransactions}
                    onBulkDelete={handleBulkDeleteTransactions}
                    onExport={handleExport}
                    totalCount={totalCount}
                    loading={listLoading}
                  />
                  <Box sx={{ mt: 2 }}>
                    <TransactionTable
                      transactions={transactions}
                      loading={listLoading}
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      page={page}
                      rowsPerPage={rowsPerPage}
                      onPageChange={handlePageChange}
                      onRowsPerPageChange={handleRowsPerPageChange}
                      totalCount={totalCount}
                      selectedTransactionIds={selectedTransactionIds}
                      onToggleSelectAll={toggleSelectAllTransactions}
                      onToggleSelect={toggleTransactionSelection}
                      allTransactionsSelected={allTransactionsSelected}
                      hasTransactionSelection={hasTransactionSelection}
                      deletingTransactionIds={deletingTransactionIds}
                      bulkDeletingTransactions={bulkDeletingTransactions}
                      onViewDetails={openTransactionDetails}
                      onDelete={handleDeleteTransaction}
                      onToggleRequiresInvoice={handleToggleRequiresInvoice}
                    />
                  </Box>
                </Box>
              </GlassCard>
            </Stack>
          </Container>
        </Box>

        <TransactionDetailsModal
          open={detailsModal.open}
          loading={detailsModal.loading}
          error={detailsModal.error}
          transaction={detailsModal.transaction}
          onClose={closeTransactionDetails}
        />

        <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>{snack.message}</Alert>
        </Snackbar>
      </Box>
    </ErrorBoundary>
  )
}

export default TransactionsPage
