import PropTypes from 'prop-types'
import {
  Box, Checkbox, Chip, CircularProgress, IconButton, Skeleton, Stack, Switch,
  Table, TableBody, TableCell, TableContainer, TableHead, TablePagination,
  TableRow, TableSortLabel, Tooltip, Typography,
} from '@mui/material'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { normalizeTransactionType, formatTransactionTypeLabel } from '../utils/transactionHelpers'

const typeColors = {
  credit: 'success',
  debit: 'error',
}

export default function TransactionTable({
  transactions,
  loading,
  sortKey,
  sortDirection,
  onSort,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  totalCount,
  selectedTransactionIds,
  onToggleSelectAll,
  onToggleSelect,
  allTransactionsSelected,
  hasTransactionSelection,
  deletingTransactionIds,
  bulkDeletingTransactions,
  onViewDetails,
  onDelete,
  onToggleRequiresInvoice,
}) {
  if (loading) {
    return (
      <Stack spacing={1}>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={`tx-loading-${index + 1}`} variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
        ))}
      </Stack>
    )
  }

  if (transactions.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <DescriptionRoundedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography color="text.secondary">
          {totalCount === 0
            ? 'No transactions yet. Import a CSV above to get started.'
            : 'No transactions match your search criteria.'}
        </Typography>
      </Box>
    )
  }

  const columns = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'vendor', label: 'Vendor', sortable: true, sx: { width: { xs: 140, md: 180 } } },
    { key: 'description', label: 'Description', sortable: true, sx: { width: { xs: 180, md: 260 } } },
    { key: 'amount', label: 'Charge Amount', sortable: true, align: 'center' },
    { key: 'type', label: 'Type', sortable: true, align: 'center', sx: { width: 96 } },
    { key: 'invoice', label: 'Invoice Req.', align: 'center', sortable: false },
    { key: 'category', label: 'Category', sortable: true, sx: { width: { xs: 140, md: 180 } } },
    { key: 'matched', label: 'Matched', sortable: true, align: 'center' },
  ]

  return (
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
                  onChange={onToggleSelectAll}
                />
              </TableCell>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  align={col.align || 'left'}
                  sortDirection={sortKey === col.key ? sortDirection : false}
                  sx={col.sx || {}}
                >
                  {col.sortable ? (
                    <TableSortLabel
                      active={sortKey === col.key}
                      direction={sortKey === col.key ? sortDirection : 'asc'}
                      onClick={() => onSort(col.key)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((tx) => {
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
                      onChange={() => onToggleSelect(tx.id ?? tx.transactionId)}
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
                    <Typography variant="body2" fontWeight={600} color={type === 'credit' ? 'success.main' : 'error.main'}>
                      {type === 'credit' ? '+' : '−'}
                      {Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  <TableCell align="center">
                    <Tooltip title={tx.requiresInvoice === false ? 'No invoice needed — click to require matching' : 'Requires an invoice — click to mark as no invoice needed'}>
                      <Switch
                        size="small"
                        checked={tx.requiresInvoice !== false}
                        onChange={(e) => onToggleRequiresInvoice(tx, e.target.checked)}
                        disabled={matched}
                      />
                    </Tooltip>
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
                      <IconButton size="small" onClick={() => onViewDetails(tx)}>
                        <VisibilityRoundedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(tx)}
                        disabled={deletingTransactionIds.includes(tx.id ?? tx.transactionId) || bulkDeletingTransactions}
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
        count={totalCount}
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          onRowsPerPageChange(Number(event.target.value))
        }}
        rowsPerPageOptions={[10, 20, 50, 100]}
      />
    </Stack>
  )
}

TransactionTable.propTypes = {
  transactions: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  sortKey: PropTypes.string,
  sortDirection: PropTypes.oneOf(['asc', 'desc']),
  onSort: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onRowsPerPageChange: PropTypes.func.isRequired,
  totalCount: PropTypes.number.isRequired,
  selectedTransactionIds: PropTypes.arrayOf(PropTypes.number),
  onToggleSelectAll: PropTypes.func.isRequired,
  onToggleSelect: PropTypes.func.isRequired,
  allTransactionsSelected: PropTypes.bool,
  hasTransactionSelection: PropTypes.bool,
  deletingTransactionIds: PropTypes.arrayOf(PropTypes.number),
  bulkDeletingTransactions: PropTypes.bool,
  onViewDetails: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleRequiresInvoice: PropTypes.func.isRequired,
}
